/**
 * AUTOHOGAR - BACKEND LEAD INGESTION & SECURITY API
 * Ruta: /api/lead
 * 
 * Mejoras de Ingeniería Senior:
 * 1. Prevención de Fugas de Memoria (Bounded Rate Limiter con recolección periódica).
 * 2. Protección contra ataques de denegación de servicio por payload gigante (Stream Guard 32KB).
 * 3. I/O completamente no bloqueante (fs.promises asíncrono).
 * 4. Blindaje contra inyección de fórmulas CSV (Excel/Sheets formula injection).
 * 5. Sanitización robusta y cabeceras HTTP de seguridad.
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Configuración Centralizada
const CONFIG = {
  RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minuto
  MAX_REQUESTS_PER_WINDOW: 5,
  MAX_BODY_BYTES: 32 * 1024, // 32 KB máximo
  MAX_MAP_ENTRIES: 10000, // Límite máximo de IPs en memoria
  CSV_FILENAME: 'Base_Leads_Web.csv',
  TURNSTILE_SECRET_KEY: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || '1x0000000000000000000000000000000AA',
  TURNSTILE_HOST: 'challenges.cloudflare.com',
  TURNSTILE_PATH: '/turnstile/v0/siteverify'
};

// Rate limiter en memoria con limpieza automática de basura (GC)
const rateLimitStore = new Map();
let lastPruneTime = Date.now();

function checkRateLimit(ip) {
  const now = Date.now();

  // Mantenimiento proactivo: podar registros expirados cada 2 minutos
  if (now - lastPruneTime > 2 * 60 * 1000 || rateLimitStore.size > CONFIG.MAX_MAP_ENTRIES) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (now - value.firstRequestTime > CONFIG.RATE_LIMIT_WINDOW_MS) {
        rateLimitStore.delete(key);
      }
    }
    lastPruneTime = now;
  }

  const record = rateLimitStore.get(ip) || { count: 0, firstRequestTime: now };

  if (now - record.firstRequestTime < CONFIG.RATE_LIMIT_WINDOW_MS) {
    if (record.count >= CONFIG.MAX_REQUESTS_PER_WINDOW) {
      return false; // Bloqueado
    }
    record.count++;
  } else {
    record.count = 1;
    record.firstRequestTime = now;
  }

  rateLimitStore.set(ip, record);
  return true;
}

// Sanitización contra XSS y Neutralización de CSV Formula Injection
function sanitizeInput(str, maxLength = 120) {
  if (typeof str !== 'string') return '';
  let sanitized = str.replace(/[<>'"/\\;{}[\]]/g, '').trim().slice(0, maxLength);
  
  // Si comienza con operadores que Excel/Sheets interpretan como fórmula, anteponer comilla simple
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`;
  }
  return sanitized;
}

// Validación estricta de Turnstile con Cloudflare (Previene bypass por ausencia de token)
async function verifyTurnstileToken(token, ip) {
  // En desarrollo local sin clave secreta configurada, permitir bypass para pruebas
  if (process.env.NODE_ENV === 'development' && !process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY) {
    return { success: true };
  }

  // En producción o con clave configurada, el token es estrictamente obligatorio
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, error: 'Token anti-bot faltante o inválido.' };
  }

  return new Promise((resolve) => {
    const postData = new URLSearchParams({
      secret: CONFIG.TURNSTILE_SECRET_KEY,
      response: token,
      remoteip: ip
    }).toString();

    const options = {
      hostname: CONFIG.TURNSTILE_HOST,
      port: 443,
      path: CONFIG.TURNSTILE_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: Boolean(parsed.success), error: parsed['error-codes'] });
        } catch {
          resolve({ success: false, error: 'JSON parse error en validación anti-bot' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ success: false, error: 'Timeout al validar token con Cloudflare' });
    });
    req.write(postData);
    req.end();
  });
}

// Persistencia de alta resiliencia: Webhook externo prioritario + fallback seguro a disco
async function persistLead(leadData) {
  const { timestamp, name, phone, interest, ip } = leadData;

  // 1. Despacho a Webhook externo (n8n, Zapier, Make, CRM, Google Sheets) si está configurado
  const webhookUrl = process.env.LEAD_WEBHOOK_URL || process.env.WEBHOOK_URL;
  if (webhookUrl) {
    try {
      const urlObj = new URL(webhookUrl);
      const postBody = JSON.stringify(leadData);
      await new Promise((resolve, reject) => {
        const isHttps = urlObj.protocol === 'https:';
        const client = isHttps ? https : require('http');
        const req = client.request(urlObj, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postBody)
          }
        }, (res) => {
          res.resume();
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(4000, () => { req.destroy(); resolve(); });
        req.write(postBody);
        req.end();
      });
    } catch (e) {
      console.warn('[AutoHogar API] Alerta: No se pudo enviar el lead al webhook externo:', e.message);
    }
  }

  // 2. Persistencia en CSV (Usa /tmp en Vercel Serverless para evitar error EROFS)
  try {
    const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
    const targetDir = isServerless ? '/tmp' : path.join(__dirname, '..');
    const csvPath = path.join(targetDir, CONFIG.CSV_FILENAME);
    const line = `"${timestamp}","${name}","${phone}","${interest}","${ip}"\n`;

    try {
      await fs.access(csvPath);
      await fs.appendFile(csvPath, line, 'utf8');
    } catch {
      // Si no existe, crear con cabecera
      const header = '"Fecha","Nombre","Telefono","Interes","IP"\n';
      await fs.writeFile(csvPath, header + line, 'utf8');
    }
  } catch (fsErr) {
    // Si el filesystem es de solo lectura (EROFS), registrar en consola sin interrumpir la respuesta
    console.warn('[AutoHogar API] Filesystem de solo lectura detectado. Lead registrado en memoria/logs:', { name, phone, interest });
  }
}

// Helper para responder con JSON y headers de seguridad
function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://autohogar.com.ar',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Handler Principal (Compatible con Node.js HTTP Server y Vercel Serverless Functions)
module.exports = async function handler(req, res) {
  // Manejo de Preflight CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || 'https://autohogar.com.ar',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .toString().split(',')[0].trim();

  // 1. Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    return sendResponse(res, 429, {
      error: 'Demasiadas solicitudes. Por favor, intentá nuevamente en un minuto.'
    });
  }

  // 2. Stream Ingestion con Guardia de Tamaño (Anti-DOS)
  let body = '';
  let size = 0;

  req.on('data', chunk => {
    size += chunk.length;
    if (size > CONFIG.MAX_BODY_BYTES) {
      req.destroy();
      return sendResponse(res, 413, { error: 'Payload too large.' });
    }
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');

      // 2.1 Trampa Honeypot para Bots (Campos señuelo ocultos para humanos)
      if (payload._hp || payload.website || payload.company_fax) {
        // Respuesta exitosa simulada para engañar y frenar bots automatizados
        return sendResponse(res, 200, {
          success: true,
          message: 'Consulta recibida y procesada correctamente.'
        });
      }

      const name = sanitizeInput(payload.name, 100);
      const phone = sanitizeInput(payload.phone, 40);
      const interest = sanitizeInput(payload.interest || 'Vivienda Modular', 100);
      const turnstileToken = payload.turnstileToken;

      // Validación de obligatoriedad y longitud mínima
      if (!name || name.length < 2 || !phone || phone.length < 6) {
        return sendResponse(res, 400, {
          error: 'Nombre y teléfono válidos son obligatorios.'
        });
      }

      // 3. Verificación Anti-Bot (Cloudflare Turnstile)
      const turnstileRes = await verifyTurnstileToken(turnstileToken, clientIp);
      if (!turnstileRes.success) {
        return sendResponse(res, 403, {
          error: 'Fallo de verificación de seguridad anti-bot.'
        });
      }

      // 4. Persistencia Resiliente (Webhook prioritario + almacenamiento seguro)
      const timestamp = new Date().toISOString();
      await persistLead({ timestamp, name, phone, interest, ip: clientIp });

      return sendResponse(res, 200, {
        success: true,
        message: 'Consulta recibida y procesada correctamente.'
      });
    } catch (err) {
      return sendResponse(res, 500, {
        error: 'Error interno al procesar la solicitud.'
      });
    }
  });

  req.on('error', () => {
    sendResponse(res, 400, { error: 'Error en la transmisión de datos.' });
  });
};
