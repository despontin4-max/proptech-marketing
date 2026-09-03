import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { ReciboPDF } from '@/utils/pdfTemplate';
import { getMasterClients, normalizeName, appendAuditLog } from '@/utils/googleSheets';
import { HEADER_IMAGE_BASE64 } from '@/utils/headerAsset';
import { cookies } from 'next/headers';
import { verifySession } from '@/utils/session';
import { checkRateLimit } from '@/lib/rateLimit';

function getOutputDir(): string {
  const localPublic = path.join(process.cwd(), 'public', 'recibos');
  try {
    if (!fs.existsSync(/*turbopackIgnore: true*/ localPublic)) {
      fs.mkdirSync(localPublic, { recursive: true });
    }
    const testFile = path.join(localPublic, '.write_test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    return localPublic;
  } catch {
    const tmpRecibos = path.join(os.tmpdir(), 'recibos');
    if (!fs.existsSync(/*turbopackIgnore: true*/ tmpRecibos)) {
      fs.mkdirSync(tmpRecibos, { recursive: true });
    }
    return tmpRecibos;
  }
}

export async function POST(request: Request) {
  try {
    // ── Autenticación ──────────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get('ah_session')?.value;
    const session = verifySession(token || '');
    if (!session) {
      return NextResponse.json({ error: 'Sesión requerida' }, { status: 401 });
    }

    // ── Rate Limiting (10 generaciones/min por IP) ────────────────────────────
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const rl = checkRateLimit(ip, { key: 'generate', maxRequests: 10, windowMs: 60_000 });
    if (rl.limited) {
      return NextResponse.json(
        { error: 'Demasiadas generaciones simultáneas. Espera un momento.' },
        { status: 429 }
      );
    }

    const operadorVerificador = session.nombre || 'Operador';

    const { records } = await request.json();

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No records provided' }, { status: 400 });
    }

    const outputDir = getOutputDir();

    // 1. Load Master Database from Google Sheets
    const masterData = await getMasterClients();

    // 2. Header image base64
    const headerBase64 = HEADER_IMAGE_BASE64;

    const host = request.headers.get('host') || 'localhost:3000';
    // For WhatsApp to render links properly, they must explicitly use http/https.
    // In many modern deployments (Vercel, etc), x-forwarded-proto is https.
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const generatedFiles = [];

    for (const record of records) {
      // Get full client data from master data using cod or name
      const masterClient = masterData.find(m => String(m.cod) === String(record.cod)) ||
                           masterData.find(m => normalizeName(m.name) === normalizeName(record.cliente)) || ({} as any);

      // Helper: limpiar número de teléfono (xlsx puede convertir a float: "351234567.0")
      const cleanPhone = (val: any): string => {
        if (!val) return '';
        return String(val).replace(/\.0+$/, '').trim();
      };

      const excelPhone = cleanPhone(record.telefono);
      const masterPhone = cleanPhone(masterClient.phone);

      const clientData = {
        cod: record.cod || masterClient.cod || '0',
        soli: record.contrato || record.solicitud || record.soli || masterClient.soli || '0',
        name: record.cliente || record.name || masterClient.name || '',
        dni: record.dni || masterClient.dni || '',
        address: record.address || record.direccion || masterClient.address || '',
        city: record.city || record.localidad || masterClient.city || '',
        province: record.province || record.provincia || masterClient.province || 'SAN JUAN',
        plan: record.plan || masterClient.plan || '',
        cuotaNum: record.cuota || record.cuotaNum || masterClient.cuotaNum || '0',
        dueDate: record.dueDate || masterClient.dueDate || '',
        amount: record.importe || record.amount || masterClient.amount || '0,00',
        phone: excelPhone || masterPhone,
        history: record.history || masterClient.history || '',
        operadorVerificador,
        titular_comprobante: String(record.titular_comprobante || '').trim(),
      };

      const fileName = `Recibo_${clientData.cod}_${String(clientData.soli).replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      const filePath = path.join(/*turbopackIgnore: true*/ outputDir, fileName);

      // Render PDF using @react-pdf/renderer renderToStream
      try {
        const pdfComponent = React.createElement(ReciboPDF, { clientData, headerBase64 }) as any;
        const stream = await renderToStream(pdfComponent);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
        }
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, buffer);
      } catch (err) {
        console.warn(`Could not write PDF to ${filePath}:`, err);
      }

      // WhatsApp Link with direct public PDF URL
      const pdfPublicUrl = `${baseUrl}/recibos/${fileName}`;
      const allPhones = String(clientData.phone || '').split('/').map(p => p.trim()).filter(Boolean);
      let waLink = null;
      if (allPhones.length > 0) {
        const rawPhone = allPhones[0].replace(/[^0-9]/g, '');
        let phone = rawPhone;
        // Si el número tiene 10 dígitos y empieza con 15, asumimos código de San Juan 264
        if (rawPhone.length === 10 && rawPhone.startsWith('15')) {
          phone = `264${rawPhone.slice(2)}`;
        }
        
        if (phone.length >= 8) {
          const formattedAmount = String(clientData.amount).startsWith('$') ? clientData.amount : `$ ${clientData.amount}`;
          // Espaciado adicional alrededor de la URL para evitar que WhatsApp no la reconozca como enlace
          const messageText = `Hola ${clientData.name}, te enviamos el comprobante de pago de tu cuota N° ${clientData.cuotaNum} por el monto de ${formattedAmount}.\n\n📄 Descargar recibo PDF:\n ${pdfPublicUrl} \n\n¡Gracias por confiar en AutoHogar!`;
          const message = encodeURIComponent(messageText);
          waLink = `https://wa.me/549${phone}?text=${message}`;
        }
      }

      generatedFiles.push({ id: record.id, pdfUrl: `/recibos/${fileName}`, waLink });
    }

    // ── Audit Log (fire-and-forget) ────────────────────────────────────────
    const fechaStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    appendAuditLog({
      fecha: fechaStr,
      usuario: operadorVerificador,
      accion: 'Generación de recibos PDF',
      detalle: `${records.length} recibo(s) generado(s)`,
    }).catch(() => {}); // no bloquear la respuesta

    return NextResponse.json({ success: true, files: generatedFiles });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
