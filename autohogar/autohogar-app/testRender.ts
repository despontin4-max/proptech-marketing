import { renderToFile } from '@react-pdf/renderer';
import React from 'react';
import { ReciboPDF } from './src/utils/pdfTemplate';
import fs from 'fs';
import path from 'path';

const headerPath = path.join(process.cwd(), '..', 'full_top_header_exact.png');
let headerBase64 = '';
if (fs.existsSync(headerPath)) {
  const imgBuffer = fs.readFileSync(headerPath);
  headerBase64 = `data:image/png;base64,${imgBuffer.toString('base64')}`;
}

const clientData = {
  cod: '823',
  soli: '9375',
  name: 'JOFRE ELIZABETH DEL VALLE',
  dni: '12568214',
  address: 'SALTA 257 B° PRIMITERAS',
  city: 'JACHAL',
  province: 'SAN JUAN',
  plan: 'V. AMERICANA 3 DOR C/COCHERA',
  cuotaNum: '93',
  dueDate: '15/08/26',
  amount: '30.000,00',
  phone: '264-4122541',
  history: '',
  operadorVerificador: 'OPERADOR 1',
  titular_comprobante: 'JOFRE ELIZABETH DEL VALLE'
};

const pdfComponent = React.createElement(ReciboPDF, { clientData, headerBase64 }) as any;
renderToFile(pdfComponent, 'public/recibos/Recibo_823_9375.pdf')
  .then(() => console.log('Successfully generated public/recibos/Recibo_823_9375.pdf'))
  .catch(console.error);
