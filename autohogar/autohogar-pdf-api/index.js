const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '2mb' })); // Límite estricto de payload

// 1. SEGURIDAD: Token Secreto de Autenticación
const API_SECRET_KEY = process.env.API_SECRET_KEY || 'AUTOHOGAR_SECURE_TOKEN_2026_CHANGE_ME';

function authMiddleware(req, res, next) {
  const clientToken = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!clientToken || clientToken !== API_SECRET_KEY) {
    return res.status(401).json({ error: 'Acceso no autorizado: Token inválido o ausente.' });
  }
  next();
}

// 2. SEGURIDAD: Sanitización anti-XSS y anti-Inyección HTML en Puppeteer
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderClientHtml(c, headerBase64) {
  const codPadded = escapeHtml(String(c.cod || 0).padStart(6, '0'));
  const soliPadded = escapeHtml(String(c.soli || 0).padStart(5, '0'));
  
  const rawAmount = typeof c.amount === 'number'
    ? c.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })
    : (c.amount || '0,00');
  const amountFormatted = escapeHtml(rawAmount);

  const safeName = escapeHtml(c.name);
  const safeDni = escapeHtml(c.dni);
  const safeAddress = escapeHtml(c.address);
  const safeCity = escapeHtml((c.city || '').split(' ')[0] || '');
  const safePlan = escapeHtml(c.plan);
  const safeCuotaNum = escapeHtml(c.cuotaNum);
  const safeDueDate = escapeHtml(c.dueDate);
  const safePhone = escapeHtml(c.phone);
  const safeHistory = escapeHtml(c.history);

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
            <div class="box-val">${safeName}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${safeDni}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${safeAddress}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${safeCity}</span>
              <span>SAN JUAN</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${safePlan}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${safeCuotaNum} - ${safeDueDate}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${safePhone}</div>
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
            <div class="box-val">${safeName}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${safeDni}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${safeAddress}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${safeCity}</span>
              <span>SAN JUAN</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${safePlan}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${safeCuotaNum} - ${safeDueDate}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2"></td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${safePhone}</div>
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
            <div class="box-val">${safeName}</div>
          </td>
          <td class="grid-box" style="width: 20%;">
            <div class="box-label">D.N.I.</div>
            <div class="box-val">${safeDni}</div>
          </td>
          <td class="grid-box" rowspan="2" style="width: 25%;">
            <div class="box-label">DIRECCIÓN</div>
            <div class="box-val" style="margin-bottom: 6px;">${safeAddress}</div>
            <div class="box-val" style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>${safeCity}</span>
              <span>SAN JUAN</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="grid-box">
            <div class="box-label">PRODUCTO SOLICITADO</div>
            <div class="box-val">${safePlan}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">ANTICIPO - VENCIMIENTO</div>
            <div class="box-val">${safeCuotaNum} - ${safeDueDate}</div>
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <div class="history-line">${safeHistory}</div>
          </td>
          <td class="grid-box">
            <div class="box-label">TELÉFONO</div>
            <div class="box-val" style="font-size: 11px; line-height: 1.2;">${safePhone}</div>
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

// Cargar imagen de cabecera
const headerPath = path.join(__dirname, 'full_top_header_exact.png');
let headerBase64 = '';
if (fs.existsSync(headerPath)) {
  const imgBuffer = fs.readFileSync(headerPath);
  headerBase64 = 'data:image/png;base64,' + imgBuffer.toString('base64');
}

const templateHtml = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><style>
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

let browser;

app.post('/api/generate', authMiddleware, async (req, res) => {
  let page;
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ error: 'Payload de cliente inválido' });
    }

    if (!browser) {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });
    }
    
    page = await browser.newPage();
    
    // Bloquear llamadas de red salientes no deseadas desde el HTML
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const url = request.url();
      if (url.startsWith('data:') || url.startsWith('about:')) {
        request.continue();
      } else {
        request.abort();
      }
    });

    const singleHtml = templateHtml.replace('{{BODY_CONTENT}}', renderClientHtml(data, headerBase64));
    await page.setContent(singleHtml, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await page.close();

    const safeCod = String(data.cod || '0').replace(/[^0-9]/g, '');
    const safeSoli = String(data.soli || '0').replace(/[^0-9]/g, '');

    res.json({
      success: true,
      pdfBase64: pdfBuffer.toString('base64'),
      filename: `Recibo_${safeCod}_${safeSoli}.pdf`
    });

  } catch (error) {
    if (page) await page.close().catch(() => {});
    console.error('Error generando PDF:', error.message);
    res.status(500).json({ error: 'Error interno generando documento' });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Autohogar Secure PDF API corriendo en el puerto ${PORT}`);
});
