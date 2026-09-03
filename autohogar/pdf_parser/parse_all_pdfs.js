const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const sourceDir = path.join(__dirname, '..', 'numeros-autohogar');
const destDir = path.join(__dirname, '..', 'numeros-autohogar', 'txt_extracted');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir);
}

async function parseAll() {
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
        if (file.toLowerCase().endsWith('.pdf')) {
            const filePath = path.join(sourceDir, file);
            try {
                const dataBuffer = fs.readFileSync(filePath);
                const parser = new PDFParse(new Uint8Array(dataBuffer));
                const data = await parser.getText();
                const txtFileName = file.substring(0, file.length - 4) + '.txt';
                fs.writeFileSync(path.join(destDir, txtFileName), data.text);
                console.log(`Successfully parsed: ${txtFileName}`);
            } catch (err) {
                console.error(`Error parsing ${file}:`, err);
            }
        }
    }
}

parseAll();
