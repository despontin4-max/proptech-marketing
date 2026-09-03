const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const jsonPath = path.join(__dirname, '..', 'extracted_clients_august_2026.json');
const fullTopHeaderPath = path.join(__dirname, '..', 'full_top_header_exact.png');
const templatePath = path.join(__dirname, 'template.html');

const outputDir = path.join(__dirname, 'output');
const outputIndivDir = path.join(outputDir, 'individuales');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(outputIndivDir)) fs.mkdirSync(outputIndivDir, { recursive: true });

function getBase64Image(filePath, mimeType) {
    if (!fs.existsSync(filePath)) return '';
    const fileData = fs.readFileSync(filePath);
    return `data:${mimeType};base64,${fileData.toString('base64')}`;
}

async function runGenerator() {
    console.log("Iniciando generador de recibos AutoHogar (Replicación Indistinguible con Header Completo)...");
    const clients = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const templateHtml = fs.readFileSync(templatePath, 'utf8');

    const fullHeaderBase64 = getBase64Image(fullTopHeaderPath, 'image/png');

    console.log(`Cargados ${clients.length} clientes.`);

    const phone = "54 2643171848";

    function renderClientHtml(c) {
        const codPadded = String(c.cod || 0).padStart(6, '0');
        const soliPadded = String(c.soli || 0).padStart(5, '0');

        return `
        <div class="page-container">
          <!-- CUERPO 1: SUPERIOR (Con Encabezado Completo Indistinguible) -->
          <div class="cuerpo-1">
            <div class="top-header-banner">
              <img src="${fullHeaderBase64}" class="full-header-img" alt="Encabezado AutoHogar" />
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
                  <div class="box-val" style="font-size: 11px;">${phone}</div>
                </td>
              </tr>
            </table>

            <div class="notice-section">
              <p><strong>Señor Cliente: Se informa que los unicos medios de pago habilitados son los siguientes:</strong></p>
              <p>-Deposito o transferencia bancaria.</p>
              <p>-Sucursales habilitadas para el cobro.</p>
              <p>-Pago al cobrador que envia la compañia a su domicilio quien entregara como constancia el comprobante correspondiente</p>
              <p style="color:#fff;">.</p>
              <p style="color:#fff;">.</p>
              <p style="color:#fff;">.</p>
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
                  <div class="box-val" style="font-size: 11px;">${phone}</div>
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
                  <div class="box-val" style="font-size: 11px;">${phone}</div>
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

    const allHtmlBlocks = clients.map(renderClientHtml).join('\n');
    const fullHtml = templateHtml.replace('{{BODY_CONTENT}}', allHtmlBlocks);

    console.log("Abriendo Puppeteer...");
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    console.log("Generando PDF Consolidado de Calidad Indistinguible...");
    await page.setContent(fullHtml, { waitUntil: 'domcontentloaded' });
    const mainPdfPath = path.join(outputDir, 'recibos_agosto_2026_todos.pdf');
    await page.pdf({
        path: mainPdfPath,
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });
    console.log(`✅ PDF Consolidado guardado en: ${mainPdfPath}`);

    console.log("Generando muestra de PDFs individuales...");
    for (let i = 0; i < Math.min(10, clients.length); i++) {
        const c = clients[i];
        const singleHtml = templateHtml.replace('{{BODY_CONTENT}}', renderClientHtml(c));
        await page.setContent(singleHtml, { waitUntil: 'domcontentloaded' });
        const cleanName = (c.name || 'CLIENTE').replace(/[^a-zA-Z0-9]/g, '_');
        const indivPdfPath = path.join(outputIndivDir, `recibo_${c.cod}_${cleanName}.pdf`);
        await page.pdf({
            path: indivPdfPath,
            format: 'A4',
            printBackground: true
        });
    }
    console.log(`✅ Muestra de 10 PDFs individuales generada en: ${outputIndivDir}`);

    await browser.close();
    console.log("\nGeneración finalizada con éxito.");
}

runGenerator().catch(err => console.error("Error en ejecución:", err));
