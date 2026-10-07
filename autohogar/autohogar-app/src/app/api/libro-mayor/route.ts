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

export interface ClienteLibroMayor {
  cod: string;
  soli: string;
  nombre: string;
  dni: string;
  telefono: string;
  plan: string;
  cuotaExigible: number;
  valorCuota: number;
  cuotasAdeudadas: number;
  cuotasFaltantes: number[];
  detalleCuotasImpagas: string;
  deudaExigible: number;
  estadoMora: 'BAJA_AUTOMATICA' | 'MORA_LEVE' | 'AL_DIA';
  ultimoPago: string | null;
  ultimoMedioPago: string | null;
  fechaVto: string;
  pagadoEsteMes: boolean;
}

/**
 * GET /api/libro-mayor
 * Auditoría completa del Libro Mayor de Cuotas Impagas y Cuentas Corrientes.
 * Cruza en tiempo real 1_CLIENTES y 2_CUENTA_CORRIENTE.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('ah_session')?.value ||
    request.headers.get('authorization')?.replace(/Bearer\s+/i, '').trim() ||
    request.headers.get('x-session-token')?.trim();
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const [resClientes, resCC] = await Promise.all([
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=1_CLIENTES&_t=${Date.now()}`, { cache: 'no-store' }),
      fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2_CUENTA_CORRIENTE&_t=${Date.now()}`, { cache: 'no-store' }),
    ]);

    const [textClientes, textCC] = await Promise.all([resClientes.text(), resCC.text()]);

    const rowsClientes = parseCSV(textClientes).slice(1).filter(r => r[0]?.trim());
    const rowsCC = parseCSV(textCC).slice(1).filter(r => r[0]?.trim() || r[2]?.trim());

    // Mapeo de movimientos de 2_CUENTA_CORRIENTE por cod_cuenta
    // CC: A=FECHA_VTO, B=FECHA_PAGO, C=COD_CUENTA, D=CLIENTE, E=CONCEPTO,
    //     F=MEDIO_PAGO, G=VERIFICACION, H=DEBE, I=HABER, J=NRO_ANTICIPO, K=OPERADOR
    const ccPorCliente = new Map<string, { cuotas: Set<number>; ultimoPago: string; ultimoMedio: string; totalHaber: number }>();

    for (const row of rowsCC) {
      const cod = row[2]?.trim();
      if (!cod) continue;

      if (!ccPorCliente.has(cod)) {
        ccPorCliente.set(cod, { cuotas: new Set<number>(), ultimoPago: '', ultimoMedio: '', totalHaber: 0 });
      }
      const item = ccPorCliente.get(cod)!;

      const nroAnticipo = parseInt(String(row[9] || '0').replace(/[^0-9]/g, ''), 10);
      if (nroAnticipo > 0) {
        item.cuotas.add(nroAnticipo);
      }

      const haber = parseAmount(row[8]);
      item.totalHaber += haber;

      const fechaPago = row[1]?.trim() || row[0]?.trim();
      if (fechaPago) item.ultimoPago = fechaPago;

      const medio = row[5]?.trim();
      if (medio) item.ultimoMedio = medio;
    }

    const clientesAuditoria: ClienteLibroMayor[] = [];

    for (const r of rowsClientes) {
      const cod = r[0]?.trim() || '';
      const soli = r[1]?.trim() || '';
      const nombre = r[2]?.trim() || '';
      const dni = r[3]?.trim() || '';
      const telefono = r[4]?.trim() || '';
      const plan = r[7]?.trim() || '';
      const cuotaExigible = parseInt(String(r[8] || '1').replace(/[^0-9]/g, ''), 10) || 1;
      const valorCuota = parseAmount(r[9]);
      const estadoCol = (r[10] || 'ACTIVO').trim().toUpperCase();
      const verificado = String(r[12] || '').toUpperCase() === 'TRUE';
      const fechaVto = r[14]?.trim() || '15/10/26';
      const fechaPagoReal = r[15]?.trim() || '';
      const notasCobranza = (r[18] || '').trim().toUpperCase();

      if (estadoCol === 'INACTIVO') continue;

      const cc = ccPorCliente.get(cod);
      const cuotasPagadasEnCC = cc ? cc.cuotas : new Set<number>();
      const pagadoEsteMes = Boolean(fechaPagoReal || cuotasPagadasEnCC.has(cuotaExigible));

      // Detección precisa de cuotas adeudadas
      const cuotasFaltantes: number[] = [];

      // Si no pagó la cuota exigible del mes, se computa como faltante
      if (!pagadoEsteMes) {
        cuotasFaltantes.push(cuotaExigible);
      }

      // Si el cliente está marcado en MORA en Col 10 o en NOTAS_COBRANZA tiene mora previa
      const estabaEnMoraPrevia = estadoCol === 'MORA' || notasCobranza.includes('MORA') || notasCobranza.includes('BAJA');
      if (estabaEnMoraPrevia && cuotaExigible > 1) {
        const cuotaAnterior = cuotaExigible - 1;
        if (!cuotasFaltantes.includes(cuotaAnterior) && !cuotasPagadasEnCC.has(cuotaAnterior)) {
          cuotasFaltantes.unshift(cuotaAnterior); // Colocar la más antigua primero
        }
      }

      // Si en CC faltan cuotas entre la 1 y cuotaExigible
      for (let c = 1; c < cuotaExigible; c++) {
        if (!cuotasPagadasEnCC.has(c) && estabaEnMoraPrevia && !cuotasFaltantes.includes(c)) {
          cuotasFaltantes.unshift(c);
        }
      }

      cuotasFaltantes.sort((a, b) => a - b);

      const cuotasAdeudadas = cuotasFaltantes.length;
      let estadoMora: 'BAJA_AUTOMATICA' | 'MORA_LEVE' | 'AL_DIA' = 'AL_DIA';

      if (cuotasAdeudadas >= 2) {
        estadoMora = 'BAJA_AUTOMATICA';
      } else if (cuotasAdeudadas === 1) {
        estadoMora = 'MORA_LEVE';
      } else {
        estadoMora = 'AL_DIA';
      }

      const deudaExigible = cuotasAdeudadas * valorCuota;
      const detalleCuotasImpagas = cuotasFaltantes.length > 0
        ? cuotasFaltantes.join(', ')
        : 'Al día';

      const ultimoPago = fechaPagoReal || (cc ? cc.ultimoPago : null);
      const ultimoMedioPago = cc ? cc.ultimoMedio : (r[16]?.trim() || null);

      clientesAuditoria.push({
        cod,
        soli,
        nombre,
        dni,
        telefono,
        plan,
        cuotaExigible,
        valorCuota,
        cuotasAdeudadas,
        cuotasFaltantes,
        detalleCuotasImpagas,
        deudaExigible,
        estadoMora,
        ultimoPago,
        ultimoMedioPago,
        fechaVto,
        pagadoEsteMes,
      });
    }

    // Ordenar: primero los en Baja Automática (≥2 cuotas), luego Mora Leve, luego Al Día
    const ordenEstados = { BAJA_AUTOMATICA: 0, MORA_LEVE: 1, AL_DIA: 2 };
    clientesAuditoria.sort((a, b) => {
      const cmp = ordenEstados[a.estadoMora] - ordenEstados[b.estadoMora];
      if (cmp !== 0) return cmp;
      return b.cuotasAdeudadas - a.cuotasAdeudadas;
    });

    const kpis = {
      total: clientesAuditoria.length,
      bajaAutomatica: clientesAuditoria.filter(c => c.estadoMora === 'BAJA_AUTOMATICA').length,
      moraLeve: clientesAuditoria.filter(c => c.estadoMora === 'MORA_LEVE').length,
      alDia: clientesAuditoria.filter(c => c.estadoMora === 'AL_DIA').length,
      deudaTotalExigible: clientesAuditoria.reduce((sum, c) => sum + c.deudaExigible, 0),
    };

    return NextResponse.json({
      success: true,
      kpis,
      clientes: clientesAuditoria,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[/api/libro-mayor]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
