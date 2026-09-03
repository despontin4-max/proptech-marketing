const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const BASE = 'C:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar';
const OUTPUT_DIR = path.join(BASE, 'autohogar-app', 'output_verificacion_directa');

const existingPath = path.join(OUTPUT_DIR, 'Verificacion_Ambos_Directo_PDF.xlsx');
let existingData = [];
if (fs.existsSync(existingPath)) {
    const wbExist = xlsx.readFile(existingPath);
    existingData = xlsx.utils.sheet_to_json(wbExist.Sheets[wbExist.SheetNames[0]]);
}

const wb = xlsx.utils.book_new();

// Tab 1: RESUMEN MAESTRO
const wsMaestro = xlsx.utils.json_to_sheet(existingData);
xlsx.utils.book_append_sheet(wb, wsMaestro, 'RESUMEN_MAESTRO');

// Tab 2: OFICINA EN VIVO (Apunta a B6 de CONFIGURACION)
const ofiFormulas = [
    ["DATOS EN VIVO DE OFICINA (ANTONELLA)"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B6, "Verificacion!A2:R"), "Pega la URL de Oficina en la celda B6 de la pestaña CONFIGURACION")']
];
const wsOfi = xlsx.utils.aoa_to_sheet(ofiFormulas);
xlsx.utils.book_append_sheet(wb, wsOfi, 'OFICINA_EN_VIVO');

// Tab 3: ELECTRONICOS EN VIVO (Apunta a B7 de CONFIGURACION)
const elecFormulas = [
    ["DATOS EN VIVO DE ELECTRONICOS (FLORENCIA)"],
    ['=IFERROR(IMPORTRANGE(CONFIGURACION!B7, "Verificacion!A2:R"), "Pega la URL de Electronicos en la celda B7 de la pestaña CONFIGURACION")']
];
const wsElec = xlsx.utils.aoa_to_sheet(elecFormulas);
xlsx.utils.book_append_sheet(wb, wsElec, 'ELECTRONICOS_EN_VIVO');

// Tab 4: CONFIGURACION
const configData = [
    ["PASOS PARA CONECTAR:", ""],
    ["1. Abre en tu navegador la planilla de Oficina subida a Drive y copia el enlace arriba (URL).", ""],
    ["2. Pégalo en la Celda B6 (donde dice PEGA_AQUI_URL_DE_OFICINA).", ""],
    ["3. Abre la planilla de Electrónicos en Drive, copia el enlace y pégalo en la Celda B7.", ""],
    ["", ""],
    ["PLANILLA", "ENLACE DE GOOGLE DRIVE (URL)"],
    ["Planilla Oficina (Antonella):", "PEGA_AQUI_URL_DE_OFICINA"],
    ["Planilla Electrónicos (Florencia):", "PEGA_AQUI_URL_DE_ELECTRONICOS"]
];
const wsConfig = xlsx.utils.aoa_to_sheet(configData);
wsConfig['!cols'] = [{wch: 35}, {wch: 90}];
xlsx.utils.book_append_sheet(wb, wsConfig, 'CONFIGURACION');

xlsx.writeFile(wb, existingPath);
console.log("Planilla Maestra corregida con celdas B6 y B7 exactas.");
