const fs = require('fs');
const path = require('path');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

async function inspectMunoz() {
    const filePath = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\02 DIGITALIZADOS oficina agosto real.pdf';
    const data = await (new PDFParse(new Uint8Array(fs.readFileSync(filePath)))).getText();
    const pages = data.text.split(/-- \d+ of \d+ --/);
    
    pages.forEach((page, idx) => {
        if (page.includes('MUÑOZ LAURA') || page.includes('10122')) {
            console.log(`=== PAGINA ${idx+1} MUÑOZ LAURA ANDREA ===`);
            console.log(page);
        }
    });
}

inspectMunoz();
