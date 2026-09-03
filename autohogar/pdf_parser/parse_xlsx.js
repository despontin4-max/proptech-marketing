const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const sourceDir = path.join(__dirname, '..', 'numeros-autohogar');
const destDir = path.join(__dirname, '..', 'numeros-autohogar', 'txt_extracted');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

const xlsxFiles = [
    'MERCADO PAGO ENERO 2026.xlsx',
    'MERCADO PAGO FEBRERO 2026.xlsx'
];

function parseXlsx() {
    for (const file of xlsxFiles) {
        const filePath = path.join(sourceDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${file}`);
            continue;
        }
        try {
            const workbook = XLSX.readFile(filePath);
            let text = '';
            for (const sheetName of workbook.SheetNames) {
                text += `=== SHEET: ${sheetName} ===\n`;
                const sheet = workbook.Sheets[sheetName];
                const csv = XLSX.utils.sheet_to_csv(sheet);
                text += csv + '\n';
            }
            const txtFileName = file.replace('.xlsx', '.txt');
            fs.writeFileSync(path.join(destDir, txtFileName), text);
            console.log(`Successfully parsed and saved: ${txtFileName}`);
        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
        }
    }
}

parseXlsx();
