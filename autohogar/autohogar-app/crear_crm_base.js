const xlsx = require('xlsx');
const path = require('path');

// 1. Create a new Workbook
const wb = xlsx.utils.book_new();

// 2. Define headers for each sheet
const clientesHeaders = [
    ['COD_CUENTA', 'NOMBRE_APELLIDO', 'DNI', 'TELEFONO', 'LOCALIDAD', 'DIRECCION', 'PLAN', 'CUOTAS_TOTALES', 'VALOR_CUOTA', 'ESTADO']
];

const cuentaCorrienteHeaders = [
    ['FECHA_VENCIMIENTO', 'FECHA_PAGO_REAL', 'COD_CUENTA', 'CONCEPTO', 'MEDIO_PAGO', 'VERIFICACION_ADMIN', 'DEBE', 'HABER']
];

const novedadesHeaders = [
    ['FECHA', 'COD_CUENTA', 'OPERADOR', 'ACUDIO_AL_TURNO', 'RESOLUCION', 'OBSERVACION', 'PROXIMO_TURNO']
];

const resumenHeaders = [
    ['COD_CUENTA', 'NOMBRE', 'TELEFONO', 'TOTAL_HABER', 'SALDO_ACTUAL', 'FECHA_PROX_VENCIMIENTO', 'DIAS_ATRASO', 'ALERTA_MOROSIDAD', 'WHATSAPP']
];

const metricasHeaders = [
    ['METRICAS_Y_KPI']
];

// 3. Create sheets from arrays
const wsClientes = xlsx.utils.aoa_to_sheet(clientesHeaders);
const wsCuentaCorriente = xlsx.utils.aoa_to_sheet(cuentaCorrienteHeaders);
const wsNovedades = xlsx.utils.aoa_to_sheet(novedadesHeaders);
const wsResumen = xlsx.utils.aoa_to_sheet(resumenHeaders);
const wsMetricas = xlsx.utils.aoa_to_sheet(metricasHeaders);

// 4. Append sheets to the workbook
xlsx.utils.book_append_sheet(wb, wsClientes, '1_CLIENTES');
xlsx.utils.book_append_sheet(wb, wsCuentaCorriente, '2_CUENTA_CORRIENTE');
xlsx.utils.book_append_sheet(wb, wsNovedades, '3_NOVEDADES_Y_TURNERO');
xlsx.utils.book_append_sheet(wb, wsResumen, '4_RESUMEN_FINANCIERO');
xlsx.utils.book_append_sheet(wb, wsMetricas, '5_METRICAS_KPI');

// 5. Save the Excel file
const outputPath = path.join('C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\5_EXCELS_SISTEMA_LOCAL', 'SISTEMA_CRM_AUTOHOGAR.xlsx');
xlsx.writeFile(wb, outputPath);

console.log('Archivo creado exitosamente en:', outputPath);
