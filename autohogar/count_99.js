const path = require('path');
const xlsx = require('xlsx');

const filePath = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\autohogar-app\\output_verificacion_directa\\Verificacion_Ambos_Directo_PDF.xlsx';
const wb = xlsx.readFile(filePath);
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

const count99 = data.filter(r => String(r['POR LA SUMA DE ($)']).includes('99.999')).length;

console.log(`Total de registros en la planilla: ${data.length}`);
console.log(`Registros con monto 99.999,00 en el PDF original: ${count99}`);
