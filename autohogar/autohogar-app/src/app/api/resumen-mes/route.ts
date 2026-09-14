import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

const SHEET_ID = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';
export const dynamic = 'force-dynamic';

function parseAmount(val: any): number {
  if (!val) return 0;
  const s = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return parseFloat(s) || 0;
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i], nx = text[i + 1];
    if (ch === '"' && inQ && nx === '"') { cell += '"'; i++; }
    else if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { row.push(cell.trim()); cell = ''; }
    else if ((ch === '\n' || (ch === '\r' && nx === '\n')) && !inQ) {
      if (ch === '\r') i++;
      row.push(cell.trim()); rows.push(row); row = []; cell = '';
    } else { cell += ch; }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

/**
 * GET /api/resumen-mes
 * Devuelve el estado de cobro de todos los clientes activos para el mes actual.
 * Cruza 1_CLIENTES con 2_CUENTA_CORRIENTE para determinar quién pagó y quién no.
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    // Leer ambas pestañas en paralelo
    const [resClientes, resCC] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=1_CLIENTES`, { cache: 'no-store' }),
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2_CUENTA_CORRIENTE`, { cache: 'no-store' }),
    ]);

    const [textClientes, textCC] = await Promise.all([resClientes.text(), resCC.text()]);
    
    const rowsClientes = parseCSV(textClientes).slice(1).filter(r => r[0]?.trim());
    const rowsCC = parseCSV(textCC).slice(1).filter(r => r[0]?.trim() || r[2]?.trim());

    // Mes actual (ej: "septiembre 2026")
    const ahora = new Date();
    const mesActual = ahora.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
    const mesNum = ahora.getMonth() + 1; // 1-12
    const anioNum = ahora.getFullYear();

    // Índice de pagos por cod_cuenta para el mes actual
    // CC: A=FECHA_VTO, B=FECHA_PAGO, C=COD_CUENTA, E=CONCEPTO, I=HABER
    const pagosMesActual = new Map<string, number>(); // cod -> total pagado este mes
    for (const row of rowsCC) {
      const cod = row[2]?.trim();
      if (!cod) continue;
      // Detectar si el pago es del mes actual por FECHA_PAGO (col B) o CONCEPTO (col E)
      const fechaPago = row[1]?.trim() || row[0]?.trim();
      const concepto = (row[4] || '').toLowerCase();
      let esMesActual = false;

      if (fechaPago) {
        // Formatos posibles: "11/9/2026", "11/09/2026"
        const parts = fechaPago.replace(/[^\d\/]/g, '').split('/');
        if (parts.length >= 3) {
          const m = parseInt(parts[1]);
          const y = parseInt(parts[2]);
          if (m === mesNum && y === anioNum) esMesActual = true;
        }
      }

      // Fallback: buscar el mes en el concepto (ej: "Cuota N° 39 - septiembre 2026")
      if (!esMesActual && concepto.includes(mesActual.toLowerCase())) {
        esMesActual = true;
      }

      if (esMesActual) {
        const haber = parseAmount(row[8]); // col I = HABER
        pagosMesActual.set(cod, (pagosMesActual.get(cod) || 0) + haber);
      }
    }

    // Construir resumen por cliente
    const resumen = rowsClientes.map(row => {
      const cod = row[0]?.trim() || '';
      const soli = row[1]?.trim() || '';
      const nombre = row[2]?.trim() || '';
      const plan = row[7]?.trim() || '';
      const valorCuota = parseAmount(row[9]);
      const cuotasPactadas = parseFloat(row[11]) || 0;
      const verificado = String(row[12] || '').toUpperCase() === 'TRUE';
      const estado = row[10]?.trim() || 'ACTIVO';

      // Solo mostrar clientes activos y verificados
      if (!verificado || estado.toUpperCase() === 'INACTIVO') return null;

      const pagadoMes = pagosMesActual.get(cod) || 0;
      const pagoCubierto = pagadoMes >= valorCuota * 0.9; // 90% de tolerancia

      return {
        cod, soli, nombre, plan, valorCuota, cuotasPactadas,
        pagadoMes,
        pagoCubierto,
        estadoPago: pagoCubierto ? 'PAGADO' : 'PENDIENTE',
      };
    }).filter(Boolean);

    const pagados = resumen.filter((r: any) => r.estadoPago === 'PAGADO');
    const pendientes = resumen.filter((r: any) => r.estadoPago === 'PENDIENTE');
    const totalRecaudado = pagados.reduce((sum: number, r: any) => sum + r.pagadoMes, 0);

    return NextResponse.json({
      success: true,
      mes: mesActual,
      resumen: { total: resumen.length, pagados: pagados.length, pendientes: pendientes.length, totalRecaudado },
      pagados,
      pendientes,
    });
  } catch (error: any) {
    console.error('[/api/resumen-mes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
