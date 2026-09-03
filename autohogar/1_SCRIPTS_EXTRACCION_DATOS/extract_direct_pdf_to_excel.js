const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_verificacion_directa');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function parseClientData(page, type) {
    const soliCodMatch = page.match(/(\d+)\n\(\s*(\d+)\)/);
    const nameDniAddrMatch = page.match(/([A-ZÑÁÉÍÓÚ\s]+?)\s+(\d{7,8})\s+(.+)/);
    const planMatch = page.match(/([A-Z0-9\.\/\-\s]+?)\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{2})/);
    const amountMatch = page.match(/([\d\.]+,\d{2})/g);

    if (soliCodMatch && nameDniAddrMatch && planMatch && amountMatch) {
        const planParts = planMatch[1].trim().split('\n');
        let city = '';
        let plan = planParts[0];
        if (planParts.length > 1) {
            city = planParts[0];
            plan = planParts.slice(1).join(' ').trim();
        }

        // Clean amount string to number (optional, but requested string format is fine. We will convert to number for excel if needed, or leave as string)
        let amountStr = amountMatch[amountMatch.length - 1];

        return {
            'Verificado': '',
            'Medio de Pago': type === 'Oficina' ? 'Contado' : 'Electronico',
            'Fecha de pago': '',
            'Hora de pago': '',
            'RECIBO NRO (Cod)': Number(soliCodMatch[2]),
            'FECHA DE VENCIMIENTO': planMatch[3],
            'RECIBIMOS DE': nameDniAddrMatch[1].trim(),
            'SOLI': Number(soliCodMatch[1]),
            'DIRECCION': nameDniAddrMatch[3].trim(),
            'LOCALIDAD': city.trim(),
            'NRO DNI': nameDniAddrMatch[2],
            'PLAN': plan,
            'EN CONCEPTO DE CUOTA NRO': Number(planMatch[2]),
            'POR LA SUMA DE ($)': amountStr
        };
    }
    return null;
}

async function processPdf(filePath, type) {
    console.log(`Leyendo PDF: ${filePath}...`);
    const data = await (new PDFParse(new Uint8Array(fs.readFileSync(path.join(BASE, filePath))))).getText();
    const pages = data.text.split(/-- \d+ of \d+ --/);
    console.log(`Encontradas ${pages.length} hojas/recibos en ${type}.`);
    
    const results = [];
    for (const page of pages) {
        if (!page.trim()) continue;
        const clientRow = parseClientData(page, type);
        if (clientRow) {
            results.push(clientRow);
        } else {
            console.warn(`No se pudo parsear una pagina en ${type}. Inicio: ${page.substring(0, 100).replace(/\n/g, ' ')}`);
        }
    }
    return results;
}

function saveExcel(data, name) {
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    ws['!cols'] = [
        {wch: 12}, // Verificado
        {wch: 15}, // Medio de Pago
        {wch: 15}, // Fecha
        {wch: 15}, // Hora
        {wch: 18}, // COD
        {wch: 22}, // VENCIMIENTO
        {wch: 35}, // NOMBRE
        {wch: 10}, // SOLI
        {wch: 35}, // DIRECCION
        {wch: 25}, // LOCALIDAD
        {wch: 12}, // DNI
        {wch: 35}, // PLAN
        {wch: 25}, // CUOTA
        {wch: 20}, // MONTO
    ];
    xlsx.utils.book_append_sheet(wb, ws, 'Verificacion');
    const outPath = path.join(OUTPUT_DIR, name);
    xlsx.writeFile(wb, outPath);
    console.log(`Guardado ${outPath} con ${data.length} registros.`);
}

async function main() {
    try {
        const p1 = '02 DIGITALIZADOS oficina agosto real.pdf';
        const p2 = '07 DIGITALIZADOS electronico agosto real .pdf';

        const ofiData = await processPdf(p1, 'Oficina');
        const elecData = await processPdf(p2, 'Electronico');

        const ambosData = [...ofiData, ...elecData];

        saveExcel(ofiData, 'Verificacion_Oficina_Directo_PDF.xlsx');
        saveExcel(elecData, 'Verificacion_Electronicos_Directo_PDF.xlsx');
        saveExcel(ambosData, 'Verificacion_Ambos_Directo_PDF.xlsx');
        
        console.log("¡Proceso finalizado exitosamente!");
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
