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
}

/**
 * Normaliza nombres para facilitar la búsqueda
 */
export function normalizeName(name: string | undefined | null) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
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

/**
 * Lee la base maestra de clientes desde Google Sheets o desde el archivo maestro relacional local.
 */
export async function getMasterClients(): Promise<ClientRecord[]> {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ID || '16gtCaBkyDblCvnmB17GzdPe1jeQ52Zvj';

    // 1. Intentar lectura en vivo vía Google Sheets GViz API / Public Export
    if (spreadsheetId) {
      try {
        const xlsx = require('xlsx');
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&gid=0`; // Por defecto, tab 1
        // Cachear 60 segundos para evitar Rate Limits y acelerar carga
        const res = await fetch(gvizUrl, { next: { revalidate: 60 } });
        if (res.ok) {
          const csvText = await res.text();
          if (csvText && csvText.length > 50) {
            const wb = xlsx.read(csvText, { type: 'string' });
            const sheetName = wb.SheetNames[0];
            const raw = xlsx.utils.sheet_to_json(wb.Sheets[sheetName]);
            if (raw && raw.length > 0) {
              return raw.map((r: any) => ({
                cod: r['CODIGO CLIENTE'] || r.ID_CLIENTE || r.COD || r.cod || '',
                soli: r['CONTRATO (SOLI)'] || r.NRO_SOLICITUD || r.NRO_CONTRATO || r.soli || '',
                name: r['NOMBRE Y APELLIDO'] || r.CLIENTE || r.name || '',
                dni: String(r['DNI'] || r.dni || ''),
                address: r['DIRECCION'] || r.address || '',
                city: r['LOCALIDAD'] || r.city || '',
                province: r['PROVINCIA'] || r.province || 'SAN JUAN',
                plan: r['PLAN / PRODUCTO'] || r.PRODUCTO_SOLICITADO || r.PLAN || r.plan || '',
                phone: String(r['TELEFONO'] || r.TELEFONO_1 || r.phone || ''),
                amount: String(r['IMPORTE ABONADO'] || r.VALOR_CUOTA_ESTIMADA || r['VALOR CUOTA ACTUAL ($)'] || r.amount || '0,00').replace(/^\$\s*/, ''),
                cuotaNum: String(r['CUOTA ACTUAL (PDF)'] || r.CUOTAS_PAGADAS || r['CUOTAS PAGADAS'] || '1'),
                dueDate: formatExcelDate(r['FECHA DE VENCIMIENTO'] || r.VENCIMIENTO || r.dueDate || ''),
                history: String(r['HISTORIAL ULTIMOS 5 PAGOS'] || r.HISTORIAL_DE_PAGOS || r['HISTORIAL DE PAGOS'] || r.history || ''),
              }));
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
        const range = process.env.GOOGLE_SHEET_RANGE || 'CLIENTES ACTIVOS!A:S';

        const response = await sheets.spreadsheets.values.get({
          spreadsheetId,
          range,
        });

        const rows = response.data.values;
        if (rows && rows.length > 1) {
          const headers = rows[0];
          return rows.slice(1).map(row => {
            const getVal = (colName: string) => {
              const idx = headers.findIndex(h => h.toUpperCase().includes(colName));
              return idx >= 0 ? (row[idx] || '') : '';
            };
            return {
              cod: getVal('CODIGO') || getVal('ID_CLIENTE') || row[7] || '',
              soli: getVal('CONTRATO') || getVal('SOLI') || row[6] || '',
              name: getVal('NOMBRE') || row[2] || '',
              dni: String(getVal('DNI') || row[1] || ''),
              address: getVal('DIRECCION') || row[4] || '',
              city: getVal('LOCALIDAD') || row[5] || '',
              province: getVal('PROVINCIA') || 'SAN JUAN',
              phone: String(getVal('TELEFONO') || row[3] || ''),
              plan: getVal('PLAN') || getVal('PRODUCTO') || row[8] || '',
              cuotaNum: String(getVal('CUOTA') || row[10] || '1'),
              amount: String(getVal('IMPORTE') || row[12] || '0,00').replace(/^\$\s*/, ''),
              dueDate: formatExcelDate(getVal('VENCIMIENTO') || row[11] || ''),
              history: getVal('HISTORIAL') || row[16] || '',
            };
          });
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
      return raw.map((r: any) => ({
        cod: r['CODIGO CLIENTE'] || r.COD || r.ID_CLIENTE || r.cod || '',
        soli: r['CONTRATO (SOLI)'] || r.NRO_SOLICITUD || r.soli || '',
        name: r['NOMBRE Y APELLIDO'] || r.CLIENTE || r.name || '',
        dni: String(r['DNI'] || r.dni || ''),
        address: r['DIRECCION'] || r.address || '',
        city: r['LOCALIDAD'] || r.city || '',
        province: r['PROVINCIA'] || r.province || 'SAN JUAN',
        plan: r['PLAN / PRODUCTO'] || r.PLAN || r.PRODUCTO_SOLICITADO || r.plan || '',
        phone: String(r['TELEFONO'] || r.TELEFONO_1 || r.phone || ''),
        amount: String(r['IMPORTE ABONADO'] || r['VALOR CUOTA ACTUAL ($)'] || r.VALOR_CUOTA_ESTIMADA || r.amount || '0,00').replace(/^\$\s*/, ''),
        cuotaNum: String(r['CUOTA ACTUAL (PDF)'] || r['CUOTAS PAGADAS'] || (r.CANTIDAD_CUOTAS_PLAN ? '1' : '0')),
        dueDate: formatExcelDate(r['FECHA DE VENCIMIENTO'] || r.VENCIMIENTO || r.dueDate || ''),
        history: String(r['HISTORIAL ULTIMOS 5 PAGOS'] || r['HISTORIAL DE PAGOS'] || r.history || ''),
      }));
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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

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
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    if (!spreadsheetId) {
      // Sin Sheets: log a consola solamente
      console.log('[AUDIT]', entry);
      return;
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Usuarios!G:J', // columnas libres para log de auditoría
      valueInputOption: 'RAW',
      requestBody: {
        values: [[entry.fecha, entry.usuario, entry.accion, entry.detalle]],
      },
    });
  } catch (error) {
    // No romper la app si falla el log
    console.error('Error writing audit log:', error);
  }
}

// Trigger Vercel Build 09/03/2026 17:52:47
