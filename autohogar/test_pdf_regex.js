const fs = require('fs');
const path = require('path');
const { PDFParse } = require(path.join(process.cwd(), 'pdf_parser', 'node_modules', 'pdf-parse'));

async function testParse() {
    const p1 = '02 DIGITALIZADOS oficina agosto real.pdf';
    const data = await (new PDFParse(new Uint8Array(fs.readFileSync(p1)))).getText();
    
    // Split by page
    const pages = data.text.split(/-- \d+ of \d+ --/);
    console.log(`Found ${pages.length} pages.`);
    
    let parsedCount = 0;
    
    for (const page of pages) {
        if (!page.trim()) continue;
        
        // Extract the last occurrence of the amount, since the last block has the history
        // Or better, let's just use regex on the page
        
        // We can match the soli and cod:
        // \d+\n\( (\d+)\)
        const soliCodMatch = page.match(/(\d+)\n\(\s*(\d+)\)/);
        
        // Match the Name, DNI, Address
        // Name is followed by DNI (digits) then Address
        const nameDniAddrMatch = page.match(/([A-ZÑÁÉÍÓÚ\s]+?)\s+(\d{7,8})\s+(.+)/);
        
        // Localidad is the line before PLAN
        // PLAN is followed by Cuota - Fecha
        // e.g. V. AMERICANA 2 DOR C/COCHERA 69 - 15/08/26
        const planMatch = page.match(/([A-Z0-9\.\/\-\s]+?)\s+(\d+)\s+-\s+(\d{2}\/\d{2}\/\d{2})/);
        
        // Amount is usually at the end of the block. e.g. 100.000,00
        const amountMatch = page.match(/([\d\.]+,\d{2})/g);
        
        // Localidad is usually the line above the planMatch line.
        // We can extract it by splitting by lines and finding the plan line.
        
        if (soliCodMatch && nameDniAddrMatch && planMatch && amountMatch) {
            const lines = page.split('\n').map(l => l.trim()).filter(l => l);
            const planLineIndex = lines.findIndex(l => l.includes(planMatch[0]));
            
            let city = '';
            if (planLineIndex > 0) {
                // The line right before the plan line, except if it's '?'
                for (let i = planLineIndex - 1; i >= 0; i--) {
                    if (lines[i] !== '?' && !lines[i].match(/^\d+$/) && !lines[i].match(/\d{7,8}/)) {
                        city = lines[i];
                        break;
                    }
                }
            }
            
            console.log({
                soli: soliCodMatch[1],
                cod: soliCodMatch[2],
                name: nameDniAddrMatch[1].trim(),
                dni: nameDniAddrMatch[2],
                address: nameDniAddrMatch[3].trim(),
                plan: planMatch[1].trim(),
                cuotaNum: planMatch[2],
                dueDate: planMatch[3],
                city: city.trim(),
                amount: amountMatch[amountMatch.length - 1] // last match is usually the right amount
            });
            parsedCount++;
            if (parsedCount >= 2) break; // just test first 2
        } else {
            console.log("FAILED to match page:", page.substring(0, 200));
        }
    }
}

testParse().catch(console.error);
