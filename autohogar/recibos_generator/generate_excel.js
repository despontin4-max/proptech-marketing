const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 1. Read JSON (Master Base)
const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
let masterData = [];
if (fs.existsSync(jsonPath)) {
  masterData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

// 2. Read Excel (August Payments/Controls)
const excelPath = path.join(__dirname, '..', '07 CLIENTES DE MEDIO ELECT AGOSTO 2026.xlsx');
let excelData = [];
if (fs.existsSync(excelPath)) {
  const workbook = xlsx.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
}

// 3. Extract headers and data rows from Excel
const rows = excelData.slice(2);
const records = [];

for (const row of rows) {
  const cod = row[0];
  const name = row[1];
  if (!cod || !name) continue;

  // Find match in JSON
  const match = masterData.find(m => m.cod == cod && m.name.trim() === name.trim()) || masterData.find(m => m.name.trim() === name.trim()) || {};

  const phone = row[2] || match.phone || '';
  const soli = row[4] || match.soli || '';
  const cuotaActual = row[5] || match.cuotaNum || '';
  const importeCuota = row[6] || match.amount || '';
  
  // Try to determine payment method from Excel flags
  let medioPago = 'NO DEFINIDO';
  const xOficina = row[11];
  const bcoOElect = row[12];
  
  if (xOficina) medioPago = 'OFICINA (EFECTIVO/POSNET)';
  else if (bcoOElect) medioPago = 'MEDIO ELECTRONICO (M.PAGO/BANCO)';

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
    'MEDIO DE PAGO': medioPago,
    'N° CUOTA ACTUAL': cuotaActual,
    'VALOR CUOTA ($)': importeCuota,
    'TOTAL ABONADO APROX ($)': totalAbonado || ''
  });
}

// Add people from JSON that are NOT in Excel
for (const m of masterData) {
    if (!records.find(r => r.COD == m.cod)) {
        let totalAbonado = 0;
        if (m.cuotaNum && m.amount) {
            const c = parseInt(m.cuotaNum);
            const impStr = m.amount.toString().replace(/\./g, '').replace(',', '.');
            const imp = parseFloat(impStr);
            if (!isNaN(c) && !isNaN(imp)) {
                totalAbonado = c * imp;
            }
        }
        records.push({
            'COD': m.cod,
            'CONTRATO (SOLI)': m.soli,
            'CLIENTE': m.name,
            'TELEFONO': m.phone,
            'DNI': m.dni,
            'PLAN': m.plan,
            'MEDIO DE PAGO': 'NO EN EXCEL MENSUAL',
            'N° CUOTA ACTUAL': m.cuotaNum,
            'VALOR CUOTA ($)': m.amount,
            'TOTAL ABONADO APROX ($)': totalAbonado || ''
        });
    }
}

// 4. Create new Excel workbook
const newWorkbook = xlsx.utils.book_new();
const newWorksheet = xlsx.utils.json_to_sheet(records);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(newWorkbook, newWorksheet, 'Consolidado Cobranza');

// Write to XLSX
const outPath = path.join(__dirname, '..', 'Reporte_Cobranza_Consolidado.xlsx');
xlsx.writeFile(newWorkbook, outPath);

console.log('Excel file created at ' + outPath);
