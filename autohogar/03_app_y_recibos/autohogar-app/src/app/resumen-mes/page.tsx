'use client';

import React, { useState, useEffect } from 'react';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Clock, 
  Search,
  Calendar,
  Lock,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClienteEstado {
  cod: string;
  soli: string;
  nombre: string;
  plan: string;
  cuotaNum?: string;
  valorCuota: number;
  pagadoMes?: number;
  fechaPago?: string;
  estadoPago: 'PAGADO' | 'PENDIENTE';
}

interface ResumenMes {
  total: number;
  pagados: number;
  pendientes: number;
  totalRecaudado: number | null;
}

export default function ResumenMesPage() {
  const router = useRouter();
  const [selectedMes, setSelectedMes] = useState<'octubre' | 'septiembre'>('octubre');
  const [mesTitulo, setMesTitulo] = useState('Octubre 2026');
  const [resumen, setResumen] = useState<ResumenMes | null>(null);
  const [pagados, setPagados] = useState<ClienteEstado[]>([]);
  const [pendientes, setPendientes] = useState<ClienteEstado[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'pendientes' | 'pagados'>('pendientes');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async (mesKey: 'octubre' | 'septiembre') => {
    setIsLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/resumen-mes?mes=${mesKey}&_t=${Date.now()}`);
      const data = await r.json();
      if (!data.success) { 
        setError(data.error || 'Error al obtener estado del mes'); 
        return; 
      }
      setMesTitulo(data.mes);
      setResumen(data.resumen);
      setPagados(data.pagados || []);
      setPendientes(data.pendientes || []);
      setIsAdmin(Boolean(data.isAdmin));
    } catch (e: any) {
      setError(e.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedMes);
  }, [selectedMes]);

  const fmt = (n: number | null | undefined) => {
    if (n === null || n === undefined) return '0';
    return n.toLocaleString('es-AR');
  };

  // Normalizar búsqueda
  const norm = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const listaActual = tab === 'pendientes' ? pendientes : pagados;
  const listaFiltrada = listaActual.filter(c => {
    if (!searchTerm.trim()) return true;
    const haystack = [c.nombre, c.cod, c.soli, c.plan].map(norm).join(' ');
    const terms = norm(searchTerm).split(/\s+/).filter(Boolean);
    return terms.every(t => haystack.includes(t));
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-sm">
              <ArrowLeft className="w-4 h-4" /> Volver
            </Link>
            <h1 className="text-xl font-bold text-slate-800">Estado del Mes</h1>
            
            {/* Selector de Mes */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setSelectedMes('octubre')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedMes === 'octubre'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Octubre 2026 (En Curso)
              </button>
              <button
                onClick={() => setSelectedMes('septiembre')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                  selectedMes === 'septiembre'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Septiembre 2026 (Histórico)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/libro-mayor" className="text-sm font-semibold text-orange-600 hover:text-orange-700">
              📖 Libro Mayor
            </Link>
            <Link href="/historial" className="text-sm text-slate-500 hover:text-slate-900">
              Auditoría
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-orange-500 mb-3" />
            <p className="text-sm font-medium text-slate-600">Cargando estado de {mesTitulo}...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Total Activos</span>
                </div>
                <p className="text-3xl font-bold text-slate-900">{resumen?.total}</p>
                <p className="text-xs text-slate-400 mt-1">Padrón de {mesTitulo}</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pagaron</span>
                </div>
                <p className="text-3xl font-bold text-emerald-600">{resumen?.pagados}</p>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Comprobantes asentados</p>
              </div>

              <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-semibold text-slate-500 uppercase">Pendientes</span>
                </div>
                <p className="text-3xl font-bold text-amber-600">{resumen?.pendientes}</p>
                <p className="text-xs text-amber-600 mt-1 font-medium">A cobrar en {mesTitulo}</p>
              </div>

              {/* CARD 4: Condicional estricto por Rol */}
              {isAdmin && resumen?.totalRecaudado !== null ? (
                <div className="bg-white rounded-xl p-5 border border-orange-200 shadow-sm bg-gradient-to-br from-orange-50 to-white relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-orange-600" />
                    <span className="text-xs font-bold text-orange-700 uppercase flex items-center gap-1">
                      Recaudado <Lock className="w-3 h-3 text-orange-500" />
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-orange-600">
                    ${fmt(resumen?.totalRecaudado)}
                  </p>
                  <p className="text-[11px] text-orange-600 font-semibold mt-1">
                    Solo visible para Administrador
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-semibold text-slate-500 uppercase">Efectividad</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600">
                    {resumen && resumen.total > 0 ? Math.round((resumen.pagados / resumen.total) * 100) : 0}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Progreso general de cobranzas</p>
                </div>
              )}
            </div>

            {/* Barra de Progreso */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-700">Progreso de Cobranzas - {mesTitulo}</span>
                <span className="text-sm font-bold text-emerald-600">
                  {resumen && resumen.total > 0 ? Math.round((resumen.pagados / resumen.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div
                  className="bg-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${resumen && resumen.total > 0 ? (resumen.pagados / resumen.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {resumen?.pagados} de {resumen?.total} clientes cobraron en este período
              </p>
            </div>

            {/* Tabs y Buscador */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setTab('pendientes')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 sm:flex-none ${
                    tab === 'pendientes' 
                      ? 'bg-amber-500 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pendientes ({pendientes.length})
                </button>
                <button
                  onClick={() => setTab('pagados')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex-1 sm:flex-none ${
                    tab === 'pagados' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pagados ({pagados.length})
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar en esta lista..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
              </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3 text-center">N° Cuota</th>
                      <th className="px-4 py-3 text-right">Valor Cuota</th>
                      {tab === 'pagados' && (
                        <th className="px-4 py-3 text-center">Fecha Pago</th>
                      )}
                      <th className="px-4 py-3 text-center">Estado</th>
                      <th className="px-4 py-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {listaFiltrada.map((c: any) => (
                      <tr key={c.cod + '_' + c.soli} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-600 text-xs font-semibold">{c.cod}</td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 leading-snug">{c.nombre}</p>
                          <p className="text-[11px] text-slate-400">Contrato: {c.soli}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{c.plan || '-'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-block bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">
                            {c.cuotaNum ? `N° ${c.cuotaNum}` : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-800">
                          ${fmt(c.valorCuota)}
                        </td>
                        {tab === 'pagados' && (
                          <td className="px-4 py-3 text-center text-xs text-slate-500 font-medium">
                            {c.fechaPago || 'Registrado'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center">
                          {c.estadoPago === 'PAGADO' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pagado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <AlertCircle className="w-3 h-3 text-amber-600" /> Pendiente
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/?buscar=${encodeURIComponent(c.soli || c.nombre)}`}
                            className="inline-flex items-center gap-0.5 px-2.5 py-1 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-md border border-orange-200 transition-colors"
                          >
                            <span>Ficha</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {listaFiltrada.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                          {searchTerm.trim()
                            ? 'No se encontraron clientes con ese criterio de búsqueda.'
                            : tab === 'pendientes'
                            ? '🎉 Todos los clientes han completado sus pagos en este mes.'
                            : 'Aún no hay pagos registrados para este mes.'}
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
