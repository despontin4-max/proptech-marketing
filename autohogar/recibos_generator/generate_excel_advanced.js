const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const pdf = require('pdf-parse');

async function extractMethodsFromPDFs() {
  const directory = path.join(__dirname, '..');
  const methodMap = {};

  // We will map words/names from specific PDFs to the payment method
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
        // Just store the raw text for this method to do a lookup later
        if (!methodMap[source.method]) methodMap[source.method] = "";
        methodMap[source.method] += " " + text;
      } catch(e) {
         console.log("Error reading", source.file);
      }
    }
  }
  
  // Also read CARGA CLIENTES ASESOR COBRANZAS.xlsx
  const cargaExcel = path.join(directory, 'CARGA CLIENTES ASESOR COBRANZAS.xlsx');
  let cargaData = [];
  if (fs.existsSync(cargaExcel)) {
     const wb = xlsx.readFile(cargaExcel);
     cargaData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
  }

  return { methodMap, cargaData };
}

function normalize(name) {
    return name.toUpperCase().replace(/\s+/g, ' ').trim();
}

async function run() {
  const { methodMap, cargaData } = await extractMethodsFromPDFs();

  // Read JSON (Master Base)
  const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
  let masterData = [];
  if (fs.existsSync(jsonPath)) {
    masterData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  }

  // Read Excel (August Payments/Controls)
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

    // Find match in JSON
    const match = masterData.find(m => m.cod == cod && normalize(m.name) === normName) || 
                  masterData.find(m => normalize(m.name) === normName) || {};

    const phone = row[2] || match.phone || '';
    const soli = row[4] || match.soli || '';
    const cuotaActual = row[5] || match.cuotaNum || '';
    const importeCuota = row[6] || match.amount || '';
    
    let medioPago = 'NO DEFINIDO';

    // 1. Check CARGA CLIENTES Excel
    const cargaMatch = cargaData.find(r => r[1] == cod || (r[2] && normalize(r[2]) === normName));
    if (cargaMatch && cargaMatch[5]) {
       medioPago = cargaMatch[5].toString().toUpperCase();
    } 
    // 2. Check PDFs Text Lookup
    else {
        // Split name into words to find in PDF (very basic fuzzy search)
        // Or just search the whole name if it's there
        let found = false;
        for (const [method, text] of Object.entries(methodMap)) {
            // Check if parts of the name appear in the text (like "CASTRO FLORES DAN IELA" has spaces added by PDF)
            // We just remove spaces from both to compare
            const textNoSpaces = text.replace(/\s+/g, '');
            const nameNoSpaces = normName.replace(/\s+/g, '');
            
            if (textNoSpaces.includes(nameNoSpaces)) {
                medioPago = method;
                found = true;
                break;
            }
        }
        
        // 3. Fallback to columns in Excel
        if (!found) {
            const xOficina = row[11];
            const bcoOElect = row[12];
            if (xOficina) medioPago = 'OFICINA (EFECTIVO/POSNET)';
            else if (bcoOElect) medioPago = 'MEDIO ELECTRONICO (GENERICO)';
        }
    }

    // Calculate approximate total paid
    let totalAbonado = 0;
    if (cuotaActual && importeCuota) {
        const c = parseInt(cuotaActual);
        const impStr = importeCuota.toString().replace(/\./g, '').replace(',', '.');
        const imp = parseFloat(impStr);
        if (!isNaN(c) && !isNaN(imp)) {
            totalAbonado = c * imp;
        }
    }

    records.push({
      'COD': cod,
      'CONTRATO (SOLI)': soli,
      'CLIENTE': name,
      'TELEFONO': phone,
      'DNI': match.dni || 'FALTA',
      'PLAN': match.plan || 'FALTA',
      'MEDIO DE PAGO EXACTO': medioPago,
      'N° CUOTA ACTUAL': cuotaActual,
      'VALOR CUOTA ($)': importeCuota,
      'TOTAL ABONADO APROX ($)': totalAbonado || ''
    });
  }

  // Create new Excel workbook
  const newWorkbook = xlsx.utils.book_new();
  const newWorksheet = xlsx.utils.json_to_sheet(records);

  // Add worksheet to workbook
  xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Consolidado Avanzado');

  // Write to XLSX
  const outPath = path.join(__dirname, '..', 'Reporte_Cobranza_Consolidado_V2.xlsx');
  xlsx.writeFile(newWorkbook, outPath);

  console.log('Advanced Excel file created at ' + outPath);
}

run();
