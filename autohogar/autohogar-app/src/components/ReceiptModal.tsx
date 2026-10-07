'use client';

import React, { useState } from 'react';
import { Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Cliente } from '@/core/types/client';
import { PeriodoCobro, RecordToEmit } from '@/core/types/receipt';
import { formatCurrency, parseNumericAmount } from '@/core/formatters/formatters';

interface ReceiptModalProps {
  cliente: Cliente;
  initialPeriodo?: PeriodoCobro;
  padronMes?: 'OCTUBRE' | 'SEPTIEMBRE';
  onClose: () => void;
  onSuccess: () => void;
  getAuthHeaders: () => Record<string, string>;
}

export function ReceiptModal({
  cliente,
  initialPeriodo = 'OCTUBRE',
  padronMes,
  onClose,
  onSuccess,
  getAuthHeaders,
}: ReceiptModalProps) {
  const [modoPeriodo, setModoPeriodo] = useState<PeriodoCobro>(initialPeriodo);
  const [medioPago, setMedioPago] = useState('EFECTIVO');
  const [titular, setTitular] = useState(cliente.name || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedFiles, setGeneratedFiles] = useState<Array<{ id: string; pdfUrl: string; waLink?: string | null }>>([]);

  // Identificar el padrón de origen para calcular las cuotas con precisión matemática:
  // Si proviene del padrón de Septiembre, cliente.cuotaNum es la cuota de Septiembre (ej: 70) y Octubre es +1 (71).
  // Si proviene del padrón de Octubre, cliente.cuotaNum es la cuota de Octubre (ej: 71) y Septiembre es -1 (70).
  const esPadronSeptiembre = padronMes === 'SEPTIEMBRE' || initialPeriodo === 'SEPTIEMBRE';
  const baseNum = parseInt(cliente.cuotaNum || '1', 10);
  const baseCuota = isNaN(baseNum) || baseNum < 1 ? 1 : baseNum;

  const cuotaSep = esPadronSeptiembre ? String(baseCuota) : String(Math.max(1, baseCuota - 1));
  const cuotaOct = esPadronSeptiembre ? String(baseCuota + 1) : String(baseCuota);

  const valorUnitario = parseNumericAmount(cliente.amount);
  const montoTotal = modoPeriodo === 'AMBOS' ? valorUnitario * 2 : valorUnitario;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsGenerating(true);

    try {
      let recordsToEmit: RecordToEmit[] = [];

      if (modoPeriodo === 'AMBOS') {
        recordsToEmit = [
          {
            id: crypto.randomUUID(),
            cod: cliente.cod,
            contrato: cliente.soli,
            cliente: cliente.name,
            dni: cliente.dni,
            telefono: cliente.phone,
            direccion: cliente.address,
            localidad: cliente.city,
            plan: cliente.plan,
            cuota: cuotaSep,
            importe: String(valorUnitario),
            medio_pago: medioPago,
            titular_comprobante: titular,
            dueDate: '15/09/26',
            paymentDate: cliente.paymentDate,
            mes: 'septiembre de 2026',
            sheetRowIndex: cliente.sheetRowIndex,
          },
          {
            id: crypto.randomUUID(),
            cod: cliente.cod,
            contrato: cliente.soli,
            cliente: cliente.name,
            dni: cliente.dni,
            telefono: cliente.phone,
            direccion: cliente.address,
            localidad: cliente.city,
            plan: cliente.plan,
            cuota: cuotaOct,
            importe: String(valorUnitario),
            medio_pago: medioPago,
            titular_comprobante: titular,
            dueDate: '15/10/26',
            paymentDate: cliente.paymentDate,
            mes: 'octubre de 2026',
            sheetRowIndex: cliente.sheetRowIndex,
          },
        ];
      } else {
        const isSep = modoPeriodo === 'SEPTIEMBRE';
        recordsToEmit = [
          {
            id: crypto.randomUUID(),
            cod: cliente.cod,
            contrato: cliente.soli,
            cliente: cliente.name,
            dni: cliente.dni,
            telefono: cliente.phone,
            direccion: cliente.address,
            localidad: cliente.city,
            plan: cliente.plan,
            cuota: isSep ? cuotaSep : cuotaOct,
            importe: String(valorUnitario),
            medio_pago: medioPago,
            titular_comprobante: titular,
            dueDate: isSep ? '15/09/26' : '15/10/26',
            paymentDate: cliente.paymentDate,
            mes: isSep ? 'septiembre de 2026' : 'octubre de 2026',
            sheetRowIndex: cliente.sheetRowIndex,
          },
        ];
      }

      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ records: recordsToEmit }),
      });

      const data = await res.json();
      if (data.success && data.files?.length > 0) {
        setGeneratedFiles(data.files);
        try {
          if (data.files[0]?.pdfUrl) {
            window.open(data.files[0].pdfUrl, '_blank');
          }
        } catch {
          // Si el bloqueador de popups interceptó la apertura, el usuario tiene la interfaz de descarga en el modal
        }
      } else {
        setErrorMsg(data.error || 'No se pudo generar el comprobante.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (generatedFiles.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-100 text-center">
          <button
            onClick={onSuccess}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-1">¡Recibo Emitido con Éxito!</h3>
          <p className="text-sm text-slate-600 mb-4">
            <span className="font-semibold text-slate-800">{cliente.name}</span>
            <br />
            <span className="text-xs text-slate-500">
              Medio de pago: <strong className="text-slate-700">{medioPago}</strong> · Total: <strong className="text-emerald-600">{formatCurrency(montoTotal)}</strong>
            </span>
          </p>

          <div className="space-y-2.5 mb-5 text-left">
            {generatedFiles.map((f, i) => (
              <div key={f.id || i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>Comprobante Oficial #{i + 1}</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">Generado</span>
                </div>
                <div className="flex gap-2">
                  <a
                    href={f.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>📄 Abrir Recibo PDF</span>
                  </a>
                  {f.waLink && (
                    <a
                      href={f.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span>💬 WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onSuccess}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm shadow-md transition-colors"
          >
            Finalizar y Volver al Listado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative border border-slate-100">
        <button
          onClick={onClose}
          disabled={isGenerating}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 mb-1">Emitir Recibo Oficial</h3>
        <p className="text-sm text-slate-500 mb-5">
          <span className="font-semibold text-slate-800">{cliente.name}</span>
          {' · '}
          <span className="text-slate-600">{cliente.plan}</span>
        </p>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de Período */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Período y Cuota a Cobrar
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setModoPeriodo('OCTUBRE')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  modoPeriodo === 'OCTUBRE'
                    ? 'bg-orange-600 text-white border-orange-600 shadow-md ring-2 ring-orange-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>Octubre 2026</div>
                <div className="text-[10px] opacity-80 mt-0.5">Cuota {cuotaOct}</div>
              </button>

              <button
                type="button"
                onClick={() => setModoPeriodo('SEPTIEMBRE')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  modoPeriodo === 'SEPTIEMBRE'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>Septiembre 2026</div>
                <div className="text-[10px] opacity-80 mt-0.5">Cuota {cuotaSep}</div>
              </button>

              <button
                type="button"
                onClick={() => setModoPeriodo('AMBOS')}
                className={`p-3 rounded-xl border text-xs font-bold text-center transition-all ${
                  modoPeriodo === 'AMBOS'
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div>Ambos Meses</div>
                <div className="text-[10px] opacity-80 mt-0.5">Sep + Oct (2 Recibos)</div>
              </button>
            </div>
          </div>

          {/* Importe Total */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500 uppercase">
              {modoPeriodo === 'AMBOS' ? 'Importe Total (2 Cuotas Consecutivas)' : 'Importe de la Cuota'}
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {formatCurrency(montoTotal)}
            </div>
            {modoPeriodo === 'AMBOS' && (
              <p className="text-[11px] text-slate-500 mt-1">
                Generará 2 recibos oficiales consecutivos ({cuotaSep} y {cuotaOct}) con sus debidas fechas de vencimiento.
              </p>
            )}
          </div>

          {/* Medio de Pago */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Medio de Pago Real Utilizado
            </label>
            <select
              value={medioPago}
              onChange={e => setMedioPago(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="EFECTIVO">💵 Efectivo en Oficina (100% neto)</option>
              <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
              <option value="MERCADOPAGO">📱 Mercado Pago</option>
              <option value="COBRADOR">🛵 Cobrador a Domicilio</option>
            </select>
            {medioPago === 'MERCADOPAGO' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 mt-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-900 leading-snug">
                  <span className="font-bold">Aviso Mercado Pago:</span> Recuerda verificar la acreditación en la cuenta o app de Mercado Pago antes de entregar el comprobante.
                </div>
              </div>
            )}
          </div>

          {/* Titular del Comprobante */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Titular del Comprobante / Quién Abonó
            </label>
            <input
              type="text"
              value={titular}
              onChange={e => setTitular(e.target.value)}
              placeholder="Nombre de quien realizó el pago"
              className="w-full border border-slate-300 rounded-xl p-2.5 text-sm bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Si pagó un familiar o tercero, anota su nombre aquí.
            </p>
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="flex-1 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar y Emitir</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
