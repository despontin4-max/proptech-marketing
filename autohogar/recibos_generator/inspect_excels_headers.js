const xlsx = require('xlsx');
const path = require('path');

function inspectExcel(filename) {
    console.log(`\n=== Inspecting: ${filename} ===`);
    try {
        const wb = xlsx.readFile(filename);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        const json = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        console.log(`Total rows: ${json.length}`);
        console.log(`Row 0 (Headers):`, json[0]);
        console.log(`Row 1 (Data):`, json[1]);
        console.log(`Row 2 (Data):`, json[2]);
    } catch (e) {
        console.error(e.message);
    }
}

const dir = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
inspectExcel(path.join(dir, 'CARGA CLIENTES ASESOR COBRANZAS.xlsx'));
inspectExcel(path.join(dir, 'CARGA CLIENTES ASESOR COBRANZAS 14 de agosto.xlsx'));
inspectExcel(path.join(dir, '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx'));
