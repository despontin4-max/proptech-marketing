'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, FileText, LogOut, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  amount: string;
  estado: string;
  verificado: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: string } | null>(null);

  // Estado del modal de emisión de recibo
  const [modalCliente, setModalCliente] = useState<Cliente | null>(null);
  const [modalMonto, setModalMonto] = useState('');
  const [modalMedio, setModalMedio] = useState('Efectivo');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) { router.push('/login'); return; }
        const authData = await authRes.json();
        if (!authData.authenticated) { router.push('/login'); return; }
        setCurrentUser(authData.user);

        const clientsRes = await fetch('/api/clientes/list');
        const clientsData = await clientsRes.json();

        if (!clientsRes.ok || !clientsData.success) {
          setErrorMsg(clientsData.error || `Error HTTP ${clientsRes.status}`);
          setDebugInfo(JSON.stringify(clientsData, null, 2));
          return;
        }

        setClientes(clientsData.clientes);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error de red');
      } finally {
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
    setModalMonto(c.amount || '');
    setModalMedio('Efectivo');
  };

  const handleGeneratePDF = async () => {
    if (!modalCliente) return;
    const esMercadoPago = modalMedio.toLowerCase().includes('mercado') || modalMedio.toLowerCase().includes('mp');

    if (esMercadoPago) {
      const ok = confirm(
        `⚠️ ALERTA: Los pagos por MercadoPago deben ser verificados por Administración en Google Drive.\n\n¿Confirmas que ya verificaste el ingreso del pago antes de emitir el recibo?`
      );
      if (!ok) return;
    }

    setIsGenerating(true);
    try {
      const record = {
        id: crypto.randomUUID(),
        cod: modalCliente.cod,
        contrato: modalCliente.soli,
        cliente: modalCliente.name,
        dni: modalCliente.dni,
        telefono: modalCliente.phone,
        direccion: modalCliente.address,
        localidad: modalCliente.city,
        plan: modalCliente.plan,
        cuota: modalCliente.cuotaNum || '1',
        importe: modalMonto,
        medio_pago: modalMedio,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] }),
      });

      const data = await response.json();
      if (data.success && data.files?.length > 0) {
        window.open(data.files[0].pdfUrl, '_blank');
        setModalCliente(null);
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
            <Link href="/historial" className="text-sm text-slate-500 hover:text-slate-900">Auditoría</Link>
            <button onClick={handleLogout} className="text-red-600 text-sm font-semibold flex items-center gap-1">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Buscador de Clientes</h2>
            <p className="text-slate-500 text-sm mt-1">Busca por Nombre, DNI, N° Solicitud o Teléfono.</p>
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
                {clientes.length} clientes cargados
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
                        <th className="px-4 py-3">Cuota</th>
                        <th className="px-4 py-3 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredClientes.slice(0, 150).map(c => {
                        const verificado = Boolean(c.verificado);
                        return (
                        <tr key={c.cod + c.soli} className="hover:bg-orange-50 transition-colors">
                          <td className="px-4 py-2.5 font-mono text-slate-700">{c.cod}</td>
                          <td className="px-4 py-2.5 text-slate-600">{c.soli}</td>
                          <td className="px-4 py-2.5 font-semibold text-slate-900">{c.name}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.dni}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.phone}</td>
                          <td className="px-4 py-2.5 font-medium text-emerald-700">
                            {c.amount ? `$${c.amount}` : '-'}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {verificado ? (
                              <button
                                onClick={() => openModal(c)}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 ml-auto"
                              >
                                <FileText className="w-3 h-3" /> Emitir Recibo
                              </button>
                            ) : (
                              <span className="text-xs text-amber-600 font-semibold flex items-center gap-1 justify-end">
                                <AlertCircle className="w-3 h-3" /> Pago no verificado
                              </span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                      {filteredClientes.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                            {searchTerm ? 'No se encontraron resultados.' : 'No hay clientes cargados.'}
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

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Importe a Cobrar ($)
                </label>
                <input
                  type="number"
                  value={modalMonto}
                  onChange={e => setModalMonto(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase mb-1 block">
                  Medio de Pago
                </label>
                <select
                  value={modalMedio}
                  onChange={e => setModalMedio(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option>Efectivo</option>
                  <option>MercadoPago</option>
                  <option>Transferencia</option>
                  <option>Débito</option>
                </select>
              </div>

              {(modalMedio === 'MercadoPago' || modalMedio === 'Transferencia') && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Recuerda verificar el ingreso del pago en tu cuenta antes de emitir el recibo.</span>
                </div>
              )}
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
                disabled={isGenerating || !modalMonto}
                className="flex-1 bg-emerald-600 text-white py-2.5 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</> : <><FileText className="w-4 h-4" /> Generar PDF</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
