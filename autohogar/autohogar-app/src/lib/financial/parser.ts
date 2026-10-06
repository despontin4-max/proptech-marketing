/**
 * Módulo Centralizado de Parseo y Formato Financiero - AutoHogar CRM
 * Elimina toda lógica duplicada en APIs y frontend.
 */

/**
 * Parsea importes numéricos en pesos argentinos sin truncar separadores de miles.
 * Ejemplos:
 *   "100,000"    -> 100000
 *   "60,000"     -> 60000
 *   "80.000,00"  -> 80000
 *   "$ 150.000"  -> 150000
 */
export function parseAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let s = String(val).replace(/[$A-Za-z\s]/g, '').trim();
  if (!s) return 0;

  if (s.includes(',') && s.includes('.')) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    // Si tiene exactamente 3 dígitos tras la coma, es separador de miles ("60,000")
    const parts = s.split(',');
    if (parts.pop()?.length === 3) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.pop()?.length === 3) {
      s = s.replace(/\./g, '');
    }
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

/**
 * Formatea importes en pesos argentinos estándar para la interfaz.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '$ 0';
  return `$ ${amount.toLocaleString('es-AR')}`;
}

/**
 * Parser CSV robusto compatible con celdas con comillas y saltos de línea (GViz).
 */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const nx = text[i + 1];

    if (ch === '"' && inQ && nx === '"') {
      cell += '"';
      i++;
    } else if (ch === '"') {
      inQ = !inQ;
    } else if (ch === ',' && !inQ) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || (ch === '\r' && nx === '\n')) && !inQ) {
      if (ch === '\r') i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += ch;
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return rows;
}
