const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'ecosistema_5_planillas');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// 1. Cargar datos maestros de clientes
const fJson = path.join(BASE, 'extracted_clients_august_2026.json');
let jsonData = [];
if (fs.existsSync(fJson)) {
    jsonData = JSON.parse(fs.readFileSync(fJson, 'utf8'));
}

// Cargar listas de cobrador
function getClientIDsFromCSV(filename) {
    const p = path.join(BASE, 'autohogar-app', 'output_relational', filename);
    const ids = new Set();
    if (fs.existsSync(p)) {
        const rows = fs.readFileSync(p, 'utf8').split('\n');
        for (let i = 1; i < rows.length; i++) {
            const line = rows[i].trim();
            if (!line) continue;
            const match = line.match(/^"(\d+)"/);
            if (match) ids.add(Number(match[1]));
        }
    }
    return ids;
}

const ofiIds = getClientIDsFromCSV('PLANILLA_COBRO_OFICINA.csv');
const elecIds = getClientIDsFromCSV('PLANILLA_COBRO_ELECTRONICO.csv');

function mapClient(client, type) {
    return {
        'PERIODO': 'Agosto 2026',
        'Verificado': '',
        'Medio de Pago': type === 'Oficina' ? 'Contado' : 'Electronico',
        'Fecha de pago': '',
        'Hora de pago': '',
        'RECIBO NRO (Cod)': client.cod,
        'FECHA DE VENCIMIENTO': client.dueDate || '',
        'RECIBIMOS DE': client.name || '',
        'SOLI': client.soli || '',
        'DIRECCION': client.address || '',
        'LOCALIDAD': client.city || '',
        'NRO DNI': client.dni || '',
        'PLAN': client.plan || '',
        'EN CONCEPTO DE CUOTA NRO': client.cuotaNum || '',
        'POR LA SUMA DE ($)': client.amount || 0,
        'ADELANTO ENTREGA ($)': 0,
        'ADELANTO CUOTAS ($)': 0,
        'TOTAL COBRADO ($)': client.amount || 0,
        'OBSERVACIONES / DETALLE ADELANTO': '',
        'NRO_RECIBO_EMITIDO': '',
        'PDF_RECIBO_URL': '',
        'WHATSAPP_LINK': '',
        'OPERADOR_VERIFICADOR': '',
        'FECHA_EMISION': ''
    };
}

const oficinaRows = [];
const electronicoRows = [];
const generalRows = [];

for (const client of jsonData) {
    const cod = Number(client.cod);
    if (ofiIds.has(cod)) {
        const r = mapClient(client, 'Oficina');
        oficinaRows.push(r);
        generalRows.push(r);
    } else {
        const r = mapClient(client, 'Electronico');
        electronicoRows.push(r);
        generalRows.push(r);
    }
}

const colsCobranzas = [
    {wch: 15}, // PERIODO
    {wch: 12}, // Verificado
    {wch: 15}, // Medio de Pago
    {wch: 14}, // Fecha pago
    {wch: 14}, // Hora pago
    {wch: 18}, // COD
    {wch: 22}, // VENCIMIENTO
    {wch: 35}, // NOMBRE
    {wch: 10}, // SOLI
    {wch: 35}, // DIRECCION
    {wch: 25}, // LOCALIDAD
    {wch: 14}, // DNI
    {wch: 35}, // PLAN
    {wch: 25}, // CUOTA
    {wch: 18}, // MONTO
    {wch: 22}, // ADELANTO ENTREGA
    {wch: 22}, // ADELANTO CUOTAS
    {wch: 20}, // TOTAL COBRADO
    {wch: 35}, // DETALLE ADELANTO
    {wch: 20}, // NRO_RECIBO_EMITIDO
    {wch: 40}, // PDF_RECIBO_URL
    {wch: 40}, // WHATSAPP_LINK
    {wch: 30}, // OPERADOR_VERIFICADOR
    {wch: 22}  // FECHA_EMISION
];

// --- PLANILLA 1: OFICINA ---
const wb1 = xlsx.utils.book_new();
const ws1 = xlsx.utils.json_to_sheet(oficinaRows);
ws1['!cols'] = colsCobranzas;
xlsx.utils.book_append_sheet(wb1, ws1, 'Cobranzas_Oficina');
xlsx.writeFile(wb1, path.join(OUTPUT_DIR, '1_Planilla_Cobranzas_Oficina.xlsx'));

// --- PLANILLA 2: ELECTRONICOS ---
const wb2 = xlsx.utils.book_new();
const ws2 = xlsx.utils.json_to_sheet(electronicoRows);
ws2['!cols'] = colsCobranzas;
xlsx.utils.book_append_sheet(wb2, ws2, 'Cobranzas_Electronicos');
xlsx.writeFile(wb2, path.join(OUTPUT_DIR, '2_Planilla_Cobranzas_Electronicos.xlsx'));

// --- PLANILLA 3: TURNERO DE ATENCION ---
const turneroCols = [
    "Fecha y Hora",
    "Cliente (Nombre / DNI)",
    "Código / Grupo y Orden",
    "Atendido por (Operador)",
    "Canal de Atención (Mostrador / WhatsApp / Teléfono)",
    "Tipo de Consulta (Pago / Reclamo / Licitación / Estado Plan)",
    "Nivel de Urgencia (1 al 10)",
    "Comentarios / Resumen de Atención",
    "Estado (Pendiente / En Gestión / Resuelto)",
    "Recibo Emitido (Si / No)",
    "N° Recibo Vinculado"
];
const ws3 = xlsx.utils.aoa_to_sheet([turneroCols]);
ws3['!cols'] = [
    {wch: 20}, {wch: 35}, {wch: 22}, {wch: 25}, {wch: 30}, {wch: 35}, {wch: 22}, {wch: 50}, {wch: 22}, {wch: 20}, {wch: 22}
];
const wb3 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb3, ws3, 'Turnero');
xlsx.writeFile(wb3, path.join(OUTPUT_DIR, '3_Planilla_Turnero_Atencion.xlsx'));

// --- PLANILLA 4: NOVEDADES Y CLIENTES NUEVOS ---
const novedadesCols = [
    "Fecha y Hora de Carga",
    "Cargado por (Operador)",
    "Tipo de Novedad (Cliente Nuevo / Cambio Titular / Datos Faltantes / Baja)",
    "Código (Cod)",
    "Solicitud / Contrato (Soli)",
    "DNI / CUIT Titular",
    "Nombre y Apellido Completo",
    "Teléfono / WhatsApp",
    "Dirección y Localidad",
    "Plan / Vehículo Adjudicado",
    "Importe Cuota ($)",
    "Adelanto de Entrega ($)",
    "Adelanto de Cuotas ($)",
    "Medio de Pago",
    "Observaciones / Detalle Comercial",
    "Estado de Verificación (Pendiente / Aprobado Gerencia)"
];
const ws4 = xlsx.utils.aoa_to_sheet([novedadesCols]);
ws4['!cols'] = [
    {wch: 22}, {wch: 25}, {wch: 35}, {wch: 15}, {wch: 22}, {wch: 18}, {wch: 35}, {wch: 22}, {wch: 35}, {wch: 25}, {wch: 18}, {wch: 22}, {wch: 22}, {wch: 22}, {wch: 45}, {wch: 25}
];
const wb4 = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb4, ws4, 'Novedades_Nuevos');
xlsx.writeFile(wb4, path.join(OUTPUT_DIR, '4_Planilla_Novedades_Clientes_Nuevos.xlsx'));

// --- PLANILLA 5: MAESTRA Y CONTROL GERENCIAL (INTERCONECTADA EN VIVO) ---
const wb5 = xlsx.utils.book_new();

// Tab 1: Padrón General Completo
const ws5_Gen = xlsx.utils.json_to_sheet(generalRows);
ws5_Gen['!cols'] = colsCobranzas;
xlsx.utils.book_append_sheet(wb5, ws5_Gen, 'PADRON_GENERAL');

// Tab 2: OFICINA EN VIVO (IMPORTRANGE)
const ws5_Ofi = xlsx.utils.aoa_to_sheet([
    ["DATOS EN VIVO DE OFICINA SAN JUAN"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B6, "Cobranzas_Oficina!A2:X"), "Pega la URL de la Planilla 1 (Oficina) en CONFIGURACION!B6")']
]);
xlsx.utils.book_append_sheet(wb5, ws5_Ofi, 'OFICINA_EN_VIVO');

// Tab 3: ELECTRONICOS EN VIVO (IMPORTRANGE)
const ws5_Elec = xlsx.utils.aoa_to_sheet([
    ["DATOS EN VIVO DE COBROS ELECTRONICOS"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B7, "Cobranzas_Electronicos!A2:X"), "Pega la URL de la Planilla 2 (Electrónicos) en CONFIGURACION!B7")']
]);
xlsx.utils.book_append_sheet(wb5, ws5_Elec, 'ELECTRONICOS_EN_VIVO');

// Tab 4: TURNERO EN VIVO (IMPORTRANGE)
const ws5_Turnero = xlsx.utils.aoa_to_sheet([
    ["REGISTRO DE ATENCION Y TURNERO EN VIVO"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B8, "Turnero!A2:K"), "Pega la URL de la Planilla 3 (Turnero) en CONFIGURACION!B8")']
]);
xlsx.utils.book_append_sheet(wb5, ws5_Turnero, 'TURNERO_EN_VIVO');

// Tab 5: NOVEDADES Y NUEVOS EN VIVO (IMPORTRANGE)
const ws5_Novedades = xlsx.utils.aoa_to_sheet([
    ["CLIENTES NUEVOS Y NOVEDADES EN VIVO"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B9, "Novedades_Nuevos!A2:P"), "Pega la URL de la Planilla 4 (Novedades) en CONFIGURACION!B9")']
]);
xlsx.utils.book_append_sheet(wb5, ws5_Novedades, 'NOVEDADES_EN_VIVO');

// Tab 6: CONFIGURACION Y ENLACES
const configRows = [
    ["CENTRO DE CONTROL - ENLACES DE GOOGLE DRIVE", ""],
    ["Instrucciones:", "Pega el enlace (URL) de cada planilla subida a Drive en su celda correspondiente."],
    ["", ""],
    ["PLANILLA OPERATIVA", "ENLACE DE GOOGLE DRIVE (URL)"],
    ["1. Planilla Cobranzas Oficina:", "PEGA_AQUI_URL_PLANILLA_1_OFICINA"],
    ["2. Planilla Cobranzas Electrónicos:", "PEGA_AQUI_URL_PLANILLA_2_ELECTRONICOS"],
    ["3. Planilla Turnero Atención:", "PEGA_AQUI_URL_PLANILLA_3_TURNERO"],
    ["4. Planilla Novedades y Nuevos:", "PEGA_AQUI_URL_PLANILLA_4_NOVEDADES"]
];
const ws5_Config = xlsx.utils.aoa_to_sheet(configRows);
ws5_Config['!cols'] = [{wch: 35}, {wch: 90}];
xlsx.utils.book_append_sheet(wb5, ws5_Config, 'CONFIGURACION');

xlsx.writeFile(wb5, path.join(OUTPUT_DIR, '5_Planilla_Maestra_Control_Gerencial.xlsx'));

console.log("=== ECOSISTEMA DE 5 PLANILLAS INTERCONECTADAS GENERADO EXITOSAMENTE ===");
