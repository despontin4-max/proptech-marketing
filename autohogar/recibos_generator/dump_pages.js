const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

function render_page(pageData) {
    return pageData.getTextContent().then(tc => tc.items.map(i => i.str).join('\n') + '\n---PAGE_BREAK---\n');
}

async function run() {
    const filePath = path.join(__dirname, '..', '02 DIGITALIZADOS oficina agosto real.pdf');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer, { pagerender: render_page });
    const rawPages = data.text.split('---PAGE_BREAK---').filter(p => p.trim());
    
    for(let i=0; i<3; i++) {
        console.log(`===== PAGE ${i+1} =====`);
        const lines = rawPages[i].split('\n').map(l => l.trim()).filter(l => l.length > 0);
        lines.forEach((line, idx) => {
            console.log(`[${idx}] ${line}`);
        });
    }
}
run();
