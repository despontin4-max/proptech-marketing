const xlsx = require('xlsx');
const path = require('path');

// Agregadas Col16 (Pagos por Adelantado) y Col18 (Observaciones Internas para ver Bajas)
const formula = 'QUERY(IMPORTRANGE("1kKzGWJBK0acSl0viyMT3R1KjuRiiG6G32kceqWBPPgM", "CLIENTES ACTIVOS!A:R"), "SELECT Col2, Col3, Col4, Col5, Col6, Col7, Col8, Col9, Col11, Col12, Col13, Col14, Col16, Col17, Col18 WHERE Col2 IS NOT NULL")';

const ws = xlsx.utils.aoa_to_sheet([
    [{ f: formula }] // Inyectar como fórmula en A1
]);

const wb = xlsx.utils.book_new();
xlsx.utils.book_append_sheet(wb, ws, "OPERATIVA EMPLEADOS");

const outPath = path.join('C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\5_EXCELS_SISTEMA_LOCAL', 'PLANILLA_OPERATIVA_EMPLEADOS.xlsx');
xlsx.writeFile(wb, outPath);

console.log("Planilla operativa actualizada en: " + outPath);
