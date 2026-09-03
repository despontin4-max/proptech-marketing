const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const outputDir = path.join(__dirname, 'output_relational');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Load Text Extracted Methods (Mercado Pago, Galicia, etc.)
const txtDir = path.join(__dirname, '..', 'numeros-autohogar', 'txt_extracted');
const methodMap = {};
if (fs.existsSync(txtDir)) {
    const files = fs.readdirSync(txtDir);
    for (const file of files) {
        if (file.endsWith('.txt')) {
            const content = fs.readFileSync(path.join(txtDir, file), 'utf8').toUpperCase();
            const method = file.replace('.txt', '').replace(/\(\d+\)/g, '').trim();
            if (!methodMap[method]) methodMap[method] = "";
            methodMap[method] += " " + content;
        }
    }
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

function normalize(name) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

const masterClients = new Map();
const masterTransactions = [];

function addClient(cod, name, phone, dni, address, city, plan, cuotasPactadas, valorCuotaPactada, soli, cobrador, history, totalPagado, adelanto, cuotaAnterior, fechaCambio) {
    if (!cod || cod.toString().trim() === '') return;
    const key = cod.toString().trim();
    
    // Find Exact Payment Method by searching the name in txt reports
    let exactMethod = 'INDEFINIDO';
    const normName = normalize(name).replace(/\s+/g, '');
    if (normName.length > 5) {
        for (const [method, text] of Object.entries(methodMap)) {
            if (text.replace(/\s+/g, '').includes(normName)) {
                exactMethod = method;
                break;
            }
        }
    }
    if (exactMethod === 'INDEFINIDO') {
        exactMethod = (cobrador === 'OFICINA') ? 'EFECTIVO / OFICINA' : 'NO ESPECIFICADO';
    }

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
            VALOR_CUOTA_ACTUAL: valorCuotaPactada || '',
            COBRADOR_ASIGNADO: cobrador || '',
            MEDIO_DE_PAGO_EXACTO: exactMethod,
            CAPITAL_PAGADO_TOTAL: totalPagado || '[PROVISORIO NO VERIFICADO]',
            PAGO_ADELANTADO: adelanto || '[PROVISORIO NO VERIFICADO]',
            CUOTA_ANTERIOR: cuotaAnterior || '[PROVISORIO NO VERIFICADO]',
            FECHA_CAMBIO_MONTO: fechaCambio || '[PROVISORIO NO VERIFICADO]',
            HISTORIAL_5_PAGOS: history || '',
            HISTORIAL_COMPLETO: '[PROVISORIO NO VERIFICADO]'
        });
    } else {
        const c = masterClients.get(key);
        if (!c.DNI && dni) c.DNI = dni;
        if (!c.SOLI && soli) c.SOLI = soli;
        if (!c.TELEFONO && phone) c.TELEFONO = formatPhone(phone);
        if (!c.DIRECCION && address) c.DIRECCION = address;
        if (!c.PLAN_VIVIENDA && plan) c.PLAN_VIVIENDA = plan;
        if (!c.VALOR_CUOTA_ACTUAL && valorCuotaPactada) c.VALOR_CUOTA_ACTUAL = valorCuotaPactada;
        if (!c.COBRADOR_ASIGNADO && cobrador) c.COBRADOR_ASIGNADO = cobrador;
        if (c.MEDIO_DE_PAGO_EXACTO === 'NO ESPECIFICADO' || c.MEDIO_DE_PAGO_EXACTO === 'INDEFINIDO') {
            c.MEDIO_DE_PAGO_EXACTO = exactMethod;
        }
        if (history && !c.HISTORIAL_5_PAGOS.includes(history)) c.HISTORIAL_5_PAGOS += ' ' + history;
    }
}

// 1. Load ENERO 2025 (Master Seed)
const excel2025Path = path.join(__dirname, '..', '07 Clientes de pago electronico  de ENERO 2025.xlsx');
if (fs.existsSync(excel2025Path)) {
    const wb = xlsx.readFile(excel2025Path);
    const data2025 = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (const row of data2025.slice(2)) {
        const cod = row[0];
        const name = row[1];
        if (!cod || !name) continue;
        let cobrador = row[11] ? 'OFICINA' : 'MEDIO ELECT';
        addClient(cod, name, row[2], '', '', row[3], '', '', row[6], row[4], cobrador, '', '', '', '', '');
    }
}

// 2. Load JSON Data (Overrides and updates)
const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
if (fs.existsSync(jsonPath)) {
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    for (const item of jsonData) {
        addClient(item.cod, item.name, item.phone, item.dni, item.address, item.city, item.plan, '', item.amount, item.soli, 'MEDIO ELECT', item.history, '', '', '', '');
        
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
                    MEDIO_DE_PAGO: masterClients.get(item.cod.toString())?.MEDIO_DE_PAGO_EXACTO || 'NO ESPECIFICADO',
                    LUGAR_DE_COBRO: 'HISTORICO',
                    TIPO_CONCEPTO: 'FACTURA NORMAL',
                    VERIFICACION: '[PROVISORIO NO VERIFICADO]'
                });
            }
        }
    }
}

// 3. Load Excel Data AGOSTO 2026
const excelElectPath = path.join(__dirname, '..', '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
if (fs.existsSync(excelElectPath)) {
    const wb = xlsx.readFile(excelElectPath);
    const dataElect = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
    for (const row of dataElect.slice(2)) {
        const cod = row[0];
        const name = row[1];
        if (!cod || !name) continue;
        addClient(cod, name, row[2], '', '', row[3], '', '', row[6], row[4], 'MEDIO ELECT', '', '', '', '', '');
    }
}

// Export CSVs
function toCSV(dataArray, headers) {
    if (dataArray.length === 0) return headers.join(',') + '\n';
    let csv = headers.join(',') + '\n';
    for (const row of dataArray) {
        csv += headers.map(h => `"${row[h] ? row[h].toString().replace(/"/g, '""') : ''}"`).join(',') + '\n';
    }
    return csv;
}

const clientsHeaders = [
    'COD', 'SOLI', 'NOMBRE', 'DNI', 'TELEFONO', 'DIRECCION', 'CIUDAD', 'PLAN_VIVIENDA', 
    'CUOTAS_PACTADAS', 'VALOR_CUOTA_ACTUAL', 'COBRADOR_ASIGNADO', 'MEDIO_DE_PAGO_EXACTO',
    'CAPITAL_PAGADO_TOTAL', 'PAGO_ADELANTADO', 'CUOTA_ANTERIOR', 'FECHA_CAMBIO_MONTO',
    'HISTORIAL_5_PAGOS', 'HISTORIAL_COMPLETO'
];
const clientsData = Array.from(masterClients.values());
fs.writeFileSync(path.join(outputDir, 'MASTER_CLIENTES_V2.csv'), toCSV(clientsData, clientsHeaders));

const transHeaders = [
    'ID_TRANSACCION', 'COD_CLIENTE', 'NRO_CUOTA_PAGADA', 'FECHA_PAGO', 'MONTO_ABONADO', 
    'MEDIO_DE_PAGO', 'LUGAR_DE_COBRO', 'TIPO_CONCEPTO', 'VERIFICACION'
];
fs.writeFileSync(path.join(outputDir, 'MASTER_TRANSACCIONES_V2.csv'), toCSV(masterTransactions, transHeaders));

console.log(`Generated MASTER_CLIENTES_V2.csv with ${clientsData.length} records and ALL requested columns.`);
console.log(`Generated MASTER_TRANSACCIONES_V2.csv with ${masterTransactions.length} records.`);
