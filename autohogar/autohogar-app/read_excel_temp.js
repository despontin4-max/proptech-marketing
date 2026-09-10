const xlsx = require('xlsx');
const filePath = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\5_EXCELS_SISTEMA_LOCAL\\07 MEDIO ELECT AGOSTO 2026 FINAL.xlsx';
const wb = xlsx.readFile(filePath);
const sheetName = wb.SheetNames[0];
const data = xlsx.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

for (let i = 2; i <= 6; i++) {
  console.log(`\nRow ${i}:`);
  console.log(JSON.stringify(data[i], null, 2));
}
