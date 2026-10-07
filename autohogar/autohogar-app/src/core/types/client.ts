export interface Cliente {
  cod: string;
  soli: string;
  name: string;
  dni: string;
  phone: string;
  city: string;
  address: string;
  plan: string;
  cuotaNum: string;
  cuotasPactadas?: string;
  amount: string;
  estado: string;
  verificado: boolean;
  dueDate: string;
  paymentDate: string;
  sheetRowIndex: number;
}
