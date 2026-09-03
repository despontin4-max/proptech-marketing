const xlsx = require('xlsx');
const path = require('path');

const file1 = path.join('C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar', 'CARGA CLIENTES ASESOR COBRANZAS.xlsx');
const wb1 = xlsx.readFile(file1);
const data1 = xlsx.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1 });
console.log("File 1 total rows:", data1.length);
console.log(data1.slice(0, 10));

const file2 = path.join('C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar', '07 Clientes de pago electronico  de ENERO 2025.xlsx');
if (require('fs').existsSync(file2)) {
    const wb2 = xlsx.readFile(file2);
    const data2 = xlsx.utils.sheet_to_json(wb2.Sheets[wb2.SheetNames[0]], { header: 1 });
    console.log("File ENERO 2025 total rows:", data2.length);
}
