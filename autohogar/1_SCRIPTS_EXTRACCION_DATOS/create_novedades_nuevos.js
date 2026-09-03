const XLSX = require('xlsx');

// Define columns for Novedades / Clientes Nuevos
const columns = [
    "Fecha y Hora",
    "Cargado por (Usuario)",
    "Tipo de Registro", // Cliente No Registrado Anteriormente / Completar Datos Faltantes
    "Grupo y Orden",
    "DNI / CUIT",
    "Nombre y Apellido",
    "Teléfono / WhatsApp",
    "Dirección / Localidad",
    "Plan / Vehículo",
    "Importe / Valor Cuota",
    "Medio de Pago Utilizado",
    "Datos Faltantes Completados",
    "Observaciones / Novedad",
    "Estado de Verificación"
];

// Create worksheet with headers
const ws = XLSX.utils.aoa_to_sheet([columns]);

// Set column widths
const wscols = [
    { wch: 20 }, // Fecha y Hora
    { wch: 20 }, // Cargado por
    { wch: 32 }, // Tipo de Registro
    { wch: 15 }, // Grupo y Orden
    { wch: 15 }, // DNI / CUIT
    { wch: 30 }, // Nombre y Apellido
    { wch: 20 }, // Teléfono
    { wch: 30 }, // Dirección
    { wch: 20 }, // Plan
    { wch: 18 }, // Importe
    { wch: 22 }, // Medio de Pago
    { wch: 35 }, // Datos Faltantes
    { wch: 40 }, // Observaciones
    { wch: 22 }  // Estado Verificación
];
ws['!cols'] = wscols;

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Novedades_Nuevos");

// Write to file
XLSX.writeFile(wb, "Novedades_Clientes_Nuevos.xlsx");

console.log("Planilla Novedades_Clientes_Nuevos.xlsx generada con éxito.");
