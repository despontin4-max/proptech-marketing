const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const filesToRead = [
  '% BANCO (1).pdf',
  '% MEDIO ELECTRONICO.pdf',
  '% OFICINA (1).pdf',
  '% TOTAL COBRANZA (2).pdf',
  'BANCO GALICIA (1).pdf',
  'COBRANZA ULTIMOS 3 MESES (1).pdf',
  'GASTOS OFICINA (1).pdf',
  'MERCADO PAGO (2).pdf',
  'MERCADO PAGO COTEJO (2).pdf',
  'RETIRO (2).pdf',
  'RETIROS MERCADO PAGO (1).pdf',
  'TOTAL FABIO (2).pdf'
];

async function readPDFs() {
  for (const file of filesToRead) {
    try {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        console.log(`\n--- File: ${file} ---`);
        console.log(data.text.substring(0, 500).replace(/\n/g, ' '));
      }
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
    }
  }
}

readPDFs();
