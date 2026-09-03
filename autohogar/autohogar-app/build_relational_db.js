const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const outputDir = path.join(__dirname, 'output_relational');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Phone formatter
function formatPhone(phone) {
    if (!phone) return "";
    let clean = phone.toString().replace(/[^\d]/g, '');
    if (clean.length === 10) {
        return clean.substring(0, 3) + '-' + clean.substring(3);
    }
    return phone.toString().trim();
}

const masterClients = new Map();
const masterTransactions = [];

function addClient(cod, name, phone, dni, address, city, plan, cuotasPactadas, valorCuotaPactada, soli, cobrador) {
    if (!cod || cod.toString().trim() === '') return;
    const key = cod.toString().trim();
    if (!masterClients.has(key)) {
        masterClients.set(key, {
            COD: key,
            SOLI: soli || '',
            NOMBRE: name || '',
            DNI: dni || '',
            TELEFONO: formatPhone(phone),
            DIRECCION: address || '',
            CIUDAD: city || '',
            PLAN_VIVIENDA: plan || '',
            CUOTAS_PACTADAS: cuotasPactadas || '',
            VALOR_CUOTA_PACTADA: valorCuotaPactada || '',
            COBRADOR_ASIGNADO: cobrador || ''
        });
    } else {
        const c = masterClients.get(key);
        if (!c.DNI && dni) c.DNI = dni;
        if (!c.SOLI && soli) c.SOLI = soli;
        if (!c.TELEFONO && phone) c.TELEFONO = formatPhone(phone);
        if (!c.DIRECCION && address) c.DIRECCION = address;
        if (!c.PLAN_VIVIENDA && plan) c.PLAN_VIVIENDA = plan;
        if (!c.VALOR_CUOTA_PACTADA && valorCuotaPactada) c.VALOR_CUOTA_PACTADA = valorCuotaPactada;
        if (!c.COBRADOR_ASIGNADO && cobrador) c.COBRADOR_ASIGNADO = cobrador;
    }
}

// 1. Load ENERO 2025 (Master Seed)
const excel2025Path = path.join(__dirname, '..', '07 Clientes de pago electronico  de ENERO 2025.xlsx');
if (fs.existsSync(excel2025Path)) {
    const wb = xlsx.readFile(excel2025Path);
    const data2025 = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    const rows2025 = data2025.slice(2);
    for (const row of rows2025) {
        const cod = row[0];
        const name = row[1];
        if (!cod || !name) continue;
        const phone = row[2] || '';
        const city = row[3] || '';
        const soli = row[4] || '';
        const cuota = row[6] || '';
        // If x_oficina is checked or empty
        let cobrador = 'NO DEFINIDO';
        if (row[11]) cobrador = 'OFICINA';
        else if (row[12]) cobrador = 'MEDIO ELECT';
        
        addClient(cod, name, phone, '', '', city, '', '', cuota, soli, cobrador);
    }
}

// 2. Load JSON Data (Overrides and updates)
const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
if (fs.existsSync(jsonPath)) {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    for (const item of jsonData) {
        let cuotasPactadas = '';
        let plan = item.plan;
        addClient(item.cod, item.name, item.phone, item.dni, item.address, item.city, plan, cuotasPactadas, item.amount, item.soli, 'MEDIO ELECT');
        
        if (item.history) {
            const dates = item.history.split('-').map(d => d.trim()).filter(d => d.length > 0);
            let cuotaActual = parseInt(item.cuotaNum) || 0;
            for (let i = 0; i < dates.length; i++) {
                masterTransactions.push({
                    ID_TRANSACCION: `TR-${item.cod}-${dates[i].replace(/\//g, '')}`,
                    COD_CLIENTE: item.cod,
                    NRO_CUOTA_PAGADA: cuotaActual > 0 ? (cuotaActual - i).toString() : '',
                    FECHA_PAGO: dates[i],
                    MONTO_ABONADO: item.amount || '',
                    MEDIO_DE_PAGO: 'NO ESPECIFICADO',
                    LUGAR_DE_COBRO: 'HISTORICO',
                    TIPO_CONCEPTO: 'FACTURA NORMAL'
                });
            }
        }
    }
}

// 3. Load Excel Data AGOSTO 2026 (Overrides and updates)
const excelElectPath = path.join(__dirname, '..', '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
if (fs.existsSync(excelElectPath)) {
    const wb = xlsx.readFile(excelElectPath);
    const excelElect = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    const rowsElect = excelElect.slice(2);
    for (const row of rowsElect) {
        const cod = row[0];
        const name = row[1];
        if (!cod || !name) continue;
        addClient(cod, name, row[2], '', '', row[3], '', '', row[6], row[4], 'MEDIO ELECT');
    }
}

// 4. Export CSVs
function toCSV(dataArray, headers) {
    if (dataArray.length === 0) return headers.join(',') + '\n';
    let csv = headers.join(',') + '\n';
    for (const row of dataArray) {
        csv += headers.map(h => {
            let val = row[h] ? row[h].toString().replace(/"/g, '""') : '';
            return `"${val}"`;
        }).join(',') + '\n';
    }
    return csv;
}

const clientsHeaders = ['COD', 'SOLI', 'NOMBRE', 'DNI', 'TELEFONO', 'DIRECCION', 'CIUDAD', 'PLAN_VIVIENDA', 'CUOTAS_PACTADAS', 'VALOR_CUOTA_PACTADA', 'COBRADOR_ASIGNADO'];
const clientsData = Array.from(masterClients.values());
fs.writeFileSync(path.join(outputDir, 'MASTER_CLIENTES.csv'), toCSV(clientsData, clientsHeaders));

const transHeaders = ['ID_TRANSACCION', 'COD_CLIENTE', 'NRO_CUOTA_PAGADA', 'FECHA_PAGO', 'MONTO_ABONADO', 'MEDIO_DE_PAGO', 'LUGAR_DE_COBRO', 'TIPO_CONCEPTO'];
fs.writeFileSync(path.join(outputDir, 'MASTER_TRANSACCIONES.csv'), toCSV(masterTransactions, transHeaders));

const appHeaders = ['NRO_CLIENTE', 'NOMBRE', 'TELEFONO', 'MEDIO_DE_PAGO_HABITUAL', 'IMPORTE_A_COBRAR'];
const appData = clientsData.filter(c => c.COBRADOR_ASIGNADO === 'OFICINA' || c.COBRADOR_ASIGNADO === 'NO DEFINIDO').map(c => ({
    NRO_CLIENTE: c.COD,
    NOMBRE: c.NOMBRE,
    TELEFONO: c.TELEFONO,
    MEDIO_DE_PAGO_HABITUAL: 'EFECTIVO / OFICINA',
    IMPORTE_A_COBRAR: c.VALOR_CUOTA_PACTADA
}));
fs.writeFileSync(path.join(outputDir, 'APP_CARGA_DIARIA.csv'), toCSV(appData, appHeaders));

console.log(`Generated MASTER_CLIENTES.csv with ${clientsData.length} records.`);
console.log(`Generated MASTER_TRANSACCIONES.csv with ${masterTransactions.length} records.`);
console.log(`Generated APP_CARGA_DIARIA.csv with ${appData.length} records.`);
