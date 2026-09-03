const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. Definición canónica de encabezados y esquemas
const HEADERS_CLIENTES = [
  'ID_CLIENTE',
  'NRO_SOLICITUD',
  'NRO_CONTRATO',
  'NOMBRE_Y_APELLIDO',
  'DNI',
  'DIRECCION',
  'LOCALIDAD',
  'PROVINCIA',
  'TELEFONO_1',
  'TELEFONO_2',
  'PRODUCTO_SOLICITADO',
  'CANTIDAD_CUOTAS_PLAN',
  'VALOR_CUOTA_ESTIMADA',
  'ESTADO_CLIENTE',
  'TIENE_REINTEGRO',
  'MONTO_REINTEGRO',
  'CAMBIO_DE_PLAN',
  'FECHA_INICIO_CONTRATO',
  'OBSERVACIONES',
  'VERIFICADO'
];

const HEADERS_HISTORIAL = [
  'ID_OPERACION',
  'ID_CLIENTE',
  'NRO_SOLICITUD',
  'NRO_CONTRATO',
  'FECHA_PAGO',
  'FECHA_VENCIMIENTO_CUOTA',
  'CUOTA_NRO',
  'IMPORTE_ABONADO',
  'CONCEPTO',
  'MEDIO_PAGO',
  'OPERADOR_VERIFICADOR',
  'NRO_RECIBO',
  'OBSERVACIONES'
];

const HEADERS_USUARIOS = [
  'EMAIL',
  'PASSWORD',
  'NOMBRE',
  'ROL',
  'ESTADO'
];

const USUARIOS_INICIALES = [
  {
    EMAIL: 'despontin4@gmail.com',
    PASSWORD: 'AutoHogar2026!',
    NOMBRE: 'Maximiliano Despontin',
    ROL: 'ADMIN',
    ESTADO: 'ACTIVO'
  },
  {
    EMAIL: 'antonellar070@gmail.com',
    PASSWORD: 'AutoHogar2026!',
    NOMBRE: 'Antonella (Recepción)',
    ROL: 'recepcion',
    ESTADO: 'ACTIVO'
  },
  {
    EMAIL: 'lalilopezfotos@gmail.com',
    PASSWORD: 'AutoHogar2026!',
    NOMBRE: 'Florencia (Cobranzas)',
    ROL: 'cobranzas',
    ESTADO: 'ACTIVO'
  }
];

// 2. Cargar datos verificados iniciales si existen para poblar Clientes_Planes
function cargarClientesIniciales() {
  const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
  if (!fs.existsSync(jsonPath)) return [];

  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    return raw.map((c) => ({
      ID_CLIENTE: c.cod || '',
      NRO_SOLICITUD: c.soli || '001',
      NRO_CONTRATO: c.contrato || c.soli || '',
      NOMBRE_Y_APELLIDO: c.name || '',
      DNI: c.dni || '',
      DIRECCION: c.address || '',
      LOCALIDAD: c.city || 'SAN JUAN',
      PROVINCIA: 'SAN JUAN',
      TELEFONO_1: c.phone || '',
      TELEFONO_2: '',
      PRODUCTO_SOLICITADO: c.plan || '',
      CANTIDAD_CUOTAS_PLAN: 84,
      VALOR_CUOTA_ESTIMADA: c.amount || 0,
      ESTADO_CLIENTE: 'ACTIVO',
      TIENE_REINTEGRO: 'NO',
      MONTO_REINTEGRO: 0,
      CAMBIO_DE_PLAN: 'NO',
      FECHA_INICIO_CONTRATO: '01/08/2026',
      OBSERVACIONES: ''
    }));
  } catch (err) {
    console.warn('No se pudo cargar extracted_clients_august_2026.json:', err.message);
    return [];
  }
}

async function inicializarGoogleSheetsViaAPI() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!sheetId || !clientEmail || !privateKey) {
    console.log('ℹ️ Credenciales directas de Google API no configuradas en variables de entorno locales.');
    console.log('   Generando archivo Excel modelo 100% listo para subir a Google Drive...');
    return false;
  }

  try {
    const { google } = require('googleapis');
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Obtener pestañas existentes
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingTitles = meta.data.sheets.map(s => s.properties.title);

    const sheetsToCreate = ['Clientes_Planes', 'Historial_Pagos', 'Usuarios'].filter(
      t => !existingTitles.includes(t)
    );

    if (sheetsToCreate.length > 0) {
      console.log(`Creando pestañas en Google Sheet: ${sheetsToCreate.join(', ')}...`);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: sheetsToCreate.map(title => ({
            addSheet: { properties: { title } }
          }))
        }
      });
    }

    // 2. Escribir encabezados
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Clientes_Planes!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADERS_CLIENTES] }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Historial_Pagos!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [HEADERS_HISTORIAL] }
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: 'Usuarios!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [
          HEADERS_USUARIOS,
          ...USUARIOS_INICIALES.map(u => [u.EMAIL, u.PASSWORD, u.NOMBRE, u.ROL, u.ESTADO])
        ]
      }
    });

    console.log('✅ Pestañas y encabezados configurados exitosamente en Google Sheet vía API.');
    return true;
  } catch (error) {
    console.error('Error al interactuar con Google Sheets API:', error.message);
    return false;
  }
}

function generarExcelMaestroRelacional() {
  const wb = xlsx.utils.book_new();

  // 1. Clientes_Planes
  const clientesData = cargarClientesIniciales();
  const wsClientes = xlsx.utils.json_to_sheet(clientesData, { header: HEADERS_CLIENTES });
  xlsx.utils.book_append_sheet(wb, wsClientes, 'Clientes_Planes');

  // 2. Historial_Pagos
  const wsHistorial = xlsx.utils.aoa_to_sheet([HEADERS_HISTORIAL]);
  xlsx.utils.book_append_sheet(wb, wsHistorial, 'Historial_Pagos');

  // 3. Usuarios
  const wsUsuarios = xlsx.utils.json_to_sheet(USUARIOS_INICIALES, { header: HEADERS_USUARIOS });
  xlsx.utils.book_append_sheet(wb, wsUsuarios, 'Usuarios');

  const outPath = path.join(__dirname, '..', 'AUTOHOGAR_BASE_RELACIONAL_3_PESTANIAS.xlsx');
  xlsx.writeFile(wb, outPath);

  console.log(`✅ Archivo Excel generado: ${outPath}`);
  console.log(`   - Pestaña Clientes_Planes: ${clientesData.length} registros cargados.`);
  console.log(`   - Pestaña Historial_Pagos: Encabezados listos.`);
  console.log(`   - Pestaña Usuarios: ${USUARIOS_INICIALES.length} cuentas configuradas.`);
}

async function main() {
  console.log('🚀 Iniciando Fase 1: Creación y Verificación de Pestañas Relacionales...');
  
  // Paso A: Generar el Excel maestro local físico
  generarExcelMaestroRelacional();

  // Paso B: Intentar sincronizar vía API si hay credenciales
  await inicializarGoogleSheetsViaAPI();

  console.log('\n✨ Fase 1 completada exitosamente.');
}

main().catch(err => {
  console.error('Error fatal en inicialización:', err);
  process.exit(1);
});
