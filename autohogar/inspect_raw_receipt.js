const fs = require('fs');
const path = require('path');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

async function inspectRawReceipt() {
    const filePath = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\02 DIGITALIZADOS oficina agosto real.pdf';
    const data = await (new PDFParse(new Uint8Array(fs.readFileSync(filePath)))).getText();
    const pages = data.text.split(/-- \d+ of \d+ --/);
    console.log("=== EJEMPLO DE TEXTO CRUDO DE UN RECIBO PDF ===");
    console.log(pages[0]);
}

inspectRawReceipt();
