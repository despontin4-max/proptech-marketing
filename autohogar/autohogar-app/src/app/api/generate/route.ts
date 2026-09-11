import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { ReciboPDF } from '@/utils/pdfTemplate';
import { getMasterClients, normalizeName, appendAuditLog, appendPagoCuentaCorriente } from '@/utils/googleSheets';
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
    
    // Performance Fix: Crear mapas O(1) en vez de hacer .find() O(N) en un bucle
    const masterMapByCod = new Map(masterData.map(m => [String(m.cod), m]));
    const masterMapByName = new Map(masterData.map(m => [normalizeName(m.name), m]));

    // 2. Header image base64
    const headerBase64 = HEADER_IMAGE_BASE64;

    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const generatedFiles = [];
    const pagosToInsert = [];
    const rowIndicesToMark: number[] = [];

    for (const record of records) {
      const masterClient = masterMapByCod.get(String(record.cod)) || 
                           masterMapByName.get(normalizeName(record.cliente)) || ({} as any);

      // Helper: limpiar número de teléfono
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
        cuotaNum: record.cuota || record.cuotaNum || masterClient.cuotaNum || '1',
        dueDate: record.dueDate || masterClient.dueDate || '',
        amount: record.importe || record.amount || masterClient.amount || '0,00',
        phone: excelPhone || masterPhone,
        history: record.history || masterClient.history || '',
        operadorVerificador,
        titular_comprobante: String(record.titular_comprobante || '').trim(),
      };

      const safeNombre = String(clientData.name || 'Cliente').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9 ]/g, '').trim().replace(/\s+/g, '_');
      const mesActual = new Date().toLocaleString('es-AR', { month: 'long' });
      const mesCap = mesActual.charAt(0).toUpperCase() + mesActual.slice(1);
      // Formato: Recibo_COD_SOLI_Nombre_Mes.pdf
      // El servidor usa COD y SOLI para regenerar el PDF si el archivo no está en disco.
      const fileName = `Recibo_${clientData.cod}_${String(clientData.soli)}_${safeNombre}_${mesCap}.pdf`;
      const filePath = path.join(/*turbopackIgnore: true*/ outputDir, fileName);

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

      const pdfPublicUrl = `${baseUrl}/recibos/${fileName}`;
      const allPhones = String(clientData.phone || '').split('/').map(p => p.trim()).filter(Boolean);
      let waLink = null;
      if (allPhones.length > 0) {
        const rawPhone = allPhones[0].replace(/[^0-9]/g, '');
        let phone = rawPhone;
        if (rawPhone.length === 10 && rawPhone.startsWith('15')) {
          phone = `264${rawPhone.slice(2)}`;
        }
        
        if (phone.length >= 8) {
          const formattedAmount = String(clientData.amount).startsWith('$') ? clientData.amount : `$ ${clientData.amount}`;
          const messageText = `Hola ${clientData.name}, te enviamos el comprobante de pago de tu cuota N° ${clientData.cuotaNum} por el monto de ${formattedAmount}.\n\n📄 Descargar recibo PDF:\n ${pdfPublicUrl} \n\n¡Gracias por confiar en AutoHogar!`;
          const message = encodeURIComponent(messageText);
          waLink = `https://wa.me/549${phone}?text=${message}`;
        }
      }

      generatedFiles.push({ id: record.id, pdfUrl: `/recibos/${fileName}?t=${Date.now()}`, waLink });

      const today = new Date();
      // Si el cliente indicó una fecha de pago en la columna P, úsala; si no, la fecha actual.
      const fechaPagoStr = record.paymentDate || masterClient.paymentDate || today.toLocaleDateString('es-AR');
      const cuotaNumeroStr = String(clientData.cuotaNum || '1');
      const mesConcepto = today.toLocaleString('es-AR', { month: 'long', year: 'numeric' });
      
      pagosToInsert.push({
        fecha_vencimiento: clientData.dueDate || fechaPagoStr,
        fecha_pago: fechaPagoStr,
        cod_cuenta: clientData.cod,
        cliente_nombre: clientData.name,
        concepto: `Cuota N° ${cuotaNumeroStr} - ${mesConcepto}`,
        medio_pago: 'Efectivo',
        verificacion_admin: '✅',
        debe: String(clientData.amount),
        haber: String(clientData.amount),
        nro_anticipo: cuotaNumeroStr,
        operador: operadorVerificador
      });

      // Recolectar fila para marcar como emitido
      const targetRow = record.sheetRowIndex || masterClient.sheetRowIndex;
      if (targetRow) {
        rowIndicesToMark.push(targetRow);
      }
    }

    // Insertar todos los pagos en 1 sola llamada (Evita cuellos de botella y silent failures)
    const { appendPagosBatch, markReceiptsAsEmitted } = require('@/utils/googleSheets');
    await appendPagosBatch(pagosToInsert);
    
    // Marcar los recibos como emitidos en 1_CLIENTES
    await markReceiptsAsEmitted(rowIndicesToMark, operadorVerificador).catch(e => console.error('Error marking receipts:', e));

    // ── Audit Log (fire-and-forget) ────────────────────────────────────────
    const fechaStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    await appendAuditLog({
      fecha: fechaStr,
      usuario: operadorVerificador,
      accion: 'Generación de recibos PDF',
      detalle: `${records.length} recibo(s) generado(s)`,
    }).catch(e => console.error('Error in audit log:', e));

    return NextResponse.json({ success: true, files: generatedFiles });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
