'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClienteEstado {
  cod: string;
  soli: string;
  nombre: string;
  plan: string;
  valorCuota: number;
  pagadoMes: number;
  estadoPago: 'PAGADO' | 'PENDIENTE';
}

interface ResumenMes {
  total: number;
  pagados: number;
  pendientes: number;
  totalRecaudado: number;
}

export default function ResumenMesPage() {
  const router = useRouter();
  const [mes, setMes] = useState('');
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [pagados, setPagados] = useState<ClienteEstado[]>([]);
  const [pendientes, setPendientes] = useState<ClienteEstado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pendientes' | 'pagados'>('pendientes');

  useEffect(() => {
    async function load() {
      try {
        const r = await fetch('/api/resumen-mes');
        const data = await r.json();
        if (!data.success) { setError(data.error || 'Error'); return; }
        setMes(data.mes);
        setResumen(data.resumen);
        setPagados(data.pagados);
        setPendientes(data.pendientes);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const fmt = (n: number) => n.toLocaleString('es-AR');

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-4">
          <Link href="/" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Estado del Mes</h1>
          {mes && <span className="text-sm text-slate-500 capitalize">{mes}</span>}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl">{error}</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Activos</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{resumen?.total}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pagaron</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{resumen?.pagados}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pendientes</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{resumen?.pendientes}</p>
              </div>
              <div className="bg-white rounded-xl p-5 border border-orange-100 shadow-sm bg-gradient-to-br from-orange-50 to-white">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Recaudado</span>
                </div>
                <p className="text-2xl font-bold text-orange-600">${fmt(resumen?.totalRecaudado || 0)}</p>
              </div>
            </div>

            {/* Barra de progreso */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Progreso del mes</span>
                <span className="text-sm font-bold text-emerald-600">
                  {resumen ? Math.round((resumen.pagados / resumen.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${resumen ? (resumen.pagados / resumen.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">{resumen?.pagados} de {resumen?.total} clientes cobraron este mes</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setTab('pendientes')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'pendientes' ? 'bg-amber-500 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                Pendientes ({pendientes.length})
              </button>
              <button
                onClick={() => setTab('pagados')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'pagados' ? 'bg-emerald-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                Pagados ({pagados.length})
              </button>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Código</th>
                      <th className="px-4 py-3 text-left">Cliente</th>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-right">Cuota</th>
                      {tab === 'pagados' && <th className="px-4 py-3 text-right">Pagado</th>}
                      <th className="px-4 py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(tab === 'pendientes' ? pendientes : pagados).map((c: any) => (
                      <tr key={c.cod + c.soli} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs">{c.cod}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{c.nombre}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{c.plan}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-700">${fmt(c.valorCuota)}</td>
                        {tab === 'pagados' && (
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">${fmt(c.pagadoMes)}</td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {c.estadoPago === 'PAGADO' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-full">
                              <AlertCircle className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(tab === 'pendientes' ? pendientes : pagados).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                          {tab === 'pendientes' ? '🎉 Todos los clientes pagaron este mes.' : 'Aún no hay pagos registrados.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
