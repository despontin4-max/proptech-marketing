const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_verificacion_directa');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function parseClientFullData(page, type) {
    const soliCodMatch = page.match(/(\d+)\n\(\s*(\d+)\)/);
    const nameDniAddrMatch = page.match(/([A-ZÑÁÉÍÓÚ\s]+?)\s+(\d{7,8})\s+(.+)/);
    const planMatch = page.match(/([A-Z0-9\.\/\-\s]+?)\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{2})/);
    const amountMatch = page.match(/([\d\.]+,\d{2})/g);
    
    // Extract phone numbers if present
    const phoneMatch = page.match(/(?:264\d{7}|264-\d{7}|\d{10})/g);
    const phone = phoneMatch ? phoneMatch.join(' / ') : '';

    // Extract cobrador / sucursal code e.g. ( 02 ) or ( 07 )
    const cobradorMatch = page.match(/\(\s*(\d{2})\s*\)/);
    const cobrador = cobradorMatch ? cobradorMatch[1] : (type === 'Oficina' ? '02' : '07');

    if (soliCodMatch && nameDniAddrMatch && planMatch && amountMatch) {
        const planParts = planMatch[1].trim().split('\n');
        let city = '';
        let plan = planParts[0];
        if (planParts.length > 1) {
            city = planParts[0];
            plan = planParts.slice(1).join(' ').trim();
        }

        let amountStr = amountMatch[amountMatch.length - 1];

        return {
            'Verificado': '',
            'Medio de Pago': type === 'Oficina' ? 'Contado' : 'Electronico',
            'Fecha de Pago': '',
            'Hora de Pago': '',
            'RECIBO NRO (Cod)': Number(soliCodMatch[2]),
            'FECHA DE EMISION': '', // Para completar al momento de cobrar/emitir
            'FECHA DE VENCIMIENTO': planMatch[3],
            'RECIBIMOS DE': nameDniAddrMatch[1].trim(),
            'NRO DNI': nameDniAddrMatch[2],
            'TELEFONO / WHATSAPP': phone,
            'SOLI': Number(soliCodMatch[1]),
            'COBRADOR / SUCURSAL': cobrador,
            'DIRECCION': nameDniAddrMatch[3].trim(),
            'LOCALIDAD': city.trim(),
            'PLAN': plan,
            'EN CONCEPTO DE CUOTA NRO': Number(planMatch[2]),
            'POR LA SUMA DE ($)': amountStr,
            'NOTAS / OBSERVACIONES': ''
        };
    }
    return null;
}

async function processPdfFull(filePath, type) {
    const data = await (new PDFParse(new Uint8Array(fs.readFileSync(path.join(BASE, filePath))))).getText();
    const pages = data.text.split(/-- \d+ of \d+ --/);
    
    const results = [];
    for (const page of pages) {
        if (!page.trim()) continue;
        const clientRow = parseClientFullData(page, type);
        if (clientRow) {
            results.push(clientRow);
        }
    }
    return results;
}

function saveExcelFull(data, name) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    ws['!cols'] = [
        {wch: 12}, // Verificado
        {wch: 15}, // Medio de Pago
        {wch: 15}, // Fecha de Pago
        {wch: 15}, // Hora de Pago
        {wch: 18}, // RECIBO NRO
        {wch: 18}, // FECHA EMISION
        {wch: 22}, // FECHA VENCIMIENTO
        {wch: 35}, // RECIBIMOS DE
        {wch: 12}, // DNI
        {wch: 25}, // TELEFONO / WHATSAPP
        {wch: 10}, // SOLI
        {wch: 18}, // COBRADOR
        {wch: 35}, // DIRECCION
        {wch: 25}, // LOCALIDAD
        {wch: 35}, // PLAN
        {wch: 25}, // CUOTA NRO
        {wch: 20}, // MONTO
        {wch: 30}  // NOTAS
    ];
    xlsx.utils.book_append_sheet(wb, ws, 'Verificacion');
    const outPath = path.join(OUTPUT_DIR, name);
    xlsx.writeFile(wb, outPath);
    console.log(`Guardado completo: ${outPath} con ${data.length} registros.`);
}

async function main() {
    try {
        const p1 = '02 DIGITALIZADOS oficina agosto real.pdf';
        const p2 = '07 DIGITALIZADOS electronico agosto real .pdf';

        const ofiData = await processPdfFull(p1, 'Oficina');
        const elecData = await processPdfFull(p2, 'Electronico');
        const ambosData = [...ofiData, ...elecData];

        saveExcelFull(ofiData, 'Verificacion_Oficina_Directo_PDF.xlsx');
        saveExcelFull(elecData, 'Verificacion_Electronicos_Directo_PDF.xlsx');
        saveExcelFull(ambosData, 'Verificacion_Ambos_Directo_PDF.xlsx');
        
        console.log("¡Planillas actualizadas con todos los detalles de recibo!");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
