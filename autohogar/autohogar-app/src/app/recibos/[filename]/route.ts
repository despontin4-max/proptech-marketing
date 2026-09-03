import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { ReciboPDF } from '@/utils/pdfTemplate';
import { getMasterClients } from '@/utils/googleSheets';
import { HEADER_IMAGE_BASE64 } from '@/utils/headerAsset';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    if (!filename || !filename.endsWith('.pdf')) {
      return new NextResponse('Archivo no válido', { status: 400 });
    }

    // 1. Buscar en disco (public/recibos o os.tmpdir()/recibos)
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'recibos', filename),
      path.join(os.tmpdir(), 'recibos', filename),
      path.join('/tmp', 'recibos', filename),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(/*turbopackIgnore: true*/ p)) {
        const fileBuffer = fs.readFileSync(/*turbopackIgnore: true*/ p);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'public, max-age=86400, s-maxage=86400',
          },
        });
      }
    }

    // 2. Si no está en disco (ej. cold start de Vercel), generarlo en vivo a partir del nombre del archivo
    // Formato estándar: Recibo_COD_SOLICITUD.pdf
    const match = filename.match(/^Recibo_([^_]+)_([^_.]+)\.pdf$/i);
    const searchCod = match ? match[1] : '';
    const searchSoli = match ? match[2] : '';

    const masterData = await getMasterClients();
    const client = masterData.find(
      m =>
        (searchCod && String(m.cod) === searchCod) ||
        (searchSoli && String(m.soli) === searchSoli)
    );

    if (!client) {
      return new NextResponse('Recibo no encontrado en la base de datos', { status: 404 });
    }

    const clientData = {
      cod: client.cod || '0',
      soli: client.soli || '0',
      name: client.name || '',
      dni: client.dni || '',
      address: client.address || '',
      city: client.city || '',
      province: client.province || 'SAN JUAN',
      plan: client.plan || '',
      cuotaNum: client.cuotaNum || '0',
      dueDate: client.dueDate || '',
      amount: client.amount || '0,00',
      phone: client.phone || '',
      history: client.history || '',
      operadorVerificador: 'AutoHogar Oficial',
      titular_comprobante: '',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfComponent = React.createElement(ReciboPDF, {
      clientData,
      headerBase64: HEADER_IMAGE_BASE64,
    }) as any;

    const stream = await renderToStream(pdfComponent);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Intentar guardar en /tmp para responder más rápido la próxima vez
    try {
      const tmpRecibos = path.join(os.tmpdir(), 'recibos');
      if (!fs.existsSync(/*turbopackIgnore: true*/ tmpRecibos)) {
        fs.mkdirSync(tmpRecibos, { recursive: true });
      }
      fs.writeFileSync(path.join(tmpRecibos, filename), pdfBuffer);
    } catch {}

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    console.error('Error sirviendo PDF:', error);
    return new NextResponse('Error generando PDF: ' + (error.message || ''), { status: 500 });
  }
}
