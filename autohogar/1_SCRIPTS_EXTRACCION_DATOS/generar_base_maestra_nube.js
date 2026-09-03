const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, '5_EXCELS_SISTEMA_LOCAL');

function parseClientFullData(page, type) {
    const soliCodMatch = page.match(/(\d+)\n\(\s*(\d+)\)/);
    const nameDniAddrMatch = page.match(/([A-ZÑÁÉÍÓÚ\s]+?)\s+(\d{7,8})\s+(.+)/);
    const planMatch = page.match(/([A-Z0-9\.\/\-\s]+?)\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{2})/);
    const amountMatch = page.match(/([\d\.]+,\d{2})/g);
    const phoneMatch = page.match(/(?:264\d{7}|264-\d{7}|\d{10})/g);
    const phone = phoneMatch ? phoneMatch.join(' / ') : '';

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
            'ANTECEDENTES VERIFICADOS (ADMIN)': '',
            'DNI': nameDniAddrMatch[2],
            'NOMBRE Y APELLIDO': nameDniAddrMatch[1].trim(),
            'TELEFONO': phone,
            'DIRECCION': nameDniAddrMatch[3].trim(),
            'LOCALIDAD': city.trim(),
            'CONTRATO (SOLI)': Number(soliCodMatch[1]),
            'CODIGO CLIENTE': Number(soliCodMatch[2]),
            'PLAN / PRODUCTO': plan,
            'CANTIDAD TOTAL DE CUOTAS': '', // Vacio para ser llenado manualmente
            'CUOTA ACTUAL (PDF)': Number(planMatch[2]),
            'FECHA DE VENCIMIENTO': planMatch[3],
            'IMPORTE ABONADO': amountStr,
            'MEDIO DE PAGO (PDF)': type === 'Oficina' ? 'OFICINA' : 'ELECTRONICO',
            'SALDO ACUMULADO A FAVOR': '',
            'PAGOS POR ADELANTADO': '',
            'HISTORIAL ULTIMOS 5 PAGOS': '',
            'OBSERVACIONES INTERNAS': ''
        };
    }
    return null;
}

async function processPdfFull(filePath, type) {
    console.log(`Leyendo PDF: ${filePath}...`);
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

async function generateMaster() {
    try {
        const pdfOficina = '02 DIGITALIZADOS oficina agosto real.pdf';
        const pdfElectronico = '07 DIGITALIZADOS electronico agosto real .pdf';
        
        const dataOficina = await processPdfFull(pdfOficina, 'Oficina');
        const dataElectronico = await processPdfFull(pdfElectronico, 'Electronico');
        
        // Consolidar y eliminar duplicados por DNI/Contrato
        const allClientsMap = new Map();
        
        [...dataOficina, ...dataElectronico].forEach(c => {
            const key = `${c['DNI']}_${c['CONTRATO (SOLI)']}`;
            if (!allClientsMap.has(key)) {
                allClientsMap.set(key, c);
            }
        });

        const unifiedClients = Array.from(allClientsMap.values());
        
        // Tab 1: Clientes Activos
        const wsActivos = xlsx.utils.json_to_sheet(unifiedClients);
        wsActivos['!cols'] = [
            {wch: 35}, // VERIFICADO
            {wch: 12}, // DNI
            {wch: 35}, // NOMBRE
            {wch: 25}, // TELEFONO
            {wch: 30}, // DIRECCION
            {wch: 20}, // LOCALIDAD
            {wch: 15}, // SOLI
            {wch: 15}, // COD
            {wch: 35}, // PLAN
            {wch: 25}, // TOTAL CUOTAS
            {wch: 20}, // CUOTA ACTUAL
            {wch: 22}, // VENCIMIENTO
            {wch: 20}, // IMPORTE
            {wch: 20}, // MEDIO
            {wch: 25}, // SALDO
            {wch: 25}, // ADELANTADO
            {wch: 40}, // HISTORIAL
            {wch: 40}  // OBSERVACIONES
        ];

        // Tab 2: Clientes No Registrados
        const headersNoRegistrados = [
            "FECHA DE REPORTE", "DNI", "NOMBRE Y APELLIDO APROXIMADO", "TELEFONO CONTACTO", 
            "MONTO RECIBIDO", "MEDIO DE PAGO", "OBSERVACIONES / DETALLE", "VERIFICADO E INGRESADO AL SISTEMA"
        ];
        const wsNoRegistrados = xlsx.utils.aoa_to_sheet([headersNoRegistrados]);
        wsNoRegistrados['!cols'] = [{wch:15}, {wch:12}, {wch:35}, {wch:25}, {wch:20}, {wch:20}, {wch:40}, {wch:35}];

        // Tab 3: Turnero
        const headersTurnero = [
            "DIA", "HORA", "DNI CLIENTE", "NOMBRE (AUTOCOMPLETADO)", "PLAN (AUTOCOMPLETADO)", 
            "MOTIVO DEL TURNO", "NIVEL DE URGENCIA / ENOJO (1-10)", "OBSERVACIONES / RESOLUCION"
        ];
        // Ejemplo de formula VLOOKUP (esto es representativo para que lo vea en Drive)
        const row2 = ["", "", "", "=IFERROR(VLOOKUP(C2, 'CLIENTES ACTIVOS'!B:I, 2, FALSE), \"\")", "=IFERROR(VLOOKUP(C2, 'CLIENTES ACTIVOS'!B:I, 8, FALSE), \"\")", "", "", ""];
        const wsTurnero = xlsx.utils.aoa_to_sheet([headersTurnero, row2]);
        wsTurnero['!cols'] = [{wch:12}, {wch:10}, {wch:12}, {wch:35}, {wch:35}, {wch:30}, {wch:35}, {wch:40}];

        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, wsActivos, 'CLIENTES ACTIVOS');
        xlsx.utils.book_append_sheet(wb, wsNoRegistrados, 'NO REGISTRADOS');
        xlsx.utils.book_append_sheet(wb, wsTurnero, 'TURNERO ATENCION');

        const outPath = path.join(OUTPUT_DIR, 'BASE_MAESTRA_AUTOHOGAR_NUBE.xlsx');
        xlsx.writeFile(wb, outPath);
        
        console.log(`\n¡ÉXITO! Base Maestra generada en: ${outPath}`);
        console.log(`Total de clientes unificados (02 + 07): ${unifiedClients.length}`);

    } catch (error) {
        console.error("Error al generar la base:", error);
    }
}

generateMaster();
