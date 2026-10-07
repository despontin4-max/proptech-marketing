'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, LogOut, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Cliente } from '@/core/types/client';
import { ReceiptModal } from '@/components/ReceiptModal';

export default function Dashboard() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: string } | null>(null);

  // Cliente seleccionado para emisión
  const [modalCliente, setModalCliente] = useState<Cliente | null>(null);
  const [selectedPadrónMes, setSelectedPadrónMes] = useState<'OCTUBRE' | 'SEPTIEMBRE'>('OCTUBRE');

  const getAuthHeaders = (): Record<string, string> => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('ah_session_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const fetchClients = async (force = false, mes: 'OCTUBRE' | 'SEPTIEMBRE' = selectedPadrónMes) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const clientsRes = await fetch(`/api/clientes/list?mes=${mes}&${force ? 'refresh=true&' : ''}t=${Date.now()}`, {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const clientsData = await clientsRes.json();

      if (!clientsRes.ok || !clientsData.success) {
        setErrorMsg(clientsData.error || `Error HTTP ${clientsRes.status}`);
        setDebugInfo(JSON.stringify(clientsData, null, 2));
        return;
      }

      setClientes(clientsData.clientes || []);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de red');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSelectPadrón = (mes: 'OCTUBRE' | 'SEPTIEMBRE') => {
    setSelectedPadrónMes(mes);
    fetchClients(false, mes);
  };

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/me', {
          headers: getAuthHeaders(),
          credentials: 'include',
        });
        if (!authRes.ok) { router.push('/login'); return; }
        const authData = await authRes.json();
        if (!authData.authenticated) { router.push('/login'); return; }
        setCurrentUser(authData.user);

        await fetchClients(false);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const qBuscar = params.get('buscar');
          if (qBuscar) {
            setSearchTerm(decodeURIComponent(qBuscar));
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Error de red');
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const norm = (s: any) =>
    String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm.trim()) return true;
    const haystack = [c.name, c.soli, c.cod, c.dni, c.phone].map(norm).join(' ');
    return norm(searchTerm).split(/\s+/).filter(Boolean).every(w => haystack.includes(w));
  });

  const openModal = (c: Cliente) => {
    setModalCliente(c);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">AutoHogar CRM</h1>
          <div className="flex items-center gap-4">
            {currentUser && (
              <span className="text-sm text-slate-500">
                {currentUser.nombre} · <span className="uppercase text-xs font-bold text-orange-600">{currentUser.rol}</span>
              </span>
            )}
            <Link href="/resumen-mes" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              📊 Estado del Mes
            </Link>
            <Link href="/libro-mayor" className="text-sm text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-1">
              📖 Libro Mayor
            </Link>
            <Link href="/historial" className="text-sm text-slate-500 hover:text-slate-900">
              Auditoría
            </Link>
            <button onClick={handleLogout} className="text-red-600 text-sm font-semibold flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          {/* Selector de Padrón Mensual */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-orange-50 via-slate-50 to-amber-50 border border-orange-200 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Padrón Mensual Activo:
                </span>
                <div className="flex flex-wrap gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPadrón('OCTUBRE')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      selectedPadrónMes === 'OCTUBRE'
                        ? 'bg-orange-600 text-white shadow-orange-200 ring-2 ring-orange-600 ring-offset-2'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>📅 Padrón OCTUBRE 2026</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-extrabold ${
                      selectedPadrónMes === 'OCTUBRE' ? 'bg-orange-800 text-white' : 'bg-orange-100 text-orange-800'
                    }`}>
                      Mes en Curso
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPadrón('SEPTIEMBRE')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                      selectedPadrónMes === 'SEPTIEMBRE'
                        ? 'bg-amber-600 text-white shadow-amber-200 ring-2 ring-amber-600 ring-offset-2'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>📅 Padrón SEPTIEMBRE 2026</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-extrabold ${
                      selectedPadrónMes === 'SEPTIEMBRE' ? 'bg-amber-800 text-white' : 'bg-amber-100 text-amber-800'
                    }`}>
                      Mes Anterior Cerrado
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-xs shadow-sm self-start md:self-auto">
                <div className="flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Visualizando</span>
                  <span className="font-extrabold text-slate-800 text-sm">
                    {selectedPadrónMes === 'OCTUBRE' ? 'Octubre 2026' : 'Septiembre 2026'}
                  </span>
                </div>
                <div className="h-7 w-[1px] bg-slate-200" />
                <div className="flex flex-col">
                  <span className="text-slate-400 font-semibold uppercase text-[10px]">Avance del Mes</span>
                  <span className="font-bold text-slate-700">
                    <span className="text-emerald-600 font-black">{clientes.filter(c => c.verificado).length}</span> cobrados ·{' '}
                    <span className="text-amber-600 font-black">{clientes.filter(c => !c.verificado).length}</span> pendientes
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Buscador de Clientes</h2>
              <p className="text-slate-500 text-sm mt-1">
                Busca por Nombre, DNI, N° Solicitud o Teléfono para registrar cobros y emitir recibos del padrón {selectedPadrónMes.toLowerCase()}.
              </p>
            </div>
            <button
              onClick={() => fetchClients(true, selectedPadrónMes)}
              disabled={isRefreshing || isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 self-start sm:self-auto"
              title="Forzar sincronización inmediata con Google Sheets"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
              <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar Planilla'}</span>
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 mb-6 shadow-sm">
            <Search className="w-5 h-5 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Ej: Quinteros, 24735389, 264-5106685..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-slate-700 bg-transparent text-base"
              autoFocus
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-700">✕</button>
            )}
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg text-sm">
              <strong>Error:</strong> {errorMsg}
              {debugInfo && <pre className="mt-2 text-xs text-red-600 overflow-auto">{debugInfo}</pre>}
            </div>
          )}

          {/* Tabla */}
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : (
            <>
              <div className="text-xs text-slate-400 mb-2">
                {clientes.length} clientes cargados en padrón {selectedPadrónMes.toLowerCase()}
                {searchTerm && ` · ${filteredClientes.length} coincidencias`}
              </div>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-xs sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Código</th>
                        <th className="px-4 py-3">Solicitud</th>
                        <th className="px-4 py-3">Cliente</th>
                        <th className="px-4 py-3">DNI</th>
                        <th className="px-4 py-3">Teléfono</th>
                        <th className="px-4 py-3">Cuota / Monto</th>
                        <th className="px-4 py-3 text-center">Estado</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientes.slice(0, 150).map(c => {
                        const verificado = Boolean(c.verificado);
                        return (
                        <tr key={`client-${c.cod}-${c.soli}-${c.dni}`} className="hover:bg-orange-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-700">{c.cod}</td>
                          <td className="px-4 py-2.5 text-slate-600">{c.soli}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{c.name}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.dni}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.phone}</td>
                          <td className="px-4 py-2.5 font-medium text-slate-800">
                            <div>{c.amount ? `$${c.amount}` : '-'}</div>
                            <div className="text-[11px] text-slate-400">Cuota Nº {c.cuotaNum || '1'}</div>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {verificado ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                ✓ Pagado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {c.estado && c.estado.toUpperCase().includes('BAJA') ? (
                              <button
                                onClick={() => openModal(c)}
                                className="bg-red-600 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto shadow-sm"
                                title="Cliente en causal de rescisión. Requiere PIN de Maxi para cobrar."
                              >
                                🚨 BAJA (PIN)
                              </button>
                            ) : (
                              <button
                                onClick={() => openModal(c)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 ml-auto shadow-sm transition-all active:scale-95 ${
                                  verificado
                                    ? 'bg-slate-700 hover:bg-slate-800 text-white'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white ring-1 ring-orange-500'
                                }`}
                                title={verificado ? 'Ver o reemitir comprobante oficial' : 'Cobrar cuota e imprimir recibo oficial'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>{verificado ? 'Ver Recibo' : 'Cobrar / Recibo'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                      {filteredClientes.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                            {searchTerm ? 'No se encontraron resultados.' : 'No hay clientes cargados en este padrón.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {filteredClientes.length > 150 && (
                  <div className="p-2 text-center text-xs text-slate-400 bg-slate-50">
                    Mostrando 150 de {filteredClientes.length}. Filtra por nombre para ver más.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Modal de Emisión Modular y Desacoplado */}
      {modalCliente && (
        <ReceiptModal
          cliente={modalCliente}
          initialPeriodo={selectedPadrónMes}
          padronMes={selectedPadrónMes}
          onClose={() => setModalCliente(null)}
          onSuccess={() => {
            setModalCliente(null);
            fetchClients(true);
          }}
          getAuthHeaders={getAuthHeaders}
        />
      )}
    </div>
  );
}
