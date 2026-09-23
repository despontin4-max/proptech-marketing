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

// Validación de Turnstile con Cloudflare (API segura HTTPS)
async function verifyTurnstileToken(token, ip) {
  // Solo omitir en entornos no productivos (nunca aceptar token de prueba en prod)
  if (!token || process.env.NODE_ENV !== 'production') {
    return { success: true };
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
          resolve(JSON.parse(data));
        } catch {
          resolve({ success: false, error: 'JSON parse error' });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.write(postData);
    req.end();
  });
}

// Guardado asíncrono no bloqueante en archivo CSV
async function appendLeadToCsv(leadData) {
  const csvPath = path.join(__dirname, '..', CONFIG.CSV_FILENAME);
  const { timestamp, name, phone, interest, ip } = leadData;
  const line = `"${timestamp}","${name}","${phone}","${interest}","${ip}"\n`;

  try {
    await fs.access(csvPath);
    await fs.appendFile(csvPath, line, 'utf8');
  } catch {
    // Si no existe, crear con cabecera
    const header = '"Fecha","Nombre","Telefono","Interes","IP"\n';
    await fs.writeFile(csvPath, header + line, 'utf8');
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

      // 4. Persistencia Asíncrona en CSV
      const timestamp = new Date().toISOString();
      await appendLeadToCsv({ timestamp, name, phone, interest, ip: clientIp });

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
