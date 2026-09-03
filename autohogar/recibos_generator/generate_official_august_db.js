const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

function render_page(pageData) {
    return pageData.getTextContent().then(tc => tc.items.map(i => i.str).join('\n') + '\n---PAGE_BREAK---\n');
}

async function parsePdf(filePath, verifierName) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }

    const dataBuffer = fs.readFileSync(filePath);
    try {
        const pdf = require('pdf-parse');
        const data = await pdf(dataBuffer, { pagerender: render_page });
        const rawPages = data.text.split('---PAGE_BREAK---').filter(p => p.trim());

        const clients = [];

        for (let i = 0; i < rawPages.length; i++) {
            const pageText = rawPages[i];
            const lines = pageText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            let cod = '';
            let soli = '';
            let name = '';
            let dni = '';
            let address = '';
            let city = '';
            let province = '';
            let plan = '';
            let cuotaNum = '';
            let dueDate = '';
            let phone = '';
            let amount = '';
            let history = '';
            let paymentDate = '';

            const codMatch = pageText.match(/\(\s*0*(\d+)\s*\)\s*\/\s*\d+/);
            if (codMatch) cod = codMatch[1];

            // Extract phones
            const phoneLines = [];
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j];
                // Skip lines that look like money or dates
                if (line.includes('$') || line.includes('08/26') || line.includes('07/26') || line.includes('06/26') || line.includes('09/26')) continue;
                if (/^\d{7,8}$/.test(line)) continue; // DNI
                if (/^\d{4,5}$/.test(line)) continue; // Soli

                // Check for phone patterns (e.g. 264-xxxxxxx, or just 10 digits)
                if (/(\d{3,4}-\d{6,7}|\b\d{10}\b)/.test(line) || (line.includes('/') && line.match(/\d/g)?.length >= 6)) {
                    let cleaned = line.replace(/Señor Cliente:.*/g, '').replace(/[^\d\s\-\/]/g, '').trim();
                    // Clean up trailing zeros often produced by OCR/PDF weirdness
                    cleaned = cleaned.replace(/\.0+$/, '');
                    if (cleaned && cleaned.match(/\d/g)?.length >= 6) {
                        phoneLines.push(cleaned);
                    }
                }
            }
            if (phoneLines.length > 0) {
                // Deduplicate and join
                phone = Array.from(new Set(phoneLines)).join(' / ');
            }

            // Extract main block info
            for (let j = 0; j < lines.length; j++) {
                const line = lines[j];

                if (/^\d{7,8}$/.test(line) && !dni) {
                    dni = line;
                    if (j > 0 && !lines[j-1].includes('(') && !lines[j-1].includes(')')) {
                        name = lines[j-1];
                    }
                    
                    // Parse the sequence from DNI downwards
                    let ptr = j + 1;
                    if (ptr < lines.length && !lines[ptr].startsWith('V.') && !lines[ptr].includes('AMERICANA')) {
                        address = lines[ptr];
                        ptr++;
                    }
                    if (ptr < lines.length && (lines[ptr] === '?' || lines[ptr] === '.' || lines[ptr] === '')) {
                        ptr++;
                    }
                    if (ptr < lines.length && !lines[ptr].startsWith('V.') && !lines[ptr].includes('AMERICANA')) {
                        city = lines[ptr];
                        ptr++;
                    }
                    if (ptr < lines.length && !lines[ptr].startsWith('V.') && !lines[ptr].includes('AMERICANA')) {
                        province = lines[ptr];
                        ptr++;
                    }
                    if (ptr < lines.length && (lines[ptr].startsWith('V.') || lines[ptr].includes('AMERICANA') || lines[ptr].includes('C/COCHERA'))) {
                        plan = lines[ptr];
                        ptr++;
                        if (ptr < lines.length && /^\d{1,3}$/.test(lines[ptr])) {
                            cuotaNum = lines[ptr];
                            ptr++;
                        }
                        if (ptr < lines.length && lines[ptr] === '-') {
                            ptr++;
                        }
                        if (ptr < lines.length && /^\d{2}\/\d{2}\/\d{2,4}$/.test(lines[ptr])) {
                            dueDate = lines[ptr];
                            paymentDate = lines[ptr];
                        }
                    }
                }

                if (!soli && /^0*\d{4,5}$/.test(line) && !line.includes('(') && line !== dni) {
                    soli = String(parseInt(line, 10));
                }

                if (/^\d{1,3}\.\d{3},\d{2}$/.test(line)) {
                    if (!amount) amount = line;
                }

                if (line.includes('/') && line.includes('-') && (line.match(/\//g) || []).length >= 4) {
                    const parts = line.split('-').map(p => p.trim()).filter(p => p);
                    history = parts.slice(-5).join(' - ');
                }
            }

            if (cod || name || soli) {
                clients.push({
                    cod: cod || '-',
                    soli: soli || '-',
                    name: name || 'DESCONOCIDO',
                    dni: dni || '-',
                    address: address || '',
                    city: city || '',
                    province: province || 'SAN JUAN',
                    plan: plan || '-',
                    cuotaNum: cuotaNum || '-',
                    dueDate: dueDate || '15/08/26',
                    paymentDate: paymentDate || '15/08/26',
                    phone: phone || '-',
                    amount: amount || '-',
                    history: history || 'SIN HISTORIAL',
                    verificador: verifierName
                });
            }
        }
        return clients;

    } catch (e) {
        console.error("Error in parsing PDF:", filePath, e);
        return [];
    }
}

async function run() {
    const baseDir = path.join(__dirname, '..', 'BASE_DATOS_OFICIAL_AGOSTO_2026');
    if (!fs.existsSync(baseDir)) {
        fs.mkdirSync(baseDir, { recursive: true });
    }

    const electronicoPath = path.join(__dirname, '..', '07 DIGITALIZADOS electronico agosto real .pdf');
    const oficinaPath = path.join(__dirname, '..', '02 DIGITALIZADOS oficina agosto real.pdf');

    console.log("Parsing Electronico...");
    const clientsElectronico = await parsePdf(electronicoPath, "Administrador 1");
    
    console.log("Parsing Oficina...");
    const clientsOficina = await parsePdf(oficinaPath, "Administrador 2");

    const allClients = [...clientsElectronico, ...clientsOficina];
    console.log(`Total Clients extracted: ${allClients.length} (Electronico: ${clientsElectronico.length}, Oficina: ${clientsOficina.length})`);
    
    fs.writeFileSync(path.join(baseDir, 'clientes_oficiales_agosto_2026.json'), JSON.stringify(allClients, null, 2));

    const exportToExcel = (clients, filename) => {
        const records = clients.map(c => ({
            'COD': c.cod.toString(),
            'CONTRATO (SOLI)': c.soli.toString(),
            'CLIENTE': c.name,
            'DNI': c.dni,
            'TELEFONO': c.phone,
            'DIRECCION': c.address,
            'LOCALIDAD': c.city,
            'PROVINCIA': c.province,
            'PLAN': c.plan,
            'CUOTAS PAGADAS': c.cuotaNum.toString(),
            'VALOR CUOTA ACTUAL ($)': c.amount.startsWith('$') ? c.amount : '$ ' + c.amount,
            'FECHA DE PAGO': c.paymentDate,
            'VENCIMIENTO': c.dueDate,
            'HISTORIAL DE PAGOS': c.history,
            'NOMBRE DE QUIEN TRANSFIERE / PAGA': '',
            'VERIFICADOR': c.verificador
        }));

        const newWorkbook = xlsx.utils.book_new();
        const newWorksheet = xlsx.utils.json_to_sheet(records);

        newWorksheet['!cols'] = [
            {wch: 8}, {wch: 15}, {wch: 35}, {wch: 15}, {wch: 15}, 
            {wch: 35}, {wch: 20}, {wch: 15}, {wch: 35}, {wch: 15}, {wch: 22}, 
            {wch: 15}, {wch: 15}, {wch: 40}, {wch: 40}, {wch: 20}
        ];

        xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Cobranza');
        const targetPath = path.join(baseDir, filename);
        try {
            xlsx.writeFile(newWorkbook, targetPath);
        } catch (e) {
            console.warn(`Could not overwrite ${filename} (file might be open in Excel). Saving to fallback...`);
            const fallbackPath = path.join(baseDir, filename.replace('.xlsx', '_actualizado.xlsx'));
            xlsx.writeFile(newWorkbook, fallbackPath);
            console.log(`Saved as ${filename.replace('.xlsx', '_actualizado.xlsx')}`);
        }
    };

    exportToExcel(clientsElectronico, 'Planilla_Cobranza_Electronico_Agosto_Real.xlsx');
    exportToExcel(clientsOficina, 'Planilla_Cobranza_Oficina_Agosto_Real.xlsx');
    exportToExcel(allClients, 'AUTOHOGAR_BASE_OFICIAL_AGOSTO_REAL.xlsx');

    console.log("Done generating all official August Excel files.");
}

run();
