const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const sourceDir = path.join(__dirname, '..', 'numeros-autohogar');
const destDir = path.join(__dirname, '..', 'numeros-autohogar', 'txt_extracted');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

const pdfFiles = [
    '% OFICINA (1).pdf',
    '% MEDIO ELECTRONICO.pdf',
    '% BANCO (1).pdf',
    'TOTAL FABIO (2).pdf',
    'RETIROS MERCADO PAGO (1).pdf',
    'MERCADO PAGO (2).pdf',
    'MERCADO PAGO COTEJO (2).pdf',
    'GASTOS OFICINA (1).pdf',
    'BANCO GALICIA (1).pdf',
    '% TOTAL COBRANZA (2).pdf'
];

async function parseAll() {
    for (const file of pdfFiles) {
        const filePath = path.join(sourceDir, file);
        if (!fs.existsSync(filePath)) {
            console.log(`File not found: ${file}`);
            continue;
        }
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse(new Uint8Array(dataBuffer));
            const data = await parser.getText();
            const txtFileName = file.replace('.pdf', '.txt');
            fs.writeFileSync(path.join(destDir, txtFileName), data.text);
            console.log(`Successfully parsed and saved: ${txtFileName}`);
        } catch (err) {
            console.error(`Error parsing ${file}:`, err);
        }
    }
}

parseAll();
