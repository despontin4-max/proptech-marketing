import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';

const SHEET_ID = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';
const CLIENTES_GID = '651627672'; // gid de la pestaña 1_CLIENTES

/**
 * Parser CSV robusto que maneja celdas con comillas y comas internas.
 * Más confiable que xlsx para salidas de GViz.
 */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"'; i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || (char === '\r' && next === '\n')) && !inQuotes) {
      if (char === '\r') i++;
      row.push(cell.trim());
      rows.push(row);
      row = []; cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length > 0) { row.push(cell.trim()); rows.push(row); }
  return rows;
}

/**
 * GET /api/clientes/list
 * Lee la pestaña 1_CLIENTES por índice de columna (robusto, no depende de headers).
 * Columnas esperadas:
 * A(0): COD_CUENTA | B(1): CONTRATO(SOLI) | C(2): NOMBRE_APELLIDO | D(3): DNI
 * E(4): TELEFONO | F(5): LOCALIDAD | G(6): DIRECCION | H(7): PLAN
 * I(8): CUOTAS_TOTALES | J(9): VALOR_CUOTA | K(10): ESTADO
 */
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('ah_session')?.value;
  const session = token ? verifySession(token) : null;
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${CLIENTES_GID}`;
    const res = await fetch(url, { cache: 'no-store' }); // sin caché para datos frescos

    if (!res.ok) {
      return NextResponse.json(
        { error: `GViz respondió HTTP ${res.status}. ¿La planilla es pública?` },
        { status: 502 }
      );
    }

    const text = await res.text();
    if (!text || text.length < 10) {
      return NextResponse.json({ error: 'Respuesta vacía de Google Sheets' }, { status: 502 });
    }

    const rows = parseCSV(text);
    if (rows.length < 2) {
      return NextResponse.json({ success: true, clientes: [], headers: rows[0] || [] });
    }

    // Saltar fila 0 (encabezados), mapear por posición de columna
    const clientes = rows.slice(1)
      .filter(row => row[0] && row[0].trim() !== '')
      .map(row => ({
        cod:      row[0] || '',
        soli:     row[1] || '',
        name:     row[2] || '',
        dni:      row[3] || '',
        phone:    row[4] || '',
        city:     row[5] || '',
        address:  row[6] || '',
        plan:     row[7] || '',
        cuotaNum: row[8] || '1',
        amount:   row[9] || '0',
        estado:   row[10] || 'ACTIVO',
      }));

    return NextResponse.json({
      success: true,
      total: clientes.length,
      headers: rows[0], // para debug
      clientes,
    });

  } catch (error: any) {
    console.error('[/api/clientes/list]', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
