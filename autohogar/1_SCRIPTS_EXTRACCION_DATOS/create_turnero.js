const XLSX = require('xlsx');

// Define the columns for the Turnero
const columns = [
    "Fecha y Hora",
    "Cliente (Nombre / DNI)",
    "Grupo y Orden",
    "Atendido por (Usuario)",
    "Canal de Atención",
    "Tipo de Consulta",
    "Nivel de Urgencia (1 al 10)",
    "Comentarios / Detalle",
    "Estado (Pendiente / Resuelto)"
];

// Create an empty worksheet with headers
const ws = XLSX.utils.aoa_to_sheet([columns]);

// Set column widths for better readability
const wscols = [
    { wch: 20 }, // Fecha y Hora
    { wch: 30 }, // Cliente
    { wch: 15 }, // Grupo y Orden
    { wch: 20 }, // Atendido por
    { wch: 20 }, // Canal de Atención
    { wch: 25 }, // Tipo de Consulta
    { wch: 25 }, // Nivel de Urgencia
    { wch: 50 }, // Comentarios
    { wch: 20 }  // Estado
];
ws['!cols'] = wscols;

// Create a new workbook and append the worksheet
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Turnero");

// Write to file
XLSX.writeFile(wb, "Turnero_Atencion.xlsx");

console.log("Planilla Turnero_Atencion.xlsx generada con éxito.");
