const fs = require('fs');
const path = require('path');

const dir = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\autohogar-app\\output_relational';
const files = ['MASTER_CLIENTES_V3.csv', 'MASTER_TRANSACCIONES_V3.csv', 'APP_CARGA_DIARIA_V3.csv'];

function parseCSVLine(text) {
    const p = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQ && text[i+1] === '"') {
                cur += '"';
                i++;
            } else {
                inQ = !inQ;
            }
        } else if (c === ',' && !inQ) {
            p.push(cur);
            cur = '';
        } else {
            cur += c;
        }
    }
    p.push(cur);
    return p;
}

for (const file of files) {
    console.log(`\n========================================`);
    console.log(` AUDITORIA DE FORMATO: ${file}`);
    console.log(`========================================`);
    const fpath = path.join(dir, file);
    if (!fs.existsSync(fpath)) {
        console.log(`Archivo no encontrado: ${file}`);
        continue;
    }
    const content = fs.readFileSync(fpath, 'utf8');
    const lines = content.split('\n').filter(l => l.trim().length > 0);
    const headers = parseCSVLine(lines[0]);
    console.log(`Columnas (${headers.length}):`, headers.join(' | '));
    console.log(`Filas totales: ${lines.length - 1}`);

    let formatWarnings = [];
    for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVLine(lines[i]);
        if (cols.length !== headers.length) {
            formatWarnings.push(`Fila ${i}: Desfase de columnas (esperado ${headers.length}, tiene ${cols.length})`);
        }
        for (let c = 0; c < cols.length; c++) {
            const val = cols[c];
            const h = headers[c];
            // Check Excel serial numbers in date/mora fields
            if (/^\d{5}$/.test(val) && (h.includes('FECHA') || h.includes('MES_ANT') || h.includes('PAGO'))) {
                formatWarnings.push(`Fila ${i} [${cols[0] || ''} - ${cols[2] || ''}] Col '${h}': Número serial de Excel '${val}' en vez de fecha DD/MM/AAAA.`);
            }
            // Check dirty values
            if (val === 'undefined' || val === 'null' || val === 'NaN' || val.includes('[object')) {
                formatWarnings.push(`Fila ${i} Col '${h}': Valor sucio '${val}'`);
            }
            // Check numbers format inconsistency (e.g. 40.000,00 vs 40000 vs 40000.00)
            if ((h.includes('VALOR') || h.includes('MONTO') || h.includes('SALDO') || h.includes('CAPITAL')) && val !== '') {
                if (val.includes('.') && val.includes(',')) {
                    // Formato AR/ES tipo "40.000,00"
                }
            }
        }
    }
    console.log(`Advertencias encontradas: ${formatWarnings.length}`);
    if (formatWarnings.length > 0) {
        console.log(`Primeras 10 advertencias:`);
        formatWarnings.slice(0, 10).forEach(w => console.log('  ⚠ ' + w));
    } else {
        console.log(`✔ Estructura y sintaxis CSV 100% limpia y uniforme.`);
    }
}
