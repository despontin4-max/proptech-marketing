import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

const SHEET_ID = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';
export const dynamic = 'force-dynamic';

function parseAmount(val: any): number {
  if (!val) return 0;
  let s = String(val).replace(/[$A-Za-z\s]/g, '').trim();
  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (s.includes(',')) {
    if (s.split(',').pop()?.length === 3) s = s.replace(/,/g, '');
    else s = s.replace(',', '.');
  } else if (s.includes('.')) {
    if (s.split('.').pop()?.length === 3) s = s.replace(/\./g, '');
  }
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
 * GET /api/resumen-mes?mes=octubre | septiembre
 * Devuelve el estado de cobro de todos los clientes activos para el mes seleccionado.
 * Seguridad: Solo el Administrador recibe totalRecaudado. Para empleados es estrictamente nulo.
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('ah_session')?.value ||
    request.headers.get('authorization')?.replace(/Bearer\s+/i, '').trim() ||
    request.headers.get('x-session-token')?.trim();
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const isAdmin = session.rol?.toUpperCase() === 'ADMIN';

  const { searchParams } = new URL(request.url);
  const paramMes = (searchParams.get('mes') || 'octubre').toLowerCase().trim();

  try {
    if (paramMes === 'septiembre') {
      // ── CASO SEPTIEMBRE (HISTÓRICO OFICIAL CERRADO) ─────────────────────
      const resSep = await fetch(
        `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=SEPTIEMBRE_2026&_t=${Date.now()}`,
        { cache: 'no-store' }
      );

      if (!resSep.ok) {
        return NextResponse.json({ error: `Error leyendo histórico septiembre: ${resSep.status}` }, { status: 502 });
      }

      const textSep = await resSep.text();
      const rowsSep = parseCSV(textSep).slice(1).filter(r => r[0]?.trim());

      const resumen = rowsSep.map(row => {
        const cod = row[0]?.trim() || '';
        const soli = row[1]?.trim() || '';
        const nombre = row[2]?.trim() || '';
        const plan = row[7]?.trim() || '';
        const cuotaNum = row[8]?.trim() || '1';
        const valorCuota = parseAmount(row[9]);
        const verificado = String(row[12] || '').toUpperCase() === 'TRUE';
        const fechaPagoReal = row[15]?.trim() || '';
        const estado = row[10]?.trim() || 'ACTIVO';

        if (estado.toUpperCase() === 'INACTIVO') return null;

        const pagoCubierto = Boolean(fechaPagoReal || verificado);
        const pagadoMes = pagoCubierto ? valorCuota : 0;

        return {
          cod,
          soli,
          nombre,
          plan,
          cuotaNum,
          valorCuota,
          pagadoMes: isAdmin ? pagadoMes : undefined,
          pagoCubierto,
          fechaPago: fechaPagoReal || (verificado ? 'Septiembre 2026' : null),
          estadoPago: pagoCubierto ? ('PAGADO' as const) : ('PENDIENTE' as const),
        };
      }).filter(Boolean);

      const pagados = resumen.filter((r: any) => r.estadoPago === 'PAGADO');
      const pendientes = resumen.filter((r: any) => r.estadoPago === 'PENDIENTE');
      const totalRecaudado = isAdmin
        ? pagados.reduce((sum: number, r: any) => sum + (r.valorCuota || 0), 0)
        : null;

      return NextResponse.json({
        success: true,
        mes: 'Septiembre 2026',
        selectedMes: 'septiembre',
        isAdmin,
        resumen: {
          total: resumen.length,
          pagados: pagados.length,
          pendientes: pendientes.length,
          totalRecaudado,
        },
        pagados,
        pendientes,
      });

    } else {
      // ── CASO OCTUBRE (MES EN CURSO) ──────────────────────────────────────
      const [resClientes, resCC] = await Promise.all([
        fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=OCTUBRE_2026&_t=${Date.now()}`, { cache: 'no-store' }),
        fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2_CUENTA_CORRIENTE&_t=${Date.now()}`, { cache: 'no-store' }),
      ]);

      const [textClientes, textCC] = await Promise.all([resClientes.text(), resCC.text()]);
      
      const rowsClientes = parseCSV(textClientes).slice(1).filter(r => r[0]?.trim());
      const rowsCC = parseCSV(textCC).slice(1).filter(r => r[0]?.trim() || r[2]?.trim());

      const anioNum = 2026;
      const mesNum = 10; // Octubre

      // Mapear pagos de octubre en 2_CUENTA_CORRIENTE
      const pagosOctubre = new Map<string, { haber: number; fecha: string }>();
      for (const row of rowsCC) {
        const cod = row[2]?.trim();
        if (!cod) continue;

        const fechaPago = row[1]?.trim() || row[0]?.trim();
        const concepto = (row[4] || '').toLowerCase();
        let esOctubre = false;

        if (fechaPago) {
          const parts = fechaPago.replace(/[^\d\/]/g, '').split('/');
          if (parts.length >= 3) {
            const m = parseInt(parts[1], 10);
            const y = parseInt(parts[2], 10);
            const yNormalized = y < 100 ? 2000 + y : y;
            if (m === mesNum && yNormalized === anioNum) esOctubre = true;
          }
        }

        if (!esOctubre && concepto.includes('octubre')) {
          esOctubre = true;
        }

        if (esOctubre) {
          const haber = parseAmount(row[8]);
          const prev = pagosOctubre.get(cod) || { haber: 0, fecha: fechaPago };
          pagosOctubre.set(cod, { haber: prev.haber + haber, fecha: fechaPago || prev.fecha });
        }
      }

      const resumen = rowsClientes.map(row => {
        const cod = row[0]?.trim() || '';
        const soli = row[1]?.trim() || '';
        const nombre = row[2]?.trim() || '';
        const plan = row[7]?.trim() || '';
        const cuotaNum = row[8]?.trim() || '1';
        const valorCuota = parseAmount(row[9]);
        const verificado = String(row[12] || '').toUpperCase() === 'TRUE';
        const estado = row[10]?.trim() || 'ACTIVO';
        const fechaPagoReal = row[15]?.trim() || '';

        if (estado.toUpperCase() === 'INACTIVO') return null;

        const pagoCC = pagosOctubre.get(cod);
        const pagadoEnCC = (pagoCC?.haber || 0);
        const tienePagoRealEnHoja = Boolean(fechaPagoReal && (fechaPagoReal.includes('/10/') || fechaPagoReal.includes('/10/26') || fechaPagoReal.includes('10/2026')));

        const pagoCubierto = verificado || pagadoEnCC >= (valorCuota * 0.8) || tienePagoRealEnHoja;
        const totalAbonado = pagadoEnCC > 0 ? pagadoEnCC : (pagoCubierto ? valorCuota : 0);

        return {
          cod,
          soli,
          nombre,
          plan,
          cuotaNum,
          valorCuota,
          pagadoMes: isAdmin ? totalAbonado : undefined,
          pagoCubierto,
          fechaPago: pagoCC?.fecha || fechaPagoReal || null,
          estadoPago: pagoCubierto ? ('PAGADO' as const) : ('PENDIENTE' as const),
        };
      }).filter(Boolean);

      const pagados = resumen.filter((r: any) => r.estadoPago === 'PAGADO');
      const pendientes = resumen.filter((r: any) => r.estadoPago === 'PENDIENTE');
      const totalRecaudado = isAdmin
        ? pagados.reduce((sum: number, r: any) => sum + (r.valorCuota || 0), 0)
        : null;

      return NextResponse.json({
        success: true,
        mes: 'Octubre 2026',
        selectedMes: 'octubre',
        isAdmin,
        resumen: {
          total: resumen.length,
          pagados: pagados.length,
          pendientes: pendientes.length,
          totalRecaudado,
        },
        pagados,
        pendientes,
      });
    }

  } catch (error: any) {
    console.error('[/api/resumen-mes]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
