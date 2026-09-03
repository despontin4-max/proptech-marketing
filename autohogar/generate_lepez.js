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

    const clientLepez = {
      fileName: "Recibo_LEPEZ_RODRIGUEZ_JESICA_KAREN_Contrato_11965_Septiembre_2026.pdf",
      name: "LEPEZ RODRIGUEZ JESICA KAREN",
      dni: "17991006",
      address: "TUCUMAN 2166 V° CENTENARIO",
      city: "CHIMBAS",
      province: "SAN JUAN",
      plan: "V. AMERICANA  3 DOR C/COCHERA",
      cod: "003142",
      soli: "11965",
      phone: "264-4729466",
      amount: "60.000,00",
      cuotaNum: "36",
      dueDate: "15/09/26",
      history: "14/08/26 - 01/07/26 - 01/06/26 - 05/05/26 - 01/04/26 - 03/03/26 -"
    };

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const filePathWeb = path.join(outputDirWeb, clientLepez.fileName);
    const filePathLocal = path.join(outputDirLocal, clientLepez.fileName);

    const singleHtml = templateHtml.replace('{{BODY_CONTENT}}', renderClientHtml(clientLepez, headerBase64));
    await page.setContent(singleHtml, { waitUntil: 'domcontentloaded' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    fs.writeFileSync(filePathWeb, pdfBuffer);
    fs.writeFileSync(filePathLocal, pdfBuffer);
    console.log(`Generado: ${clientLepez.fileName}`);

    await browser.close();
    console.log('\n--- Generación completada con éxito ---');

  } catch (err) {
    console.error('Error generando recibo:', err);
  }
})();
