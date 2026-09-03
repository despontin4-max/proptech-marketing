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
    const outputDirWeb = path.join(__dirname, 'autohogar-app', 'public', 'recibos', 'septiembre_2026', '03_Tercer_Lote_Recientes');
    const outputDirLocal = path.join(__dirname, 'recibos_septiembre_2026', '03_Tercer_Lote_Recientes');
    
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

    const clientsBatch3 = [
      {
        fileName: "Recibo_TEJEDA_GUILLERMO_ALEJO_Contrato_20266_Septiembre_2026.pdf",
        name: "TEJEDA GUILLERMO ALEJO",
        dni: "24693256",
        address: "GENERAL DORREGO ESTE 481 CONCEPCION",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003173",
        soli: "20266",
        phone: "2645700245 / 264-4274784",
        amount: "90.000,00",
        cuotaNum: "35",
        dueDate: "15/09/26",
        history: "07/08/26 - 07/07/26 - 02/06/26 - 06/05/26 - 07/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_MARTINEZ_ROMINA_ELIANA_Contrato_20331_Septiembre_2026.pdf",
        name: "MARTINEZ ROMINA ELIANA",
        dni: "28631354",
        address: "PROYECTADA 235 B° CAUQUENES 4 SAN J",
        city: "JACHAL",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003478",
        soli: "20331",
        phone: "264-5068875",
        amount: "120.000,00",
        cuotaNum: "18",
        dueDate: "15/09/26",
        history: "02/08/26 - 02/07/26 - 02/06/26 - 30/05/26 - 07/04/26 - 04/03/26 -"
      },
      {
        fileName: "Recibo_JIMENEZ_HERNAN_Contrato_20336_Agosto_2026.pdf",
        name: "JIMENEZ HERNAN",
        dni: "33630212",
        address: "PAMPA OESTE 2046 B° JARDIN FERROVIA",
        city: "CHIMBAS",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003457",
        soli: "20336",
        phone: "264-5430399 / 264-4135785",
        amount: "80.000,00",
        cuotaNum: "22",
        dueDate: "15/08/26",
        history: "31/07/26 - 30/06/26 - 30/05/26 - 30/04/26 - 31/03/26 - 28/02/26 -"
      }
    ];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    for (const c of clientsBatch3) {
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
      console.log(`Generado Lote 3: ${c.fileName}`);
    }

    await browser.close();
    console.log('\n--- Generación Lote 3 completada con éxito ---');

  } catch (err) {
    console.error('Error generando recibos de lote 3:', err);
  }
})();
