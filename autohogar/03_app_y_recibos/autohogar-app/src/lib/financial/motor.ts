/**
 * Motor Financiero AutoHogar
 * Calcula estado de cuenta, mora, acumulado y fecha próxima llamada.
 */

export interface HistorialPago {
  nro_solicitud: string | number;
  fecha_pago: string;       // DD/MM/YYYY o ISO
  importe: number;
  tipo: 'PAGO' | 'REINTEGRO' | 'AJUSTE';
  estado: 'PAGADO' | 'MORA' | 'PENDIENTE';
  cuota_num: number;
  operador?: string;
}

export interface FinancialSummary {
  montoPagado: number;       // suma de todos los pagos efectivos
  montoAcumulado: number;    // monto que debería haber pagado hasta hoy
  cuotasPagadas: number;
  cuotasEnMora: number;
  reintegros: number;        // total de reintegros
  saldoFavor: number;        // reintegros - mora debt
  fechaProximaLlamada: string; // DD/MM/YYYY
  estado: 'AL_DIA' | 'EN_MORA' | 'REINTEGRO_PENDIENTE';
  diasDesdeUltimoPago: number;
}

/**
 * Parsea una fecha en formato DD/MM/YYYY o ISO a Date.
 * Devuelve null si es inválida.
 */
function parseDate(raw: string): Date | null {
  if (!raw) return null;
  // Intentar DD/MM/YYYY
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  const m1 = raw.match(ddmmyyyy);
  if (m1) {
    const [, d, mo, y] = m1;
    const dt = new Date(Number(y), Number(mo) - 1, Number(d));
    return isNaN(dt.getTime()) ? null : dt;
  }
  // Intentar ISO o cualquier formato que Date pueda parsear
  const iso = new Date(raw);
  return isNaN(iso.getTime()) ? null : iso;
}

/**
 * Formatea una Date a DD/MM/YYYY
 */
function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Calcula el resumen financiero de un cliente para una solicitud dada.
 * @param historial - historial de pagos de esta solicitud
 * @param valorCuota - valor mensual de la cuota (del plan)
 * @param fechaInicio - fecha de inicio del plan (para calcular cuotas acumuladas)
 * @param totalCuotas - número total de cuotas del plan
 */
export function calcularResumenFinanciero(
  historial: HistorialPago[],
  valorCuota: number,
  fechaInicio: string,
  totalCuotas: number,
): FinancialSummary {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // ─── Pagos y reintegros ───────────────────────────────────────────────────
  const pagos = historial.filter(h => h.tipo === 'PAGO' && h.estado === 'PAGADO');
  const reintegrosArr = historial.filter(h => h.tipo === 'REINTEGRO');

  const montoPagado = pagos.reduce((s, h) => s + (h.importe || 0), 0);
  const reintegros = reintegrosArr.reduce((s, h) => s + (h.importe || 0), 0);

  // ─── Cuotas en mora ───────────────────────────────────────────────────────
  // Una cuota está en mora si su estado es MORA o si ya venció y no tiene pago
  const cuotasMoraDirecta = historial.filter(
    h => h.estado === 'MORA'
  ).length;

  // Cuotas vencidas sin pago (por fecha de inicio + número de cuota)
  let cuotasVencidas = 0;
  const startDate = parseDate(fechaInicio);
  if (startDate && valorCuota > 0) {
    // Calcular cuántas cuotas deberían haber vencido
    const mesesTranscurridos = Math.floor(
      (hoy.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    );
    const cuotasDeberían = Math.min(Math.max(mesesTranscurridos, 0), totalCuotas);
    cuotasVencidas = Math.max(0, cuotasDeberían - pagos.length);
  }

  const cuotasEnMora = Math.max(cuotasMoraDirecta, cuotasVencidas);

  // ─── Monto acumulado que debería haber pagado ─────────────────────────────
  const cuotasDeberianHaberPagado = pagos.length + cuotasEnMora;
  const montoAcumulado = cuotasDeberianHaberPagado * valorCuota;

  // ─── Días desde el último pago ────────────────────────────────────────────
  let diasDesdeUltimoPago = 0;
  if (pagos.length > 0) {
    const fechas = pagos
      .map(p => parseDate(p.fecha_pago))
      .filter((d): d is Date => d !== null);
    if (fechas.length > 0) {
      const ultimoPago = new Date(Math.max(...fechas.map(d => d.getTime())));
      diasDesdeUltimoPago = Math.floor(
        (hoy.getTime() - ultimoPago.getTime()) / (1000 * 60 * 60 * 24)
      );
    }
  }

  // ─── Fecha próxima llamada ────────────────────────────────────────────────
  let fechaProximaLlamada: string;
  if (cuotasEnMora > 0) {
    // En mora: llamar mañana
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);
    fechaProximaLlamada = formatDate(manana);
  } else if (diasDesdeUltimoPago > 25) {
    // Próximo a vencer: llamar en 5 días
    const proxLlamada = new Date(hoy);
    proxLlamada.setDate(proxLlamada.getDate() + 5);
    fechaProximaLlamada = formatDate(proxLlamada);
  } else {
    // Próxima cuota: en 30 días desde el último pago o desde hoy
    const base = pagos.length > 0 ? (() => {
      const fechas = pagos.map(p => parseDate(p.fecha_pago)).filter((d): d is Date => d !== null);
      return fechas.length > 0 ? new Date(Math.max(...fechas.map(d => d.getTime()))) : hoy;
    })() : hoy;
    const proxCuota = new Date(base);
    proxCuota.setDate(proxCuota.getDate() + 30);
    fechaProximaLlamada = formatDate(proxCuota);
  }

  // ─── Estado general ───────────────────────────────────────────────────────
  let estado: FinancialSummary['estado'] = 'AL_DIA';
  if (cuotasEnMora > 0) estado = 'EN_MORA';
  else if (reintegros > 0) estado = 'REINTEGRO_PENDIENTE';

  const saldoFavor = reintegros - (cuotasEnMora * valorCuota);

  return {
    montoPagado: Math.round(montoPagado * 100) / 100,
    montoAcumulado: Math.round(montoAcumulado * 100) / 100,
    cuotasPagadas: pagos.length,
    cuotasEnMora,
    reintegros: Math.round(reintegros * 100) / 100,
    saldoFavor: Math.round(saldoFavor * 100) / 100,
    fechaProximaLlamada,
    estado,
    diasDesdeUltimoPago,
  };
}
