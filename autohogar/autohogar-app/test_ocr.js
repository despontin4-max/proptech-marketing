const tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, '../cobranzas_oficina_capturas/captura_clientes_pantalla/Captura Clientes');
const files = fs.readdirSync(imgDir).filter(f => f.endsWith('.png'));

async function testOCR() {
    console.log(`Encontrados ${files.length} archivos. Probando con 2...`);
    for(let i = 0; i < 2; i++) {
        const file = files[i];
        const imgPath = path.join(imgDir, file);
        console.log(`Procesando: ${file}...`);
        
        try {
            const { data: { text } } = await tesseract.recognize(imgPath, 'spa');
            console.log('--- TEXTO EXTRAIDO ---');
            console.log(text);
            console.log('----------------------');
            
            // Buscar "Total Pagos"
            const totalPagosMatch = text.match(/Total Pagos[\s\S]*?\$?\s*([0-9.,]+)/i);
            console.log('Total Pagos:', totalPagosMatch ? totalPagosMatch[1] : 'No encontrado');
            
            const saldoMatch = text.match(/Saldo al[\s\S]*?\$?\s*([0-9.,]+)/i) || text.match(/Debe\s*\$\s*([0-9.,]+)/i) || text.match(/A Favor\s*\$\s*([0-9.,]+)/i);
            console.log('Saldo:', saldoMatch ? saldoMatch[1] : 'No encontrado');
            
        } catch(e) {
            console.error('Error OCR:', e);
        }
    }
}

testOCR();
