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

    // Clientes con los 5-6 pagos anteriores correlativos exactos
    const clientsSeptember = [
      {
        fileName: "Recibo_LUNA_OSVALDO_MARIO_Contrato_11439_Septiembre_2026.pdf",
        name: "LUNA OSVALDO MARIO",
        dni: "26547851",
        address: "Bº MANANTIAL EDIFICIO 16 SECTOR 3 M",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "002555",
        soli: "11439",
        phone: "264-8838887 / 264-5606930",
        amount: "60.000,00",
        cuotaNum: "55",
        dueDate: "15/09/26",
        history: "03/08/26 - 03/07/26 - 02/06/26 - 05/05/26 - 01/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_CEPEDA_MANUEL_ALFREDO_CASA_Contrato_09959_Septiembre_2026.pdf",
        name: "CEPEDA MANUEL ALFREDO",
        dni: "24735389",
        address: "JUAN JOSE BUSTOS Y PASO DE LOS ANDE",
        city: "CAUCETE",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "001884",
        soli: "09959",
        phone: "2644444188 / 264-6240776",
        amount: "100.000,00",
        cuotaNum: "70",
        dueDate: "15/09/26",
        history: "03/08/26 - 03/07/26 - 02/06/26 - 04/05/26 - 07/04/26 - 06/03/26 -"
      },
      {
        fileName: "Recibo_CEPEDA_MANUEL_ALFREDO_TOYOTA_Contrato_01602_Septiembre_2026.pdf",
        name: "CEPEDA MANUEL ALFREDO",
        dni: "24735389",
        address: "B° GUAYAMA MZN A CASA 2",
        city: "CAUCETE",
        province: "SAN JUAN",
        plan: "TOYOTA HILUX",
        cod: "003541",
        soli: "01602",
        phone: "264-4444188",
        amount: "200.000,00",
        cuotaNum: "6",
        dueDate: "15/09/26",
        history: "03/08/26 - 03/07/26 - 02/06/26 - 04/05/26 - 07/04/26 -"
      },
      {
        fileName: "Recibo_MONTIEL_MARIANELA_BELEN_Contrato_11910_Septiembre_2026.pdf",
        name: "MONTIEL MARIANELA BELEN",
        dni: "39319464",
        address: "SAN LUIS 2383 1-4",
        city: "SAN MIGUEL",
        province: "BUENOS AIRES",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003275",
        soli: "11910",
        phone: "3704-585371 / 264-4427854",
        amount: "200.000,00",
        cuotaNum: "31",
        dueDate: "15/09/26",
        history: "31/08/26 - 31/07/26 - 30/06/26 - 29/05/26 - 30/04/26 - 31/03/26 -"
      },
      {
        fileName: "Recibo_MONTOYA_RIVERO_ANALIA_Contrato_11848_Septiembre_2026.pdf",
        name: "MONTOYA RIVERO ANALIA DEL VALLE",
        dni: "26054268",
        address: "EL ROSEDAL N° 47 B° LA FLORIDA",
        city: "LA RIOJA CAPITAL",
        province: "LA RIOJA",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003254",
        soli: "11848",
        phone: "3804-407658",
        amount: "80.000,00",
        cuotaNum: "32",
        dueDate: "15/09/26",
        history: "03/08/26 - 01/07/26 - 01/06/26 - 04/05/26 - 01/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_CORREA_ROBERTO_ESTEBAN_Contrato_20309_Septiembre_2026.pdf",
        name: "CORREA ROBERTO ESTEBAN",
        dni: "29426688",
        address: "B° PALMERAS II LOTE 15 NECOCHEA NOR",
        city: "SANTA LUCIA",
        province: "SAN JUAN",
        plan: "V. AMERICANA  3 DOR C/COCHERA",
        cod: "003463",
        soli: "20309",
        phone: "264-5701362 / 264-4701037",
        amount: "200.000,00",
        cuotaNum: "22",
        dueDate: "15/09/26",
        history: "03/08/26 - 02/07/26 - 01/06/26 - 05/05/26 - 02/04/26 - 03/03/26 -"
      },
      {
        fileName: "Recibo_MOTEDIT_ALICIA_DEL_CARMEN_Contrato_10754_Septiembre_2026.pdf",
        name: "MOTEDIT ALICIA DEL CARMEN",
        dni: "22262368",
        address: "AV. FACUNDO QUIROGA S/N",
        city: "AIMOGASTA",
        province: "LA RIOJA",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "002200",
        soli: "10754",
        phone: "3804-390393",
        amount: "250.000,00",
        cuotaNum: "63",
        dueDate: "15/09/26",
        history: "03/08/26 - 02/07/26 - 02/06/26 - 06/05/26 - 01/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_MONTANA_MARIA_CECILIA_Contrato_09664_Septiembre_2026.pdf",
        name: "MONTAÑA MARIA CECILIA",
        dni: "35510351",
        address: "RIOBAMBA ESTE 167 B°GRAL ACHA",
        city: "RAWSON",
        province: "SAN JUAN",
        plan: "V. AMERICANA  2 DOR C/COCHERA",
        cod: "003533",
        soli: "09664",
        phone: "264-5585988",
        amount: "200.000,00",
        cuotaNum: "7",
        dueDate: "15/09/26",
        history: "31/08/26 - 31/07/26 - 30/06/26 - 30/05/26 - 30/04/26 - 02/03/26 -"
      },
      {
        fileName: "Recibo_BARROS_ZULEMA_ENRIQUETA_Contrato_20152_Septiembre_2026.pdf",
        name: "BARROS ZULEMA ENRIQUETA",
        dni: "14210395",
        address: "MITRE S/N E/ GUEMES Y CACEROS",
        city: "SAN JUAN",
        province: "SAN JUAN",
        plan: "V. AMERICANA  3 DOR C/COCHERA",
        cod: "003336",
        soli: "20152",
        phone: "264-4501994 / 264-6613126",
        amount: "150.000,00",
        cuotaNum: "29",
        dueDate: "15/09/26",
        history: "10/08/26 - 13/07/26 - 02/06/26 - 04/05/26 - 06/04/26 - 05/03/26 -"
      }
    ];

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    for (const c of clientsSeptember) {
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
      console.log(`Generado con código de historial: ${c.fileName}`);
    }

    await browser.close();
    console.log('\n--- Finalizado con éxito ---');

  } catch (err) {
    console.error('Error generando recibos:', err);
  }
})();
