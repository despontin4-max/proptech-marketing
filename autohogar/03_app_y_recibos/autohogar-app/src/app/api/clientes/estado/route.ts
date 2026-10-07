import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

const SHEET_ID = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';

export const dynamic = 'force-dynamic';

function parseAmount(val: any): number {
  if (!val) return 0;
  const str = String(val).replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
  return parseFloat(str) || 0;
}

/**
 * GET /api/clientes/estado?cod=XXXX
 * Lee 2_CUENTA_CORRIENTE y calcula el estado financiero del cliente:
 *   - cuotasPagadas: cuántas cuotas ya se registraron
 *   - proximaCuota: la siguiente a cobrar
 *   - totalPagado: suma de "Haber" en CC
 *   - saldoDeudor: deuda pendiente (requiere cuotasPactadas y valorCuota del cliente)
 *   - ultimoPago: fecha del último pago registrado
 */
export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get('ah_session')?.value ||
    request.headers.get('authorization')?.replace(/Bearer\s+/i, '').trim() ||
    request.headers.get('x-session-token')?.trim();
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cod = searchParams.get('cod')?.trim();
  const cuotasPactadas = parseFloat(searchParams.get('cuotasPactadas') || '0');
  const valorCuota = parseAmount(searchParams.get('valorCuota') || '0');
  const estadoCliente = (searchParams.get('estado') || '').toUpperCase().trim();

  if (!cod) return NextResponse.json({ error: 'cod requerido' }, { status: 400 });

  try {
    // Leer 2_CUENTA_CORRIENTE via GViz (público, sin auth)
    // Columnas: A=FECHA_VTO, B=FECHA_PAGO, C=COD_CUENTA, D=CLIENTE, E=CONCEPTO,
    //           F=MEDIO_PAGO, G=VERIFICACION, H=DEBE, I=HABER, J=NRO_ANTICIPO, K=OPERADOR
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2_CUENTA_CORRIENTE&_t=${Date.now()}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (!res.ok) {
      return NextResponse.json({ error: `GViz HTTP ${res.status}` }, { status: 502 });
    }

    const text = await res.text();
    const lines = text.split('\n').slice(1); // skip header

    // Filtrar filas del cliente por cod_cuenta (Columna C = índice 2)
    const pagosCliente: { fecha: string; haber: number; cuota: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parser CSV simple para esta fila
      const cells = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
      const codCelda = cells[2] || '';

      if (codCelda === cod) {
        const haberStr = cells[8] || '0'; // Columna I = HABER
        const nroAnticipo = cells[9] || ''; // Columna J = NRO_ANTICIPO
        const fechaPago = cells[1] || cells[0] || ''; // Columna B = FECHA_PAGO
        pagosCliente.push({
          fecha: fechaPago,
          haber: parseAmount(haberStr),
          cuota: nroAnticipo,
        });
      }
    }

    // Calcular métricas financieras y Libro Mayor de Cuotas Impagas
    const totalPagado = pagosCliente.reduce((sum, p) => sum + p.haber, 0);
    const cuotasPagadasPorMonto = valorCuota > 0 ? Math.floor(totalPagado / valorCuota) : pagosCliente.length;
    const proximaCuota = cuotasPagadasPorMonto + 1;
    const deudaTotal = cuotasPactadas > 0 && valorCuota > 0
      ? (cuotasPactadas * valorCuota) - totalPagado
      : null;

    // Cuota contractual exigible del mes actual (Columna I)
    const cuotaExigible = parseInt(searchParams.get('cuotaActual') || '1', 10);
    const cuotasPagadasSet = new Set(
      pagosCliente.map(p => parseInt(String(p.cuota || '0').replace(/[^0-9]/g, ''), 10)).filter(n => !isNaN(n) && n > 0)
    );

    // Detección real de cuotas atrasadas del período inmediato
    // En este CRM, 2_CUENTA_CORRIENTE solo registra pagos recientes desde septiembre 2026.
    // Un cliente en cuota 70 pagó históricamente 69 cuotas en períodos anteriores.
    const cuotasFaltantes: number[] = [];
    const cuotaAnterior = cuotaExigible > 1 ? cuotaExigible - 1 : 0;

    // Verificar si adeuda el mes anterior (Septiembre)
    if (cuotaAnterior > 0 && !cuotasPagadasSet.has(cuotaAnterior)) {
      cuotasFaltantes.push(cuotaAnterior);
    }

    const cuotasAdeudadas = cuotasFaltantes.length;
    // Baja automática solo si está explícitamente en BAJA o adeuda 3+ cuotas consecutivas
    const esBajaAutomatica = estadoCliente.includes('BAJA') || cuotasAdeudadas >= 3;
    const cuotaMasAntigua = cuotasFaltantes.length > 0 ? cuotasFaltantes[0] : cuotaExigible;
    const detalleCuotasImpagas = cuotasFaltantes.length > 0 ? `Cuota N° ${cuotasFaltantes.join(', ')}` : 'Al día';

    // Último pago: última fila del cliente
    const ultimoPago = pagosCliente.length > 0 ? pagosCliente[pagosCliente.length - 1].fecha : null;

    return NextResponse.json({
      success: true,
      cod,
      registros: pagosCliente.length,
      cuotasPagadas: cuotasPagadasPorMonto,
      proximaCuota,
      cuotaExigible,
      cuotasAdeudadas,
      cuotasFaltantes,
      cuotaMasAntigua,
      detalleCuotasImpagas,
      esBajaAutomatica,
      totalPagado,
      deudaTotal,
      ultimoPago,
      historial: pagosCliente.slice(-6), // últimas 6 cuotas para mostrar en el modal
    });

  } catch (error: any) {
    console.error('[/api/clientes/estado]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
