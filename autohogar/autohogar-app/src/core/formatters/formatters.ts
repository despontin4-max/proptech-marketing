export function formatCurrency(val: any): string {
  if (!val) return '$0';
  const clean = String(val).replace(/[$A-Za-z\s]/g, '').trim();
  const num = parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  return `$${num.toLocaleString('es-AR')}`;
}

export function parseNumericAmount(val: any): number {
  if (!val) return 0;
  const clean = String(val).replace(/[$A-Za-z\s]/g, '').trim();
  return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
}

export function normalizeSearch(str: any): string {
  return String(str ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}
