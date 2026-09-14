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
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cod = searchParams.get('cod')?.trim();
  const cuotasPactadas = parseFloat(searchParams.get('cuotasPactadas') || '0');
  const valorCuota = parseAmount(searchParams.get('valorCuota') || '0');

  if (!cod) return NextResponse.json({ error: 'cod requerido' }, { status: 400 });

  try {
    // Leer 2_CUENTA_CORRIENTE via GViz (público, sin auth)
    // Columnas: A=FECHA_VTO, B=FECHA_PAGO, C=COD_CUENTA, D=CLIENTE, E=CONCEPTO,
    //           F=MEDIO_PAGO, G=VERIFICACION, H=DEBE, I=HABER, J=NRO_ANTICIPO, K=OPERADOR
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=2_CUENTA_CORRIENTE`;
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

    // Calcular métricas financieras
    const totalPagado = pagosCliente.reduce((sum, p) => sum + p.haber, 0);
    const cuotasPagadasPorMonto = valorCuota > 0 ? Math.floor(totalPagado / valorCuota) : pagosCliente.length;
    const proximaCuota = cuotasPagadasPorMonto + 1;
    const deudaTotal = cuotasPactadas > 0 && valorCuota > 0
      ? (cuotasPactadas * valorCuota) - totalPagado
      : null;

    // Último pago: última fila del cliente
    const ultimoPago = pagosCliente.length > 0 ? pagosCliente[pagosCliente.length - 1].fecha : null;

    return NextResponse.json({
      success: true,
      cod,
      registros: pagosCliente.length,
      cuotasPagadas: cuotasPagadasPorMonto,
      proximaCuota,
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
