const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const pdf = require('pdf-parse');

async function extractMethodsFromPDFs() {
  const directory = path.join(__dirname, '..');
  const methodMap = {};

  const pdfSources = [
    { file: 'BANCO GALICIA (1).pdf', method: 'BANCO GALICIA' },
    { file: 'MERCADO PAGO (2).pdf', method: 'MERCADO PAGO' },
    { file: 'MERCADO PAGO COTEJO (2).pdf', method: 'MERCADO PAGO' }
  ];

  for (const source of pdfSources) {
    const filePath = path.join(directory, source.file);
    if (fs.existsSync(filePath)) {
      const dataBuffer = fs.readFileSync(filePath);
      try {
        const data = await pdf(dataBuffer);
        const text = data.text.toUpperCase();
        if (!methodMap[source.method]) methodMap[source.method] = "";
        methodMap[source.method] += " " + text;
      } catch(e) { }
    }
  }
  
  const cargaExcel = path.join(directory, 'CARGA CLIENTES ASESOR COBRANZAS.xlsx');
  let cargaData = [];
  if (fs.existsSync(cargaExcel)) {
     const wb = xlsx.readFile(cargaExcel);
     cargaData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  }

  return { methodMap, cargaData };
}

function normalize(name) {
    if (!name) return "";
    return name.toString().toUpperCase().replace(/\s+/g, ' ').trim();
}

function formatPhone(phone) {
    if (!phone) return "";
    return phone.toString().replace(/[^\d-]/g, '').trim();
}

async function run() {
  const { methodMap, cargaData } = await extractMethodsFromPDFs();

  const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
  let masterData = [];
  if (fs.existsSync(jsonPath)) {
    masterData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  const excelPath = path.join(__dirname, '..', '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
  let excelData = [];
  if (fs.existsSync(excelPath)) {
    const workbook = xlsx.readFile(excelPath);
    excelData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
  }

  const rows = excelData.slice(2);
  const records = [];

  for (const row of rows) {
    const cod = row[0];
    const name = row[1];
    if (!cod || !name) continue;

    const normName = normalize(name);
    const match = masterData.find(m => m.cod == cod && normalize(m.name) === normName) || 
                  masterData.find(m => normalize(m.name) === normName) || {};

    const phone = formatPhone(row[2] || match.phone || '');
    const soli = row[4] || match.soli || '';
    const cuotaActual = row[5] || match.cuotaNum || '';
    const importeCuota = row[6] || match.amount || '';
    
    let medioPago = 'NO DEFINIDO';
    const cargaMatch = cargaData.find(r => r[1] == cod || (r[2] && normalize(r[2]) === normName));
    if (cargaMatch && cargaMatch[5]) {
       medioPago = cargaMatch[5].toString().toUpperCase();
    } else {
        let found = false;
        for (const [method, text] of Object.entries(methodMap)) {
            const textNoSpaces = text.replace(/\s+/g, '');
            const nameNoSpaces = normName.replace(/\s+/g, '');
            if (textNoSpaces.includes(nameNoSpaces)) {
                medioPago = method;
                found = true;
                break;
            }
        }
        if (!found) {
            const xOficina = row[11];
            const bcoOElect = row[12];
            if (xOficina) medioPago = 'OFICINA (EFECTIVO/POSNET)';
            else if (bcoOElect) medioPago = 'MEDIO ELECTRONICO (GENERICO)';
        }
    }

    // Since quota values increase, a total sum is not 100% accurate without ledger, 
    // but we present the cuotas pagadas (N° CUOTA ACTUAL)
    records.push({
      'COD': cod.toString(),
      'CONTRATO (SOLI)': soli.toString(),
      'CLIENTE': name,
      'TELEFONO': phone,
      'DNI': (match.dni || 'FALTA').toString(),
      'PLAN': match.plan || 'FALTA',
      'MEDIO DE PAGO EXACTO': medioPago,
      'CUOTAS PAGADAS': cuotaActual.toString(),
      'VALOR CUOTA ACTUAL ($)': importeCuota.toString(),
      'FECHAS HISTORIAL PAGOS': match.history ? match.history.trim() : 'SIN HISTORIAL'
    });
  }

  // Handle missing ones from JSON
  for (const m of masterData) {
      if (!records.find(r => r.COD == m.cod)) {
          records.push({
              'COD': m.cod.toString(),
              'CONTRATO (SOLI)': m.soli.toString(),
              'CLIENTE': m.name,
              'TELEFONO': formatPhone(m.phone),
              'DNI': (m.dni || 'FALTA').toString(),
              'PLAN': m.plan || 'FALTA',
              'MEDIO DE PAGO EXACTO': 'NO EN EXCEL MENSUAL',
              'CUOTAS PAGADAS': m.cuotaNum.toString(),
              'VALOR CUOTA ACTUAL ($)': m.amount.toString(),
              'FECHAS HISTORIAL PAGOS': m.history ? m.history.trim() : 'SIN HISTORIAL'
          });
      }
  }

  const newWorkbook = xlsx.utils.book_new();
  const newWorksheet = xlsx.utils.json_to_sheet(records);

  // Set string formats to prevent excel math
  const range = xlsx.utils.decode_range(newWorksheet['!ref']);
  for(let R = range.s.r + 1; R <= range.e.r; ++R) {
    for(let C = range.s.c; C <= range.e.c; ++C) {
      const cell_address = xlsx.utils.encode_cell({c:C, r:R});
      const cell = newWorksheet[cell_address];
      if(cell && cell.t === 'n') { // if number, make string to prevent scientific notation on phones
         cell.z = '@'; 
      }
    }
  }

  // Adjust column widths
  newWorksheet['!cols'] = [
    {wch: 8}, {wch: 15}, {wch: 35}, {wch: 15}, {wch: 12}, 
    {wch: 35}, {wch: 30}, {wch: 15}, {wch: 22}, {wch: 50}
  ];

  xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Consolidado Avanzado');
  const outPath = path.join(__dirname, '..', 'Reporte_Cobranza_Definitivo.xlsx');
  xlsx.writeFile(newWorkbook, outPath);

  console.log('Definitive Excel file created at ' + outPath);
}

run();
