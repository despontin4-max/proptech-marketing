'use client';

import React, { useState, useEffect } from 'react';
import { History, FileText, ArrowLeft, Search, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const initialDemoLogs = [
  { id: 'demo-1', usuario: 'Recepción (Operador)', accion: 'Generó recibo PDF y link WA', cliente: 'PAREDES HUGO ARIEL (Contrato: 7409479)', fecha: '10/08/2026 14:30' },
  { id: 'demo-2', usuario: 'Cobranzas 1 (Operador)', accion: 'Generó recibo PDF y link WA', cliente: 'GUEVARA ANTONIO NICOLAS (Contrato: 9287)', fecha: '10/08/2026 14:28' },
  { id: 'demo-3', usuario: 'Administrador 1 (Admin)', accion: 'Sincronizó base de datos con Google Sheets', cliente: 'Todos (Master)', fecha: '09/08/2026 09:15' },
  { id: 'demo-4', usuario: 'Cobranzas 2 (Operador)', accion: 'Generó recibo PDF y link WA', cliente: 'GARAY MARCELO (Contrato: 8984)', fecha: '08/08/2026 16:45' },
];

export default function Historial() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<{ email: string; nombre: string; rol: string } | null>(null);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          router.push('/login');
          return;
        }

        const savedLogs = localStorage.getItem('ah_audit_logs');
        if (savedLogs) {
          const parsed = JSON.parse(savedLogs);
          setLogs(parsed.length > 0 ? parsed : initialDemoLogs);
        } else {
          setLogs(initialDemoLogs);
        }
      } catch {
        router.push('/login');
      }
    }

    checkAuth();
  }, [router]);

  const handleClearHistory = () => {
    if (confirm('¿Deseas vaciar el historial de auditoría?')) {
      localStorage.removeItem('ah_audit_logs');
      setLogs([]);
    }
  };

  // Normaliza texto: minúsculas + sin acentos
  const norm = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filteredLogs = logs.filter(log => {
    if (!searchTerm.trim()) return true;
    const haystack = [log.usuario, log.accion, log.cliente, log.fecha].map(norm).join(' ');
    const words = norm(searchTerm).split(/\s+/).filter(Boolean);
    return words.every(word => haystack.includes(word));
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-slate-800 p-2 rounded-lg">
              <History className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Historial de Auditoría</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Usuario Autenticado */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
              <Users className="w-4 h-4 text-orange-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-slate-800">{currentUser?.nombre || 'Operador'}</span>
                <span className="text-[10px] text-slate-500 block uppercase font-semibold">
                  {currentUser?.rol || 'Sesión Activa'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Registro de Actividad en Tiempo Real</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Muestra quién emitió cada recibo PDF y cuándo lo compartió. Cada acción queda grabada por usuario.
                </p>
              </div>
              {logs.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-xs font-medium text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Vaciar historial
                </button>
              )}
            </div>

            {/* Buscador */}
            <div className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2.5 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Buscar por usuario (Recepción, Cobranzas1...), cliente, acción o fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 outline-none text-sm text-slate-700 bg-transparent placeholder-slate-400"
                spellCheck={false}
                autoComplete="off"
              />
              {searchTerm && (
                <span className="text-xs text-slate-400 shrink-0">
                  {filteredLogs.length} resultado{filteredLogs.length !== 1 ? 's' : ''}
                </span>
              )}
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 shrink-0">✕</button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Usuario Emisor</th>
                  <th className="px-6 py-4">Acción Realizada</th>
                  <th className="px-6 py-4">Cliente / Contrato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                      No se encontraron registros para <span className="font-semibold text-slate-600">"{searchTerm}"</span>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">{log.fecha}</td>
                      <td className="px-6 py-4 text-slate-900 font-bold">{log.usuario}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          log.accion.includes('Generó') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {log.accion.includes('Generó') && <FileText className="w-3.5 h-3.5" />}
                          {log.accion}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{log.cliente}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
