export type PeriodoCobro = 'OCTUBRE' | 'SEPTIEMBRE' | 'AMBOS';

export interface RecordToEmit {
  id: string;
  cod: string;
  contrato: string;
  cliente: string;
  dni: string;
  telefono: string;
  direccion: string;
  localidad: string;
  plan: string;
  cuota: string;
  importe: string;
  medio_pago: string;
  titular_comprobante: string;
  dueDate: string;
  paymentDate?: string;
  mes: string;
  sheetRowIndex: number;
}

export interface GeneratedReceiptFile {
  id: string;
  pdfUrl: string;
  waLink: string | null;
}
