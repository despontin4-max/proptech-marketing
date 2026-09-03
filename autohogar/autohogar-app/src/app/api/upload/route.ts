import { NextResponse } from 'next/server';
import * as xlsx from 'xlsx';
import { getMasterClients, ClientRecord } from '@/utils/googleSheets';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper function to normalize text
function normalize(text: any) {
  if (!text) return "";
  return text.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

// Helper to find column index matching any candidate strings
function getColIndex(headers: any[], candidates: string[]): number {
  if (!headers || !Array.isArray(headers)) return -1;
  return headers.findIndex(h => {
    if (!h) return false;
    const normH = normalize(h);
    return candidates.some(c => normH.includes(normalize(c)));
  });
}

export async function POST(request: Request) {
  try {
    // ── Autenticación ──────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('ah_session')?.value;
    if (!verifySession(token || '')) {
      return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
    }

    // ── Rate Limiting (30 uploads/min por IP) ─────────────────────────────────
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rl = checkRateLimit(ip, { key: 'upload', maxRequests: 30, windowMs: 60_000 });
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un minuto.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Read uploaded Excel file
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const excelData = xlsx.utils.sheet_to_json<any[]>(workbook.Sheets[sheetName], { header: 1 });

    if (!excelData || excelData.length === 0) {
      return NextResponse.json({ error: 'El archivo Excel está vacío' }, { status: 400 });
    }

    // 2. Detect header row dynamically
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(10, excelData.length); i++) {
      const row = excelData[i];
      if (Array.isArray(row)) {
        const rowStr = row.map(cell => normalize(cell)).join(' ');
        if (rowStr.includes('CLIENTE') || rowStr.includes('NOMBRE') || rowStr.includes('SOLI') || rowStr.includes('CONTRATO')) {
          headerRowIndex = i;
          break;
        }
      }
    }

    if (headerRowIndex === -1) {
      headerRowIndex = 0;
    }

    const headers = excelData[headerRowIndex] || [];
    const dataRows = excelData.slice(headerRowIndex + 1);

    // Dynamic Column Index Lookup
    const colCod = getColIndex(headers, ['CODIGO', 'COD']);
    const colSoli = getColIndex(headers, ['SOLI', 'SOLICITUD', 'CONTRATO']);
    const colCliente = getColIndex(headers, ['CLIENTE', 'NOMBRE', 'TITULAR', 'APELLIDO']);
    const colDni = getColIndex(headers, ['DNI', 'DOCUMENTO', 'CEDULA']);
    const colTel = getColIndex(headers, ['TELEFONO', 'TEL', 'CELULAR']);
    const colDireccion = getColIndex(headers, ['DIRECCION', 'DOMICILIO']);
    const colLocalidad = getColIndex(headers, ['LOCALIDAD', 'CIUDAD', 'BARRIO']);
    const colPlan = getColIndex(headers, ['PLAN', 'PRODUCTO']);
    const colCuota = getColIndex(headers, ['CUOTAS PAGADAS', 'N° CUOTA ACT', 'CUOTA ACT', 'N° CUOTA', 'CUOTA']);
    const colImporte = getColIndex(headers, ['VALOR CUOTA', 'IMPORTE', 'VALOR', 'MONTO']);
    const colMedioPago = getColIndex(headers, ['MEDIO DE PAGO', 'MEDIO', 'FORMA DE PAGO']);
    const colVencimiento = getColIndex(headers, ['VENCIMIENTO', 'FECHA DE VENCIMIENTO']);
    const colHistory = getColIndex(headers, ['HISTORIAL DE PAGOS', 'HISTORIAL', 'ANTECEDENTES']);
    const colOficina = getColIndex(headers, ['OFICINA', 'EFECTIVO']);
    const colBcoElect = getColIndex(headers, ['ELECTRONICO', 'BANCO', 'MERCADO PAGO', 'TRANSFERENCIA']);

    // 3. Load Master Database from Google Sheets (or fallback)
    const masterData = await getMasterClients();

    // 4. Process and Cross-reference Data
    const processedRecords = [];

    for (const row of dataRows) {
      if (!Array.isArray(row) || row.length === 0) continue;

      const codVal = colCod !== -1 ? row[colCod] : row[0];
      const clienteVal = colCliente !== -1 ? row[colCliente] : (colSoli !== -1 ? row[2] : row[1]);

      if (!codVal && !clienteVal) continue;

      const name = clienteVal ? String(clienteVal).trim() : '';
      const cod = codVal ? String(codVal).trim() : '';
      const normName = normalize(name);

      // Cross reference with master DB
      const match: ClientRecord | Record<string, never> = 
        masterData.find(m => String(m.cod) === cod && normalize(m.name) === normName) || 
        masterData.find(m => normalize(m.name) === normName) ||
        masterData.find(m => String(m.cod) === cod) || {};

      const soliVal = colSoli !== -1 ? row[colSoli] : (match.soli || 'SIN CONTRATO');
      const dniVal = colDni !== -1 ? row[colDni] : (match.dni || 'FALTA DNI');
      const phoneVal = colTel !== -1 ? row[colTel] : (match.phone || 'NO REGISTRA');
      const addressVal = colDireccion !== -1 && row[colDireccion] ? row[colDireccion] : (match.address || '');
      const cityVal = colLocalidad !== -1 && row[colLocalidad] ? row[colLocalidad] : (match.city || 'SAN JUAN');
      const planVal = colPlan !== -1 && row[colPlan] ? row[colPlan] : (match.plan || 'FALTA PLAN');
      const cuotaVal = colCuota !== -1 && row[colCuota] ? row[colCuota] : (match.cuotaNum || '0');
      const importeVal = colImporte !== -1 && row[colImporte] ? row[colImporte] : (match.amount || '0');
      const dueDateVal = colVencimiento !== -1 && row[colVencimiento] ? row[colVencimiento] : (match.dueDate || '15/08/26');
      const historyVal = colHistory !== -1 && row[colHistory] ? row[colHistory] : (match.history || 'SIN HISTORIAL');

      // Limpiar teléfono: xlsx convierte celdas numéricas a float (ej: 2645413291.0)
      const rawPhoneVal = colTel !== -1 ? row[colTel] : (match.phone || '');
      const cleanedPhone = rawPhoneVal ? String(rawPhoneVal).replace(/\.0+$/, '').trim() : '';

      let medioPago = 'NO DEFINIDO';
      if (colMedioPago !== -1 && row[colMedioPago]) {
        medioPago = String(row[colMedioPago]).toUpperCase();
      } else {
        const xOficina = colOficina !== -1 ? row[colOficina] : row[11];
        const bcoOElect = colBcoElect !== -1 ? row[colBcoElect] : row[12];
        if (xOficina) medioPago = 'OFICINA (EFECTIVO/POSNET)';
        else if (bcoOElect) medioPago = 'MEDIO ELECTRONICO';
      }

      processedRecords.push({
        id: crypto.randomUUID(),
        cod: cod || (match.cod ? String(match.cod) : ''),
        contrato: soliVal ? String(soliVal) : '',
        cliente: name || (match.name ? String(match.name) : ''),
        telefono: cleanedPhone,
        dni: dniVal ? String(dniVal) : '',
        address: addressVal ? String(addressVal) : '',
        city: cityVal ? String(cityVal) : '',
        plan: planVal ? String(planVal) : '',
        medio_pago: medioPago,
        cuota: cuotaVal ? String(cuotaVal) : '0',
        importe: importeVal ? String(importeVal) : '0',
        dueDate: dueDateVal ? String(dueDateVal) : '15/08/26',
        history: historyVal ? String(historyVal) : '',
        status: 'pending'
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Archivo procesado con éxito',
      records: processedRecords 
    });

  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
