const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function renderClientHtml(c, headerBase64) {
  const codPadded = String(c.cod || 0).padStart(6, '0');
  const soliPadded = String(c.soli || 0).padStart(5, '0');
  const amountFormatted = typeof c.amount === 'number'
    ? c.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })
    : (c.amount || '0,00');

  return `
  <div class="page-container">
    <!-- CUERPO 1: SUPERIOR -->
    <div class="cuerpo-1">
      <div class="top-header-banner">
        ${headerBase64 ? `<img src="${headerBase64}" class="full-header-img" alt="Encabezado AutoHogar" />` : '<div style="background:#eb8226;height:100%;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:bold;">AUTOHOGAR</div>'}
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
              <span>${(c.city || '').split(' ')[0] || ''}</span>
              <span>SAN JUAN</span>
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
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="notice-section">
        <p><strong>Señor Cliente: Se informa que los unicos medios de pago habilitados son los siguientes:</strong></p>
        <p>-Deposito o transferencia bancaria.</p>
        <p>-Sucursales habilitadas para el cobro.</p>
        <p>-Pago al cobrador que envia la compañia a su domicilio quien entregara como constancia el comprobante correspondiente</p>
        <p style="color:#fff;">?</p>
        <p style="color:#fff;">?</p>
        <p style="color:#fff;">?</p>
      </div>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">$ ${amountFormatted}</div>
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
              <span>${(c.city || '').split(' ')[0] || ''}</span>
              <span>SAN JUAN</span>
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
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">$ ${amountFormatted}</div>
        </div>
      </div>
    </div>
    <!-- CUERPO 3: INFERIOR -->
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
              <span>${(c.city || '').split(' ')[0] || ''}</span>
              <span>SAN JUAN</span>
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
          <td colspan="2">
            <div class="history-line">${c.history || ''}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${c.phone || ''}</div>
          </td>
        </tr>
      </table>
      <div class="importe-container">
        <div class="importe-box">
          <div class="importe-header">IMPORTE ABONADO</div>
          <div class="importe-val">$ ${amountFormatted}</div>
        </div>
      </div>
    </div>
  </div>
  `;
}

(async () => {
  try {
    const outputDir = path.join(__dirname, 'autohogar-app', 'public', 'recibos');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Cargar imagen del header
    const headerPath = path.join(__dirname, '..', 'full_top_header_exact.png');
    let headerBase64 = '';
    if (fs.existsSync(headerPath)) {
      const imgBuffer = fs.readFileSync(headerPath);
      headerBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
      console.log('✅ Header encontrado y cargado');
    } else {
      console.log('⚠️  Header NO encontrado, se usará fallback naranja');
    }

    // Cargar template HTML
    const templatePath = path.join(__dirname, '..', 'recibos_generator', 'template.html');
    const templateHtml = fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, 'utf8')
      : `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
        @page { size: A4 portrait; margin: 0; } * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 0; padding: 30pt 42.5pt 20pt 42.5pt; color: #000; background: #fff; font-size: 10.5px; width: 595pt; }
        .page-container { width: 510pt; height: 790pt; display: flex; flex-direction: column; justify-content: flex-start; page-break-after: always; }
        .page-container:last-child { page-break-after: avoid; }
        .cuerpo-1, .cuerpo-2 { width: 100%; margin-bottom: 18pt; } .cuerpo-3 { width: 100%; }
        .top-header-banner { width: 100%; height: 110pt; margin-bottom: 2pt; }
        .full-header-img { width: 100%; height: 100%; object-fit: contain; }
        .orange-banner { background-color: #eb8226; color: #fff; font-size: 13.5px; font-weight: bold; padding: 3.5pt 10pt; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 6pt; }
        .soli-box { background-color: #fff; color: #000; border: 1px solid #eb8226; padding: 2px 12px; border-radius: 3px; font-size: 12.5px; font-weight: bold; letter-spacing: 1px; }
        .grid-table { width: 100%; border-collapse: separate; border-spacing: 4pt; margin-bottom: 4pt; }
        .grid-box { border: 1.5px solid #eb8226; border-radius: 5px; padding: 4pt 8pt; background: #fff; vertical-align: top; }
        .box-label { font-size: 8.5px; color: #0099d8; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
        .box-val { font-size: 12.5px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 0.2px; }
        .notice-section { font-size: 8.8px; color: #000; line-height: 1.25; margin-top: 4pt; } .notice-section p { margin: 1px 0; }
        .importe-container { display: flex; justify-content: flex-end; margin-top: 2pt; }
        .importe-box { border: 1.5px solid #eb8226; border-radius: 5px; width: 160pt; text-align: center; overflow: hidden; }
        .importe-header { background: #fff; color: #0099d8; font-size: 8.5px; font-weight: bold; padding: 2px 0; border-bottom: 1.5px solid #eb8226; }
        .importe-val { font-size: 14.5px; font-weight: bold; padding: 3px 0; color: #000; }
        .history-line { font-size: 8.5px; color: #000; font-weight: bold; margin-top: 4pt; }
        </style></head><body>{{BODY_CONTENT}}</body></html>`;

    // Cargar todos los clientes del JSON maestro
    const clients = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'extracted_clients_august_2026.json'), 'utf8'));
    console.log(`📋 Total clientes a procesar: ${clients.length}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    let generados = 0;
    let saltados = 0;

    for (const client of clients) {
      const fileName = `Recibo_${client.cod}_${client.soli}.pdf`;
      const filePath = path.join(outputDir, fileName);

      // Saltar si ya existe
      if (fs.existsSync(filePath)) {
        saltados++;
        continue;
      }

      const singleHtml = templateHtml.replace('{{BODY_CONTENT}}', renderClientHtml(client, headerBase64));
      await page.setContent(singleHtml, { waitUntil: 'domcontentloaded' });
      await page.pdf({
        path: filePath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
      });
      generados++;
      if (generados % 10 === 0) console.log(`✅ Generados: ${generados} | Saltados (ya existían): ${saltados}`);
    }

    await browser.close();
    console.log(`\n🎉 TERMINADO. Generados: ${generados} | Ya existían: ${saltados} | Total: ${clients.length}`);
    console.log(`📁 Carpeta: ${outputDir}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
