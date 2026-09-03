const fs = require('fs');
const path = require('path');
const puppeteer = require('c:\\Users\\USER\\Desktop\\PROPTECH MARKETING\\autohogar\\recibos_generator\\node_modules\\puppeteer');

function renderClientHtml(c, headerBase64) {
  const codPadded = String(c.cod || 0).padStart(6, '0');
  const soliPadded = String(c.soli || 0).padStart(5, '0');

  return `
  <div class="page-container">
    <!-- CUERPO 1: SUPERIOR -->
    <div class="cuerpo-1">
      <div class="top-header-banner">
        ${headerBase64 ? '<img src="' + headerBase64 + '" class="full-header-img" alt="Encabezado AutoHogar" />' : '<div style="background:#eb8226;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;">AUTOHOGAR</div>'}
      </div>
      <div class="orange-banner">
        <span>AVISO VENCIMIENTO DE ANTICIPO</span>
        <span>Nº &nbsp; <span class="soli-box">${soliPadded}</span></span>
      </div>
      <table class="grid-table">
        <tr>
          <td class="grid-box" style="width: 55%;">
            <div class="box-label">NOMBRE Y APELLIDO &nbsp;&nbsp; ( ${codPadded} ) / 001</div>
            <div class="box-val">${c.name || ''}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${c.dni || ''}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${c.address || ''}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${c.city || ''}</span>
              <span>${c.province || 'SAN JUAN'}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${c.plan || ''}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${c.cuotaNum || ''} - ${c.dueDate || ''}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="notice-section">
        <p><strong>Señor Cliente: Se informa que los unicos medios de pago habilitados son los siguientes:</strong></p>
        <p>-Deposito o transferencia bancaria.</p>
        <p>-Sucursales habilitadas para el cobro.</p>
        <p>-Pago al cobrador que envia la compañia a su domicilio quien entregara como constancia el comprobante correspondiente</p>
      </div>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">${c.amount || '0,00'}</div>
        </div>
      </div>
    </div>
    <!-- CUERPO 2: MEDIO -->
    <div class="cuerpo-2">
      <div class="orange-banner">
        <span>AVISO VENCIMIENTO DE ANTICIPO</span>
        <span>Nº &nbsp; <span class="soli-box">${soliPadded}</span></span>
      </div>
      <table class="grid-table">
        <tr>
          <td class="grid-box" style="width: 55%;">
            <div class="box-label">NOMBRE Y APELLIDO</div>
            <div class="box-val">${c.name || ''}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${c.dni || ''}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${c.address || ''}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${c.city || ''}</span>
              <span>${c.province || 'SAN JUAN'}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${c.plan || ''}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${c.cuotaNum || ''} - ${c.dueDate || ''}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">${c.amount || '0,00'}</div>
        </div>
      </div>
    </div>
    <!-- CUERPO 3: INFERIOR (Con código correlativo de pagos anteriores) -->
    <div class="cuerpo-3">
      <div class="orange-banner">
        <span>AVISO VENCIMIENTO DE ANTICIPO</span>
        <span>Nº &nbsp; <span class="soli-box">${soliPadded}</span></span>
      </div>
      <table class="grid-table">
        <tr>
          <td class="grid-box" style="width: 55%;">
            <div class="box-label">NOMBRE Y APELLIDO &nbsp;&nbsp; ( ${codPadded} )</div>
            <div class="box-val">${c.name || ''}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${c.dni || ''}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${c.address || ''}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${c.city || ''}</span>
              <span>${c.province || 'SAN JUAN'}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${c.plan || ''}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${c.cuotaNum || ''} - ${c.dueDate || ''}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2" style="vertical-align: middle; padding: 3pt 6pt;">
            <div style="font-family: 'Courier New', Courier, monospace, Arial; font-size: 9.5px; font-weight: bold; color: #000; letter-spacing: 0.6px; line-height: 1.2;">
              ${c.history || ''}
            </div>
          </td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">${c.amount || '0,00'}</div>
        </div>
      </div>
    </div>
  </div>
  `;
}

(async () => {
  try {
    const outputDirWeb = path.join(__dirname, 'autohogar-app', 'public', 'recibos', 'septiembre_2026');
    const outputDirLocal = path.join(__dirname, 'recibos_septiembre_2026');
    
    if (!fs.existsSync(outputDirWeb)) fs.mkdirSync(outputDirWeb, { recursive: true });
    if (!fs.existsSync(outputDirLocal)) fs.mkdirSync(outputDirLocal, { recursive: true });

    const headerPath = path.join(__dirname, 'full_top_header_exact.png');
    let headerBase64 = '';
    if (fs.existsSync(headerPath)) {
      const imgBuffer = fs.readFileSync(headerPath);
      headerBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
    }

    const templatePath = path.join(__dirname, 'recibos_generator', 'template.html');
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const clientsBatch2 = [
      {
        fileName: "Recibo_GARAY_MARCELO_Contrato_08984_Septiembre_2026.pdf",
        name: "GARAY MARCELO",
        dni: "17218034",
        address: "AV. 25 DE MAYO OESTE 1403 B° INTA",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "001186",
        soli: "08984",
        phone: "264-5269535 / 264-4223879",
        amount: "80.000,00",
        cuotaNum: "84",
        dueDate: "15/09/26",
        history: "08/08/26 - 08/07/26 - 16/06/26 - 14/05/26 - 06/04/26 - 03/03/26 -"
      },
      {
        fileName: "Recibo_GARAY_MARCELO_ROBERTO_Contrato_08539_Septiembre_2026.pdf",
        name: "GARAY MARCELO ROBERTO",
        dni: "17218034",
        address: "AVENIDA 25 DE MAYO OESTE 1403 B° IN",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "001417",
        soli: "08539",
        phone: "264-5269535 / 264-4222871",
        amount: "80.000,00",
        cuotaNum: "78",
        dueDate: "15/09/26",
        history: "08/08/26 - 08/07/26 - 16/06/26 - 14/05/26 - 06/04/26 - 03/03/26 -"
      },
      {
        fileName: "Recibo_MOLINA_AGUERO_AYELEN_Contrato_11981_Septiembre_2026.pdf",
        name: "MOLINA AGÜERO AYELEN VICTORIA",
        dni: "41909835",
        address: "B° HUARPE MZN C CASA 7 FRIAS Y CALL",
        city: "POCITOS",
        province: "SAN JUAN",
        plan: "V. AMERICANA  3 DOR C/COCHERA",
        cod: "003184",
        soli: "11981",
        phone: "2645439804",
        amount: "30.000,00",
        cuotaNum: "35",
        dueDate: "15/09/26",
        history: "01/08/26 - 01/07/26 - 30/05/26 - 17/04/26 - 04/03/26 - 14/02/26 -"
      },
      {
        fileName: "Recibo_PEREZ_JOSE_ISMAEL_Contrato_10192_Septiembre_2026.pdf",
        name: "PEREZ JOSE ISMAEL",
        dni: "23735278",
        address: "CIPOLLETI NORTE 1012 CASA 3 B° ANGU",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  3 DOR C/COCHERA",
        cod: "001999",
        soli: "10192",
        phone: "264-5122570 / 264-5122586",
        amount: "60.000,00",
        cuotaNum: "67",
        dueDate: "15/09/26",
        history: "10/08/26 - 10/07/26 - 04/06/26 - 12/05/26 - 08/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_FARIAS_JORGE_LUIS_Contrato_20073_Septiembre_2026.pdf",
        name: "FARIAS JORGE LUIS",
        dni: "16997546",
        address: "ESMERALDA ESTE 1241 B° BUENOS AIRES",
        city: "CHIMBAS",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003250",
        soli: "20073",
        phone: "264-4817232",
        amount: "100.000,00",
        cuotaNum: "32",
        dueDate: "15/09/26",
        history: "03/08/26 - 02/07/26 - 01/06/26 - 01/05/26 - 01/04/26 - 06/03/26 -"
      },
      {
        fileName: "Recibo_CHAMORRO_PEREA_MARTIN_Contrato_11899_Septiembre_2026.pdf",
        name: "CHAMORRO PEREA MARTIN ALFREDO",
        dni: "38076458",
        address: "LOTEO DIAZ LOTE 28 DPTO 5",
        city: "CHIMBAS",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "002998",
        soli: "11899",
        phone: "264-4647030 / 264-4433724",
        amount: "65.000,00",
        cuotaNum: "39",
        dueDate: "15/09/26",
        history: "10/08/26 - 10/07/26 - 04/06/26 - 11/05/26 - 10/04/26 - 09/03/26 -"
      },
      {
        fileName: "Recibo_BARCO_YASMIN_ZAHIRA_Contrato_20198_Septiembre_2026.pdf",
        name: "BARCO YASMIN ZAHIRA",
        dni: "35509339",
        address: "PROLONGACION SARMIENTO NORTE 2115",
        city: "CHIMBAS",
        province: "SAN JUAN",
        plan: "V. AMERICANA  3 DOR C/COCHERA",
        cod: "003380",
        soli: "20198",
        phone: "264-5824228 / 264-6280535",
        amount: "50.000,00",
        cuotaNum: "27",
        dueDate: "15/09/26",
        history: "31/08/26 - 31/07/26 - 30/06/26 - 30/05/26 - 30/04/26 - 31/03/26 -"
      },
      {
        fileName: "Recibo_GONZALEZ_GUTIERREZ_RODRIGO_Contrato_20062_Septiembre_2026.pdf",
        name: "GONZALEZ GUTIERREZ RODRIGO",
        dni: "38078580",
        address: "B° VIRGEN DE FATIMA MZN J CASA 7",
        city: "RAWSON",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003226",
        soli: "20062",
        phone: "264-4818920",
        amount: "200.000,00",
        cuotaNum: "33",
        dueDate: "15/09/26",
        history: "31/08/26 - 31/07/26 - 04/06/26 - 27/05/26 - 22/04/26 - 31/03/26 -"
      }
    ];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    for (const c of clientsBatch2) {
      const filePathWeb = path.join(outputDirWeb, c.fileName);
      const filePathLocal = path.join(outputDirLocal, c.fileName);

      const singleHtml = templateHtml.replace('{{BODY_CONTENT}}', renderClientHtml(c, headerBase64));
      await page.setContent(singleHtml, { waitUntil: 'domcontentloaded' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });

      fs.writeFileSync(filePathWeb, pdfBuffer);
      fs.writeFileSync(filePathLocal, pdfBuffer);
      console.log(`Generado Lote 2: ${c.fileName}`);
    }

    await browser.close();
    console.log('\n--- Generación Lote 2 completada con éxito ---');

  } catch (err) {
    console.error('Error generando recibos de lote 2:', err);
  }
})();
