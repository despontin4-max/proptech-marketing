import { google } from 'googleapis';
import type { HistorialPago } from '@/lib/financial/motor';

// Definir las interfaces basadas en los campos requeridos por el sistema
export interface ClientRecord {
  cod: string | number;
  name: string;
  phone?: string;
  soli?: string | number;
  cuotaNum?: string | number;
  amount?: string | number;
  dni?: string;
  plan?: string;
  address?: string;
  city?: string;
  province?: string;
  history?: string;
  dueDate?: string;
  estado?: string;
  cuotasPactadas?: string | number;
  verificado?: boolean;
  paymentDate?: string;
}

/**
 * Normaliza nombres para facilitar la búsqueda
 */
export function normalizeName(name: string | undefined | null) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

/**
 * Parsea un monto numérico lidiando con distintos formatos locales de miles y decimales
 * Ejemplos: "70,000" -> "70000", "70.000,00" -> "70000.00"
 */
export function parseAmount(val: any): string {
  if (!val) return '0';
  let s = String(val).replace(/[$A-Za-z\s]/g, '');
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
  return s;
}

/**
 * Obtiene el cliente autenticado de Google a partir de las credenciales (Service Account).
 * Requiere las siguientes variables de entorno:
 * GOOGLE_CLIENT_EMAIL
 * GOOGLE_PRIVATE_KEY
 */
const getAuth = () => {
  const credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    // Fix para los saltos de línea en Vercel
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

const path = require('path');
const fs = require('fs');

const USERS_JSON_PATH = path.join(process.cwd(), 'users.json');

const DEFAULT_USERS: SheetUser[] = [
  {
    email: 'despontin4@gmail.com',
    password: 'AutoHogar2026!',
    nombre: 'Maximiliano Despontin',
    rol: 'ADMIN',
    estado: 'ACTIVO',
  },
  {
    email: 'antonellar070@gmail.com',
    password: 'AutoHogar2026!',
    nombre: 'Recepcion',
    rol: 'recepcion',
    estado: 'ACTIVO',
  },
  {
    email: 'lalilopezfotos@gmail.com',
    password: 'AutoHogar2026!',
    nombre: 'Cobranzas',
    rol: 'cobranzas',
    estado: 'ACTIVO',
  }
];

export function getLocalUsers(): SheetUser[] {
  // En Vercel no podemos usar fs.writeFileSync para persistencia real.
  // Mantenemos los usuarios por defecto en memoria.
  return DEFAULT_USERS;
}

export function saveLocalUsers(users: SheetUser[]) {
  // Desactivado temporalmente por incompatibilidad con Serverless.
  // TODO: Implementar base de datos real (Supabase) o escribir en Google Sheets.
  console.log('Intento de guardar usuarios interceptado.');
}

function findLocalMasterWorkbook(): any | null {
  if (process.env.VERCEL) {
    return null;
  }
  try {
    const fs = require('fs');
    const path = require('path');
    const xlsx = require('xlsx');

    const candidates = [
      path.join(process.cwd(), 'AUTOHOGAR_BASE_RELACIONAL_3_PESTANIAS.xlsx'),
    ];

    for (const p of candidates) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        return xlsx.readFile(p);
      }
    }
  } catch (err) {
    console.warn('Could not read local master workbook:', err);
  }
  return null;
}

function formatExcelDate(val: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (typeof val === 'number' || /^\d{5}$/.test(s)) {
    const serial = Number(val);
    const date = new Date((serial - 25569) * 86400 * 1000);
    if (!isNaN(date.getTime())) {
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = String(date.getUTCFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    }
  }
  return s;
}

// In-memory cache to prevent fetching the whole sheet per PDF
let cachedClients: ClientRecord[] | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutos

const PROVINCIAS_ARGENTINAS = [
  'SAN JUAN', 'MENDOZA', 'SAN LUIS', 'LA RIOJA', 'CATAMARCA',
  'CORDOBA', 'SANTA FE', 'BUENOS AIRES', 'TUCUMAN', 'SALTA',
  'JUJUY', 'SANTIAGO DEL ESTERO', 'ENTRE RIOS', 'CORRIENTES',
  'MISIONES', 'CHACO', 'FORMOSA', 'NEUQUEN', 'LA PAMPA',
  'RIO NEGRO', 'CHUBUT', 'SANTA CRUZ', 'TIERRA DEL FUEGO'
];

export function parseLocation(raw: string): { city: string; province: string } {
  const clean = String(raw || '').trim().toUpperCase();
  if (!clean) {
    return { city: 'SAN JUAN CAPITAL', province: 'SAN JUAN' };
  }

  let foundProv = '';
  let foundCity = clean;

  for (const prov of PROVINCIAS_ARGENTINAS) {
    if (clean.endsWith(prov)) {
      foundProv = prov;
      const remainder = clean.substring(0, clean.length - prov.length).trim();
      if (remainder) {
        foundCity = remainder;
      }
      break;
    }
  }

  if (!foundProv) {
    foundProv = 'SAN JUAN';
  }

  if (foundCity === 'SAN JUAN' || foundCity === 'SAN JUAN CAPITAL' || !foundCity) {
    foundCity = 'SAN JUAN CAPITAL';
  }

  return { city: foundCity, province: foundProv };
}

function mapClientRecord(r: any): ClientRecord {
  const get = (keys: (string | RegExp)[]) => {
    for (const key of keys) {
      if (typeof key === 'string') {
        if (r[key] !== undefined && r[key] !== null && r[key] !== '') return r[key];
      } else if (key instanceof RegExp) {
        const foundKey = Object.keys(r).find(k => key.test(k));
        if (foundKey && r[foundKey] !== undefined && r[foundKey] !== null && r[foundKey] !== '') {
          return r[foundKey];
        }
      }
    }
    return '';
  };

  const rawLocalidad = get(['LOCALIDAD', 'city', 'F']);
  const parsedLoc = parseLocation(rawLocalidad);

  const rawCuota = get([
    /^N[°o]?\s*DE\s*ANTICIPO/i,
    /ANTICIPO/i,
    'N° DE ANTICIPO',
    'CUOTAS_TOTALES',
    'CUOTA ACTUAL (PDF)',
    'CUOTAS PAGADAS',
    'cuotaNum',
    'I'
  ]);

  return {
    cod: get(['CODIGO CLIENTE', 'COD_CUENTA', 'CODIGO', 'cod', 'A']),
    soli: get(['CONTRATO (SOLI)', 'CONTRATO', 'soli', 'B']),
    name: get(['NOMBRE_APELLIDO', 'NOMBRE', 'name', 'C']),
    dni: String(get(['DNI', 'dni', 'D'])),
    phone: String(get(['TELEFONO', 'phone', 'E'])),
    city: parsedLoc.city,
    address: get(['DIRECCION', 'address', 'G']),
    plan: get(['PLAN / PRODUCTO', 'PLAN', 'plan', 'H']),
    cuotaNum: String(rawCuota || '1'),
    amount: parseAmount(get(['VALOR_CUOTA', 'VALOR', 'J'])),
    province: parsedLoc.province,
    dueDate: formatExcelDate(get(['FECHA VTO', 'VTO', 'dueDate', 'O'])),
    paymentDate: formatExcelDate(get(['FECHA PAGO REAL', 'PAGO', 'P'])),
    estado: get(['ESTADO', 'K']) || 'ACTIVO',
    cuotasPactadas: get(['CUOTA PACTADA', 'CUOTAS', 'L']),
    verificado: String(get(['VERIFICADO', 'M'])).toUpperCase() === 'TRUE',
    history: '', // Se podría integrar de otra pestaña si es necesario
  };
}

/**
 * Lee la base maestra de clientes desde Google Sheets o desde el archivo maestro relacional local.
 */
export async function getMasterClients(): Promise<ClientRecord[]> {
  try {
    if (cachedClients && Date.now() - lastCacheTime < CACHE_TTL) {
      return cachedClients;
    }

    const spreadsheetId = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';

    // 1. Intentar lectura en vivo vía Google Sheets GViz API
    if (spreadsheetId) {
      try {
        const xlsx = require('xlsx');
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=1_CLIENTES`;
        const res = await fetch(gvizUrl, { next: { revalidate: 60 } });
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && csvText.length > 50) {
            const wb = xlsx.read(csvText, { type: 'string' });
            const sheetName = wb.SheetNames[0];
            const raw = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
            if (raw && raw.length > 0) {
              const clients = raw.map(mapClientRecord);
              cachedClients = clients;
              lastCacheTime = Date.now();
              return clients;
            }
          }
        }
      } catch (gvizErr) {
        console.warn('GViz fetch failed, falling back to Service Account / Local:', gvizErr);
      }
    }

    // 2. Intentar vía Google Sheets Official API si hay credenciales
    if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const auth = getAuth();
        const sheets = google.sheets({ version: 'v4', auth });
        const range = process.env.GOOGLE_SHEET_RANGE || '1_CLIENTES!A:P'; // Fetch until Col P

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

        const rows = response.data.values;
        if (rows && rows.length > 1) {
          const headers = rows[0].map((h: any) => h ? String(h).trim() : '');
          const mappedObjects = rows.slice(1).map(row => {
            const obj: any = {};
            headers.forEach((h: string, i: number) => {
              if (h) obj[h] = row[i];
            });
            return obj;
          });
          const clients = mappedObjects.map(mapClientRecord);
          cachedClients = clients;
          lastCacheTime = Date.now();
          return clients;
        }
      } catch (apiErr) {
        console.warn('Google Sheets API failed:', apiErr);
      }
    }

    // 3. Fallback Local Excel
    const wb = findLocalMasterWorkbook();
    if (wb) {
      const xlsx = require('xlsx');
      const sheetName = wb.SheetNames.includes('CLIENTES ACTIVOS') ? 'CLIENTES ACTIVOS' : (wb.SheetNames.includes('Clientes_Planes') ? 'Clientes_Planes' : wb.SheetNames[0]);
      const raw = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
      return raw.map((r: any) => {
        const parsed = parseLocation(r['LOCALIDAD'] || r.city || '');
        return {
          cod: r['CODIGO CLIENTE'] || r.COD || r.ID_CLIENTE || r.cod || '',
          soli: r['CONTRATO (SOLI)'] || r.NRO_SOLICITUD || r.soli || '',
          name: r['NOMBRE Y APELLIDO'] || r.CLIENTE || r.name || '',
          dni: String(r['DNI'] || r.dni || ''),
          address: r['DIRECCION'] || r.address || '',
          city: parsed.city,
          province: parsed.province,
          plan: r['PLAN / PRODUCTO'] || r.PLAN || r.PRODUCTO_SOLICITADO || r.plan || '',
          phone: String(r['TELEFONO'] || r.TELEFONO_1 || r.phone || ''),
          amount: parseAmount(r['IMPORTE ABONADO'] || r['VALOR CUOTA ACTUAL ($)'] || r.VALOR_CUOTA_ESTIMADA || r.amount),
          cuotaNum: String(r['CUOTA ACTUAL (PDF)'] || r['CUOTAS PAGADAS'] || (r.CANTIDAD_CUOTAS_PLAN ? '1' : '0')),
          dueDate: formatExcelDate(r['FECHA DE VENCIMIENTO'] || r.VENCIMIENTO || r.dueDate || ''),
          history: String(r['HISTORIAL ULTIMOS 5 PAGOS'] || r['HISTORIAL DE PAGOS'] || r.history || ''),
        };
      });
    }

    return [];
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return [];
  }
}

export interface SheetUser {
  email: string;
  password?: string;
  nombre: string;
  rol: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

/**
 * Lee la lista de usuarios y roles desde la pestaña 'Usuarios' de Google Sheets o del archivo local
 */
export async function getUsersFromSheet(): Promise<SheetUser[]> {
  try {
    const spreadsheetId = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';

    if (!spreadsheetId) {
      const wb = findLocalMasterWorkbook();
      if (wb && wb.SheetNames.includes('Usuarios')) {
        const xlsx = require('xlsx');
        const raw = xlsx.utils.sheet_to_json(wb.Sheets['Usuarios']);
        const loaded = raw.map((r: any) => ({
          email: String(r.EMAIL || '').toLowerCase().trim(),
          password: String(r.PASSWORD || ''),
          nombre: String(r.NOMBRE || ''),
          rol: String(r.ROL || 'recepcion'),
          estado: (String(r.ESTADO || 'ACTIVO').toUpperCase() === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO') as 'ACTIVO' | 'INACTIVO',
        }));
        if (loaded.length > 0) return loaded;
      }
      return getLocalUsers();
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Usuarios!A:E',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return getLocalUsers();

    return rows.slice(1).map(row => ({
      email: String(row[0] || '').toLowerCase().trim(),
      password: String(row[1] || ''),
      nombre: String(row[2] || ''),
      rol: String(row[3] || 'recepcion'),
      estado: (String(row[4] || 'ACTIVO').toUpperCase() === 'ACTIVO' ? 'ACTIVO' : 'INACTIVO') as 'ACTIVO' | 'INACTIVO',
    }));
  } catch (error) {
    console.error('Error fetching users from Google Sheets, using built-in users:', error);
    return getLocalUsers();
  }
}

/**
 * Lee el historial de pagos de una solicitud desde la pestaña 'Historial_Pagos'.
 * Si nro_solicitud está vacío, devuelve todos los registros.
 */
export async function getHistorialFromSheet(nro_solicitud?: string): Promise<HistorialPago[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      // Fallback local
      const fs = require('fs');
      const xlsx = require('xlsx');
      const localPath = path.join(process.cwd(), 'AUTOHOGAR_BASE_RELACIONAL_3_PESTANIAS.xlsx');

      if (fs.existsSync(/*turbopackIgnore: true*/ localPath)) {
        const wb = xlsx.readFile(localPath);
        if (wb.SheetNames.includes('Historial_Pagos')) {
          const raw = xlsx.utils.sheet_to_json(wb.Sheets['Historial_Pagos']);
          return raw
            .filter((r: any) => !nro_solicitud || String(r.NRO_SOLICITUD || '') === String(nro_solicitud))
            .map((r: any): HistorialPago => ({
              nro_solicitud: String(r.NRO_SOLICITUD || ''),
              fecha_pago: String(r.FECHA_PAGO || ''),
              importe: parseFloat(String(r.IMPORTE || '0').replace(',', '.')) || 0,
              tipo: (['PAGO', 'REINTEGRO', 'AJUSTE'].includes(String(r.TIPO || '').toUpperCase())
                ? String(r.TIPO).toUpperCase()
                : 'PAGO') as HistorialPago['tipo'],
              estado: (['PAGADO', 'MORA', 'PENDIENTE'].includes(String(r.ESTADO || '').toUpperCase())
                ? String(r.ESTADO).toUpperCase()
                : 'PAGADO') as HistorialPago['estado'],
              cuota_num: parseInt(String(r.CUOTA_NUM || '0'), 10) || 0,
              operador: String(r.OPERADOR || ''),
            }));
        }
      }
      return [];
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Historial_Pagos!A:H',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    return rows.slice(1)
      .filter(row => !nro_solicitud || String(row[0] || '') === String(nro_solicitud))
      .map((row): HistorialPago => ({
        nro_solicitud: String(row[0] || ''),
        fecha_pago: String(row[1] || ''),
        importe: parseFloat(String(row[2] || '0').replace(',', '.')) || 0,
        tipo: (['PAGO', 'REINTEGRO', 'AJUSTE'].includes(String(row[3] || '').toUpperCase())
          ? String(row[3]).toUpperCase()
          : 'PAGO') as HistorialPago['tipo'],
        estado: (['PAGADO', 'MORA', 'PENDIENTE'].includes(String(row[4] || '').toUpperCase())
          ? String(row[4]).toUpperCase()
          : 'PAGADO') as HistorialPago['estado'],
        cuota_num: parseInt(String(row[5] || '0'), 10) || 0,
        operador: String(row[6] || ''),
      }));
  } catch (error) {
    console.error('Error fetching historial from Google Sheets:', error);
    return [];
  }
}

export interface AuditLogEntry {
  fecha: string;
  usuario: string;
  accion: string;
  detalle: string;
}

/**
 * Registra un evento de auditoría en la pestaña 'Historial_Pagos' o en un log local.
 * En producción (con GOOGLE_SHEET_ID) escribe directamente en Sheets.
 */
export async function appendAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const spreadsheetId = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Edge case: La pestaña "Usuarios" no existe en la planilla actual del CRM.
    // Escribir aquí causaría un 400 Bad Request silencioso.
    // Se deshabilita hasta que el cliente cree una pestaña 'Usuarios' dedicada.
    /*
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Usuarios!G:J',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[entry.fecha, entry.usuario, entry.accion, entry.detalle]],
      },
    });
    */
    console.log('[AUDIT LOGGED TO CONSOLE]', entry);
  } catch (error) {
    console.error('Error writing audit log:', error);
  }
}

export interface CuentaCorrienteEntry {
  fecha_vencimiento: string;
  fecha_pago: string;
  cod_cuenta: string;
  cliente_nombre: string;
  concepto: string;
  medio_pago: string;
  verificacion_admin: string;
  debe: string;
  haber: string;
  nro_anticipo: string;
  operador: string;
}

/**
 * Registra múltiples pagos en lote en la pestaña 2_CUENTA_CORRIENTE
 * Soluciona cuellos de botella de red (N+1 queries) y rate-limits de la API de Google.
 */
export async function appendPagosBatch(entries: CuentaCorrienteEntry[]): Promise<void> {
  if (entries.length === 0) return;
  try {
    const spreadsheetId = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // ── Obtener el sheetId numérico de 2_CUENTA_CORRIENTE ─────────────────────
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetMeta = meta.data.sheets?.find(s => s.properties?.title === '2_CUENTA_CORRIENTE');
    if (!sheetMeta || sheetMeta.properties?.sheetId === undefined) {
      throw new Error('No se encontró la pestaña 2_CUENTA_CORRIENTE en el spreadsheet');
    }
    const sheetId = sheetMeta.properties.sheetId!;

    // ── PASO 1: Insertar N filas vacías justo después del header (fila índice 1) ─
    // ESTRATEGIA: siempre insertamos al tope de la tabla (debajo del header).
    // Esto elimina para siempre el problema de "¿cuál es la última fila?".
    // Las filas viejas de test o los checkboxes quedan empujados hacia abajo.
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          insertDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: 1,               // Índice 1 = después del header
              endIndex: 1 + entries.length, // Insertar tantas filas como pagos
            },
            inheritFromBefore: false,
          }
        }]
      }
    });

    // ── PASO 2: Construir las filas a insertar ────────────────────────────────
    const rows = entries.map(entry => [
      entry.fecha_vencimiento,
      entry.fecha_pago,
      entry.cod_cuenta,
      entry.cliente_nombre,
      entry.concepto,
      entry.medio_pago,
      entry.verificacion_admin,
      entry.debe,
      entry.haber,
      entry.nro_anticipo,
      entry.operador
    ]);

    // ── PASO 3: Escribir los datos en las filas recién creadas ─────────────────
    // Siempre empezamos en la fila 2 (justo debajo del header).
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: rows.map((row, idx) => ({
          range: `2_CUENTA_CORRIENTE!A${2 + idx}:K${2 + idx}`,
          values: [row],
        })),
      },
    });

    console.log(`[CC] Inserted ${rows.length} row(s) at top of 2_CUENTA_CORRIENTE (row 2)`);
  } catch (error) {
    console.error('Error crítico escribiendo batch en 2_CUENTA_CORRIENTE:', error);
    throw error;
  }
}

/**
 * Actualiza la columna N (RECIBO EMITIDO) en 1_CLIENTES
 * Recibe un array de números de fila (sheetRowIndex) y el texto a escribir
 */
export async function markReceiptsAsEmitted(rowIndices: number[], operador: string = 'Administrador'): Promise<void> {
  if (rowIndices.length === 0) return;
  try {
    const spreadsheetId = '1MH8X7HaAjPgi6C1PUBg1Ll4QjB0sHQXmGb4ISXHsVEY';
    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const fechaEmision = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    // Preparar peticiones de actualización en lote (BatchUpdateValues)
    const data = rowIndices.map(row => ({
      range: `1_CLIENTES!N${row}`,
      values: [[`✅ Emitido: ${fechaEmision} por ${operador}`]]
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data
      }
    });
  } catch (error) {
    console.error('Error marcando recibos como emitidos en 1_CLIENTES:', error);
  }
}

