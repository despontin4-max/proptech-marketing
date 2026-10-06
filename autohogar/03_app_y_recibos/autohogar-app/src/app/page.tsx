'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, LogOut, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Cliente {
  cod: string;
  soli: string;
  name: string;
  dni: string;
  phone: string;
  city: string;
  address: string;
  plan: string;
  cuotaNum: string;
  cuotasPactadas: string;
  amount: string;
  estado: string;
  verificado: boolean;
  dueDate: string;
  paymentDate: string;
  sheetRowIndex: number;
}

interface EstadoFinanciero {
  proximaCuota: number;
  cuotasPagadas: number;
  totalPagado: number;
  deudaTotal: number | null;
  ultimoPago: string | null;
  historial: { fecha: string; haber: number; cuota: string }[];
  cuotaExigible?: number;
  cuotasAdeudadas?: number;
  cuotasFaltantes?: number[];
  cuotaMasAntigua?: number;
  detalleCuotasImpagas?: string;
  esBajaAutomatica?: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: string } | null>(null);

  // Estado del modal de emisión de recibo
  const [modalCliente, setModalCliente] = useState<Cliente | null>(null);
  const [modalMonto, setModalMonto] = useState('');
  const [modalMedio, setModalMedio] = useState('EFECTIVO');
  const [modalTitular, setModalTitular] = useState('');
  const [adminPin, setAdminPin] = useState('');
  const [cuotaAImputar, setCuotaAImputar] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [estadoFin, setEstadoFin] = useState<EstadoFinanciero | null>(null);
  const [isLoadingEstado, setIsLoadingEstado] = useState(false);
  const [modoPeriodo, setModoPeriodo] = useState<'OCTUBRE' | 'SEPTIEMBRE' | 'AMBOS'>('OCTUBRE');
  const [selectedPadrónMes, setSelectedPadrónMes] = useState<'OCTUBRE' | 'SEPTIEMBRE'>('OCTUBRE');

  const fetchClients = async (force = false, mes: 'OCTUBRE' | 'SEPTIEMBRE' = selectedPadrónMes) => {
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    try {
      const clientsRes = await fetch(`/api/clientes/list?mes=${mes}&${force ? 'refresh=true&' : ''}t=${Date.now()}`);
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
        const authRes = await fetch('/api/auth/me');
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

  const openModal = async (c: Cliente) => {
    setModalCliente(c);
    const rawAmount = String(c.amount || '0').replace(/\./g, '').replace(',', '.');
    const numAmount = parseFloat(rawAmount) || 0;
    setModalMonto(String(numAmount));
    setModalMedio('EFECTIVO');
    setModalTitular(c.name || '');
    setAdminPin('');
    setCuotaAImputar(c.cuotaNum || '1');
    setModoPeriodo(selectedPadrónMes);
    setEstadoFin(null);
    // Cargar el estado financiero en background
    setIsLoadingEstado(true);
    try {
      const params = new URLSearchParams({
        cod: c.cod,
        cuotasPactadas: c.cuotasPactadas || '0',
        valorCuota: c.amount || '0',
        cuotaActual: c.cuotaNum || '1',
      });
      const r = await fetch(`/api/clientes/estado?${params}`);
      const data = await r.json();
      if (data.success) {
        setEstadoFin(data);
        if (data.cuotaMasAntigua) {
          setCuotaAImputar(String(data.cuotaMasAntigua));
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar estado financiero:', e);
    } finally {
      setIsLoadingEstado(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!modalCliente) return;

    if (estadoFin?.esBajaAutomatica && adminPin !== '2026') {
      alert('🚨 ACCESO DENEGADO: El cliente se encuentra en BAJA AUTOMÁTICA. Se requiere PIN de autorización válido de Maximiliano para cobrar.');
      return;
    }

    const esMercadoPago = modalMedio.toLowerCase().includes('mercado') || modalMedio.toLowerCase().includes('mp');
    if (esMercadoPago) {
      const ok = confirm(
        `⚠️ ALERTA: Los pagos por MercadoPago deben ser verificados en cuenta antes de emitir el recibo.\n\n¿Confirmas que ya verificaste el ingreso del pago?`
      );
      if (!ok) return;
    }

    setIsGenerating(true);
    try {
      const cuotaOct = modalCliente.cuotaNum || '1';
      const cuotaSep = String(Math.max(1, parseInt(cuotaOct) - 1));
      const rawUnit = String(modalCliente.amount || '0').replace(/\./g, '').replace(',', '.');
      const unitAmount = parseFloat(rawUnit) || 0;

      let recordsToEmit: any[] = [];

      if (modoPeriodo === 'AMBOS') {
        recordsToEmit = [
          {
            id: crypto.randomUUID(),
            cod: modalCliente.cod,
            contrato: modalCliente.soli,
            cliente: modalCliente.name,
            dni: modalCliente.dni,
            telefono: modalCliente.phone,
            direccion: modalCliente.address,
            localidad: modalCliente.city,
            plan: modalCliente.plan,
            cuota: cuotaSep,
            importe: String(unitAmount),
            medio_pago: modalMedio,
            titular_comprobante: modalTitular,
            esBajaAutomatica: Boolean(estadoFin?.esBajaAutomatica),
            adminPin: adminPin,
            dueDate: '15/09/26',
            paymentDate: modalCliente.paymentDate,
            mes: 'septiembre de 2026',
            sheetRowIndex: modalCliente.sheetRowIndex,
          },
          {
            id: crypto.randomUUID(),
            cod: modalCliente.cod,
            contrato: modalCliente.soli,
            cliente: modalCliente.name,
            dni: modalCliente.dni,
            telefono: modalCliente.phone,
            direccion: modalCliente.address,
            localidad: modalCliente.city,
            plan: modalCliente.plan,
            cuota: cuotaOct,
            importe: String(unitAmount),
            medio_pago: modalMedio,
            titular_comprobante: modalTitular,
            esBajaAutomatica: Boolean(estadoFin?.esBajaAutomatica),
            adminPin: adminPin,
            dueDate: '15/10/26',
            paymentDate: modalCliente.paymentDate,
            mes: 'octubre de 2026',
            sheetRowIndex: modalCliente.sheetRowIndex,
          }
        ];
      } else {
        const isSep = modoPeriodo === 'SEPTIEMBRE';
        recordsToEmit = [
          {
            id: crypto.randomUUID(),
            cod: modalCliente.cod,
            contrato: modalCliente.soli,
            cliente: modalCliente.name,
            dni: modalCliente.dni,
            telefono: modalCliente.phone,
            direccion: modalCliente.address,
            localidad: modalCliente.city,
            plan: modalCliente.plan,
            cuota: isSep ? cuotaSep : (cuotaAImputar || cuotaOct),
            importe: String(unitAmount),
            medio_pago: modalMedio,
            titular_comprobante: modalTitular,
            esBajaAutomatica: Boolean(estadoFin?.esBajaAutomatica),
            adminPin: adminPin,
            dueDate: isSep ? '15/09/26' : '15/10/26',
            paymentDate: modalCliente.paymentDate,
            mes: isSep ? 'septiembre de 2026' : 'octubre de 2026',
            sheetRowIndex: modalCliente.sheetRowIndex,
          }
        ];
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: recordsToEmit }),
      });

      const data = await response.json();
      if (data.success && data.files?.length > 0) {
        data.files.forEach((f: any) => {
          if (f.pdfUrl) window.open(f.pdfUrl, '_blank');
        });
        setModalCliente(null);
        fetchClients(true);
      } else {
        alert('Error generando PDF: ' + (data.error || 'desconocido'));
      }
    } catch (e: any) {
      alert('Error de conexión: ' + e.message);
    } finally {
      setIsGenerating(false);
    }
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

      {/* Modal de Emisión */}
      {modalCliente && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Emitir Recibo</h3>
            <p className="text-sm text-slate-500 mb-4">
              <span className="font-semibold text-slate-800">{modalCliente.name}</span>
              {' · '}{modalCliente.plan}
            </p>

            {/* Cartel de Alerta Crítica: BAJA AUTOMÁTICA */}
            {estadoFin?.esBajaAutomatica && (
              <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-red-900 font-black text-sm uppercase">
                  <span className="text-xl">🚨</span>
                  <span>ALERTA: CLIENTE EN BAJA AUTOMÁTICA</span>
                </div>
                <p className="text-xs text-red-700 mt-1 font-semibold leading-relaxed">
                  Este cliente adeuda <strong>{estadoFin.cuotasAdeudadas} cuotas</strong> ({estadoFin.detalleCuotasImpagas}).
                  Emisión bloqueada. Requiere autorización estricta de Maximiliano Despontin.
                </p>

                {/* Selector de Cuota a Imputar (la más antigua primero) */}
                <div className="mt-3">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cuota que abona el cliente:
                  </label>
                  <select
                    value={cuotaAImputar}
                    onChange={e => setCuotaAImputar(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium text-slate-800"
                  >
                    <option value={estadoFin.cuotaMasAntigua}>
                      Cuota N° {estadoFin.cuotaMasAntigua} (Más antigua impaga - Recomendado)
                    </option>
                    <option value={modalCliente.cuotaNum}>
                      Cuota N° {modalCliente.cuotaNum} (Cuota del mes actual)
                    </option>
                  </select>
                </div>

                {/* Input de PIN de Autorización de Maximiliano */}
                <div className="mt-3 pt-3 border-t border-red-200">
                  <label className="text-xs font-bold text-red-900 block mb-1">
                    PIN de Autorización de Maximiliano:
                  </label>
                  <input
                    type="password"
                    placeholder="Ingresar PIN de 4 dígitos"
                    value={adminPin}
                    onChange={e => setAdminPin(e.target.value)}
                    className="w-full border border-red-300 rounded-lg p-2 text-sm font-mono text-center font-bold bg-white focus:ring-2 focus:ring-red-500"
                  />
                  {adminPin && adminPin !== '2026' && (
                    <p className="text-[11px] text-red-600 font-bold mt-1">PIN incorrecto.</p>
                  )}
                  {adminPin === '2026' && (
                    <p className="text-[11px] text-emerald-600 font-bold mt-1">✔ Autorización confirmada.</p>
                  )}
                </div>
              </div>
            )}

            {/* Tarjeta de Estado Financiero */}
            {isLoadingEstado ? (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-4 flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Calculando estado de cuenta...</span>
              </div>
            ) : estadoFin ? (
              <div className={`rounded-xl p-4 border mb-4 ${estadoFin.esBajaAutomatica ? 'bg-red-50/50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs font-semibold text-orange-600 uppercase">Cuota a Imputar</p>
                    <p className="text-2xl font-bold text-orange-700">N° {cuotaAImputar || modalCliente?.cuotaNum || '1'}</p>
                    <p className="text-xs text-slate-500">Según CRM · {estadoFin.cuotasPagadas} pago(s) registrado(s)</p>
                    {estadoFin.detalleCuotasImpagas && estadoFin.detalleCuotasImpagas !== 'Ninguna' && (
                      <p className="text-[11px] text-red-600 font-bold mt-1">
                        📖 Libro Mayor: Adeuda cuota(s) {estadoFin.detalleCuotasImpagas}
                      </p>
                    )}
                  </div>
                  {estadoFin.deudaTotal !== null && (
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-500 uppercase">Saldo Deudor</p>
                      <p className={`text-lg font-bold ${estadoFin.deudaTotal <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        ${estadoFin.deudaTotal <= 0 ? '0' : estadoFin.deudaTotal.toLocaleString('es-AR')}
                      </p>
                      {estadoFin.deudaTotal <= 0 && <p className="text-xs text-emerald-600">Al día ✅</p>}
                    </div>
                  )}
                </div>
                {estadoFin.ultimoPago && (
                  <p className="text-xs text-slate-500">Último pago registrado: <span className="font-semibold">{estadoFin.ultimoPago}</span></p>
                )}
              </div>
            ) : (
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-4">
                <p className="text-xs font-semibold text-orange-600 uppercase">Cuota a Imprimir</p>
                <p className="text-2xl font-bold text-orange-700">N° {modalCliente?.cuotaNum || '1'}</p>
                <p className="text-xs text-slate-500">Según CRM · sin registros en CC</p>
              </div>
            )}

            <div className="space-y-4">
              {/* Selector de Período / Cuota a Emitir */}
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">
                  Período y Cuota a Cobrar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModoPeriodo('OCTUBRE');
                      const raw = String(modalCliente?.amount || '0').replace(/\./g, '').replace(',', '.');
                      setModalMonto(String(parseFloat(raw) || 0));
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      modoPeriodo === 'OCTUBRE'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>Octubre 2026</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Cuota {modalCliente?.cuotaNum || '1'}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoPeriodo('SEPTIEMBRE');
                      const raw = String(modalCliente?.amount || '0').replace(/\./g, '').replace(',', '.');
                      setModalMonto(String(parseFloat(raw) || 0));
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      modoPeriodo === 'SEPTIEMBRE'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>Septiembre 2026</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Cuota {Math.max(1, parseInt(modalCliente?.cuotaNum || '1') - 1)} (Atrasada)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModoPeriodo('AMBOS');
                      const raw = String(modalCliente?.amount || '0').replace(/\./g, '').replace(',', '.');
                      setModalMonto(String((parseFloat(raw) || 0) * 2));
                    }}
                    className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all ${
                      modoPeriodo === 'AMBOS'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>Ambos Meses</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Sep + Oct (2 Recibos)</div>
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  {modoPeriodo === 'AMBOS' ? 'Importe Total (2 cuotas consecutivas)' : 'Importe de la cuota'}
                </p>
                <p className="text-3xl font-bold text-emerald-700">
                  ${Number(modalMonto).toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {modoPeriodo === 'AMBOS'
                    ? 'Generará 2 recibos oficiales individuales consecutivos con sus debidas fechas de vencimiento'
                    : 'Valor contractual según planilla'}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Medio de Pago Real Utilizado
                </label>
                <select
                  value={modalMedio}
                  onChange={e => setModalMedio(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="EFECTIVO">💵 Efectivo en Oficina (100% neto)</option>
                  <option value="MP_QR">📱 QR Mercado Pago / Interoperable (10% Retención)</option>
                  <option value="POSNET">💳 Posnet / Terminal Point (Tarjeta Débito/Crédito - 10% Retención)</option>
                  <option value="RAPIPAGO">🧾 Rapipago (Cupón de Cobranza Extrabancaria - 10% Retención)</option>
                  <option value="PAGO_FACIL">🧾 Pago Fácil (Cupón de Cobranza Extrabancaria - 10% Retención)</option>
                  <option value="TRANSFERENCIA_BANCARIA">🏦 Transferencia Bancaria (CBU / Alias - 100% neto)</option>
                  <option value="MP_TRANSFERENCIA">📱 Transferencia Mercado Pago (CVU / Alias - 100% neto)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Titular del Comprobante / Quién abonó
                </label>
                <input
                  type="text"
                  placeholder={modalCliente?.name || 'Nombre del pagador'}
                  value={modalTitular}
                  onChange={e => setModalTitular(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">Si pagó un familiar o tercero, anota su nombre aquí.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalCliente(null)}
                className="flex-1 border border-slate-300 text-slate-600 py-2.5 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !modalMonto || (Boolean(estadoFin?.esBajaAutomatica) && adminPin !== '2026')}
                className={`flex-1 py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                  Boolean(estadoFin?.esBajaAutomatica) && adminPin !== '2026'
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95'
                }`}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                ) : Boolean(estadoFin?.esBajaAutomatica) && adminPin !== '2026' ? (
                  '🔒 Requiere PIN de Maxi'
                ) : (
                  <><FileText className="w-4 h-4" /> {
                    modoPeriodo === 'AMBOS'
                      ? 'Emitir 2 Recibos (Sep + Oct)'
                      : modoPeriodo === 'SEPTIEMBRE'
                      ? 'Emitir Recibo Septiembre 2026'
                      : 'Emitir Recibo Octubre 2026'
                  }</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
