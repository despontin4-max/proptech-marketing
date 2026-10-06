import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { renderToFile } from '@react-pdf/renderer';
import React from 'react';
import { ReciboPDF } from '@/utils/pdfTemplate';
import { HEADER_IMAGE_BASE64 } from '@/utils/headerAsset';

export async function GET(request: Request) {
  try {
    const outputDir = path.join(process.cwd(), 'public', 'recibos');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const headerBase64 = HEADER_IMAGE_BASE64;

    const clientData = {
      cod: '816',
      soli: '9287',
      name: 'GUEVARA ANTONIO NICOLAS',
      dni: '26863246',
      address: 'LA COLONIA - HUACO',
      city: 'HUACO',
      province: 'SAN JUAN',
      plan: 'V. AMERICANA 3 DOR C/COCHERA',
      cuotaNum: '93',
      dueDate: '15/08/26',
      amount: '40.000,00',
      phone: '264-4837119',
      history: '',
      operadorVerificador: 'OPERADOR 1',
      titular_comprobante: 'GUEVARA ANTONIO NICOLAS'
    };

    const fileName = `Recibo_${clientData.cod}_${clientData.soli}.pdf`;
    const filePath = path.join(outputDir, fileName);

    const pdfComponent = React.createElement(ReciboPDF, { clientData, headerBase64 }) as any;
    await renderToFile(pdfComponent, filePath);

    return NextResponse.json({ success: true, url: `/recibos/${fileName}` });
  } catch (error: any) {
    console.error('Test PDF Gen Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
