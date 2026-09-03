const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_verificacion');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Read the master JSON
const fJson = path.join(BASE, 'extracted_clients_august_2026.json');
let jsonData = [];
if (fs.existsSync(fJson)) {
    jsonData = JSON.parse(fs.readFileSync(fJson, 'utf8'));
} else {
    console.error("No se encontró el JSON.");
    process.exit(1);
}

// Read the CSVs to know who is who
function getClientIDsFromCSV(filename) {
    const p = path.join(BASE, 'autohogar-app', 'output_relational', filename);
    const ids = new Set();
    if (fs.existsSync(p)) {
        const rows = fs.readFileSync(p, 'utf8').split('\n');
        for (let i = 1; i < rows.length; i++) {
            const line = rows[i].trim();
            if (!line) continue;
            // Assuming first column is COD, enclosed in quotes like "123"
            const match = line.match(/^"(\d+)"/);
            if (match) {
                ids.add(Number(match[1]));
            }
        }
    }
    return ids;
}

const ofiIds = getClientIDsFromCSV('PLANILLA_COBRO_OFICINA.csv');
const elecIds = getClientIDsFromCSV('PLANILLA_COBRO_ELECTRONICO.csv');

// Format function
function mapClient(client, type) {
    return {
        'PERIODO': 'Agosto 2026', // Permite filtrar o cambiar de mes dinámicamente
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
        'OBSERVACIONES / DETALLE ADELANTO': ''
    };
}

const oficinaData = [];
const electronicoData = [];
const ambosData = [];

for (const client of jsonData) {
    const cod = Number(client.cod);
    if (ofiIds.has(cod)) {
        const row = mapClient(client, 'Oficina');
        oficinaData.push(row);
        ambosData.push(row);
    } else if (elecIds.has(cod)) {
        const row = mapClient(client, 'Electronico');
        electronicoData.push(row);
        ambosData.push(row);
    } else {
        // Fallback if not in CSVs but in JSON
        const row = mapClient(client, 'Electronico');
        electronicoData.push(row);
        ambosData.push(row);
    }
}

// Function to save to Excel
function saveExcel(data, name) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    // Adjust column widths
    ws['!cols'] = [
        {wch: 15}, // PERIODO
        {wch: 12}, // Verificado
        {wch: 15}, // Medio de Pago
        {wch: 15}, // Fecha
        {wch: 15}, // Hora
        {wch: 18}, // COD
        {wch: 22}, // VENCIMIENTO
        {wch: 35}, // NOMBRE
        {wch: 10}, // SOLI
        {wch: 35}, // DIRECCION
        {wch: 25}, // LOCALIDAD
        {wch: 12}, // DNI
        {wch: 35}, // PLAN
        {wch: 25}, // CUOTA
        {wch: 20}, // MONTO
        {wch: 22}, // ADELANTO ENTREGA
        {wch: 22}, // ADELANTO CUOTAS
        {wch: 20}, // TOTAL COBRADO
        {wch: 35}, // OBSERVACIONES ADELANTO
    ];
    xlsx.utils.book_append_sheet(wb, ws, 'Cobranzas');
    const outPath = path.join(OUTPUT_DIR, name);
    xlsx.writeFile(wb, outPath);
    console.log(`Guardado ${outPath} con ${data.length} registros.`);
}

saveExcel(oficinaData, 'Planilla_Cobranzas_Oficina.xlsx');
saveExcel(electronicoData, 'Planilla_Cobranzas_Electronicos.xlsx');
saveExcel(ambosData, 'Planilla_Cobranzas_General.xlsx');
