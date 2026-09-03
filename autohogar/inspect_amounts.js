const path = require('path');
const xlsx = require('xlsx');

const filePath = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\autohogar-app\\output_verificacion_directa\\Verificacion_Ambos_Directo_PDF.xlsx';
const wb = xlsx.readFile(filePath);
const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

console.log("=== INSPECCION DE MONTO EN REGISTROS DE LA PLANILLA ===");
data.slice(0, 15).forEach((row, i) => {
    console.log(`Fila ${i+1}: Cliente=${row['RECIBIMOS DE']}, Soli=${row['SOLI']}, Cuota=${row['EN CONCEPTO DE CUOTA NRO']}, Monto=${row['POR LA SUMA DE ($)']}`);
});
