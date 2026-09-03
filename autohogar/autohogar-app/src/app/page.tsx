'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2, LogOut, History, Users, File as FileIcon, Loader2, FileText, Send, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [records, setRecords] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUser, setCurrentUser] = useState<{ email: string; nombre: string; rol: string } | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificar sesión real con el servidor al cargar la página
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

        const saved = localStorage.getItem('ah_records');
        const savedGenerated = localStorage.getItem('ah_generated');
        if (saved) setRecords(JSON.parse(saved));
        if (savedGenerated === 'true') setGenerated(true);
      } catch (err) {
        router.push('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('ah_user');
      localStorage.removeItem('ah_records');
      localStorage.removeItem('ah_generated');
      router.push('/login');
      router.refresh();
    } catch {}
  };

  // Guardar records en localStorage cada vez que cambian
  useEffect(() => {
    try {
      if (records.length > 0) {
        localStorage.setItem('ah_records', JSON.stringify(records));
        localStorage.setItem('ah_generated', String(generated));
      }
    } catch {}
  }, [records, generated]);

  const handleClearSession = () => {
    if (confirm('Limpiar todos los registros de la sesión actual?')) {
      localStorage.removeItem('ah_records');
      localStorage.removeItem('ah_generated');
      setRecords([]);
      setGenerated(false);
      setSearchTerm('');
    }
  };

  // ── Verificación Interna Removida (Escalabilidad 1 Click) ──────────────────
  // Ya no se requiere tipear titulares manualmente para generar recibos.

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setRecords(data.records);
        setGenerated(false);
        setSearchTerm('');
      } else {
        alert("Error procesando el archivo: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    } finally {
      setIsUploading(false);
      setFile(null);
    }
  };

  const handleGeneratePDFs = async () => {
    const toGenerate = records.filter(r => r.status !== 'generado');
    if (toGenerate.length === 0) {
      alert('No hay registros pendientes para generar.');
      return;
    }
    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: toGenerate }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Mapear la respuesta a los records para mostrar los links
        const updatedRecords = records.map(r => {
          const fileInfo = data.files.find((f: any) => f.id === r.id);
          if (fileInfo) {
            return { ...r, pdfUrl: fileInfo.pdfUrl, waLink: fileInfo.waLink, status: 'generado' };
          }
          return r;
        });
        setRecords(updatedRecords);
        setGenerated(true);

        // Registrar en la auditoría con el usuario emisor actual
        try {
          const nowStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
          const existingLogsRaw = localStorage.getItem('ah_audit_logs');
          const existingLogs = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
          
          const newLogs = records.map(r => ({
            id: crypto.randomUUID(),
            fecha: nowStr,
            usuario: `${currentUser?.nombre || 'Operador'} (${currentUser?.rol || 'General'})`,
            accion: 'Generó recibo PDF y link WA',
            cliente: `${r.cliente} (Contrato: ${r.contrato})`
          }));

          localStorage.setItem('ah_audit_logs', JSON.stringify([...newLogs, ...existingLogs]));
        } catch {}

      } else {
        alert("Error generando PDFs: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión con el generador de PDFs.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Normaliza texto: minúsculas + sin acentos para búsqueda robusta
  const norm = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filteredRecords = records.filter(record => {
    if (!searchTerm.trim()) return true;
    // Concatenar todos los campos en un único string para buscar en él
    const haystack = [
      record.cliente,
      record.contrato,
      record.cod,
      record.dni,
      record.telefono,
      record.cuota,
      record.importe,
      record.medio_pago,
      record.plan,
    ].map(norm).join(' ');

    // Cada palabra del término debe aparecer en algún campo
    const words = norm(searchTerm).split(/\s+/).filter(Boolean);
    return words.every(word => haystack.includes(word));
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">AutoHogar</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/historial" className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-2 transition-colors">
              <History className="w-4 h-4" />
              Auditoría
            </Link>
            {currentUser?.rol === 'ADMIN' && (
              <Link href="/admin/users" className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                <Users className="w-4 h-4" />
                Panel Usuarios
              </Link>
            )}
            <div className="h-4 w-px bg-slate-300"></div>

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

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-md hover:bg-red-50 border border-slate-100 flex items-center gap-1.5 text-xs font-semibold"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Carga de Cobranza Diaria</h2>
              <p className="text-slate-500">Sube la planilla de Excel con los pagos del día para cruzar los datos y generar los recibos automáticamente.</p>
            </div>
            <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold border border-orange-200">
              Módulo Operador
            </div>
          </div>

          <div className="p-8">
            {records.length > 0 ? (
              <div className="space-y-6">
                {/* Banner de estado con contadores de verificación */}
                {(() => {
                  const pendientes = records.filter(r => r.status !== 'generado');
                  const generados = records.filter(r => r.status === 'generado');
                  const allDone = records.every(r => r.status === 'generado');
                  return (
                    <div className="space-y-3">
                      {/* Barra de progreso */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-amber-700 uppercase">Pendientes (Listos)</p>
                            <p className="text-xl font-bold text-amber-900">{pendientes.length}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-700 uppercase">PDFs Generados</p>
                            <p className="text-xl font-bold text-emerald-900">{generados.length}</p>
                          </div>
                        </div>
                      </div>

                      {/* Banner principal */}
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {allDone
                              ? `✅ Todos los recibos generados (${generados.length})`
                              : `✅ Listos para generar (${pendientes.length})`
                            }
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Puedes emitir todos los PDF con un solo click.</p>
                        </div>
                        <button
                          onClick={handleGeneratePDFs}
                          disabled={isGenerating || pendientes.length === 0}
                          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm whitespace-nowrap"
                        >
                          {isGenerating ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Generando...</>
                          ) : (
                            <><FileText className="w-4 h-4" /> Generar {pendientes.length > 0 ? `${pendientes.length} ` : ''}PDF{pendientes.length !== 1 ? 's' : ''}</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {/* Indicador de registros */}
                <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                  <span>
                    <span className="font-semibold text-slate-700">{records.length}</span> registros cargados en sesión
                    {searchTerm.trim() && (
                      <> &rarr; <span className="font-semibold text-blue-600">{filteredRecords.length}</span> coincidencias</>
                    )}
                  </span>
                  {records.length > 0 && !searchTerm && (
                    <span className="text-slate-400">Mostrando todos</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1 flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2.5 shadow-sm">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, contrato, DNI, teléfono, cod., importe..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 outline-none text-sm text-slate-700 bg-transparent placeholder-slate-400"
                      spellCheck={false}
                      data-gramm="false"
                      autoComplete="off"
                    />
                    {searchTerm && (
                      <span className="text-xs text-slate-400 shrink-0">
                        {filteredRecords.length} resultado{filteredRecords.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="text-slate-400 hover:text-slate-600 shrink-0">✕</button>
                    )}
                  </div>
                  <button
                    onClick={handleClearSession}
                    className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
                  >
                    Limpiar sesión
                  </button>
                </div>
                
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[500px]">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-xs font-semibold sticky top-0">
                        <tr>
                          <th className="px-4 py-3 whitespace-nowrap">Contrato</th>
                          <th className="px-4 py-3">Cliente</th>
                          <th className="px-4 py-3">DNI</th>
                          <th className="px-4 py-3">Teléfono</th>
                          <th className="px-4 py-3">Medio de Pago</th>
                          <th className="px-4 py-3">Cuota</th>
                          <th className="px-4 py-3">Importe</th>
                          <th className="px-4 py-3 text-center">Estado</th>
                          <th className="px-4 py-3 text-center bg-slate-50 sticky right-0">Acc.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredRecords.map((record) => {
                          const estaVerificado = Boolean(record.verificado);
                          const tieneTitular = String(record.titular_comprobante || '').trim().length >= 2;
                          const esPDF = record.status === 'generado';
                          return (
                            <tr
                              key={record.id}
                              className={`transition-colors ${
                                esPDF ? 'bg-emerald-50/40' :
                                estaVerificado ? 'bg-blue-50/30' :
                                'hover:bg-slate-50'
                              }`}
                            >
                              <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">{record.contrato}</td>
                              <td className="px-4 py-2.5 text-slate-700 text-xs">{record.cliente}</td>
                              <td className="px-4 py-2.5 text-slate-600 text-xs">{record.dni}</td>
                              <td className="px-4 py-2.5 text-slate-600 text-xs whitespace-nowrap">{record.telefono}</td>
                              <td className="px-4 py-2.5 text-slate-600 text-xs">{record.medio_pago}</td>
                              <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap">N° {record.cuota}</td>
                              <td className="px-4 py-2.5 font-medium text-slate-900 whitespace-nowrap">${record.importe}</td>

                              {/* Estado */}
                              <td className="px-4 py-2.5 text-center">
                                {esPDF ? (
                                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">✓ PDF</span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">LISTO</span>
                                )}
                              </td>

                              {/* Acciones */}
                              <td className="px-4 py-2.5 text-center sticky right-0 bg-white border-l border-slate-100">
                                {esPDF ? (
                                  <div className="flex justify-center gap-1">
                                    <a href={record.pdfUrl} target="_blank" rel="noreferrer"
                                      className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-2 py-1 rounded border border-blue-200"
                                      title="Ver PDF">
                                      PDF
                                    </a>
                                    {record.waLink && (
                                      <a href={record.waLink} target="_blank" rel="noreferrer"
                                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded border border-emerald-200"
                                        title="Enviar por WhatsApp">
                                        WA
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-blue-400 text-[10px] font-semibold">Listo</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="flex justify-start">
                  <button onClick={handleClearSession} className="text-sm font-medium text-slate-500 hover:text-slate-700 underline">
                    Subir otro archivo
                  </button>
                </div>
              </div>
            ) : !file ? (
              <label className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group">
                <div className="bg-white p-4 rounded-full shadow-sm border border-slate-200 mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Haz clic para subir tu planilla</h3>
                <p className="text-sm text-slate-500 text-center max-w-sm">
                  Acepta archivos .xlsx, .xls y .csv. Asegúrate de subir la carga diaria de cobranzas.
                </p>
                <input type="file" className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileChange} />
              </label>
            ) : (
              <div className="border border-slate-200 rounded-xl p-8 bg-white shadow-sm flex flex-col items-center text-center">
                <div className="bg-orange-50 p-4 rounded-full mb-4">
                  <FileIcon className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">Archivo seleccionado</h3>
                <p className="text-sm text-slate-600 mb-6 font-medium bg-slate-100 px-4 py-2 rounded-lg inline-block">
                  {file.name}
                </p>
                
                <div className="flex gap-4">
                  <button 
                    onClick={() => setFile(null)} 
                    disabled={isUploading}
                    className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="px-6 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-70 flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cruzando Datos...
                      </>
                    ) : (
                      'Procesar y Cruzar Datos'
                    )}
                  </button>
                </div>
              </div>
            )}

            {records.length === 0 && (
              <div className="mt-8 flex items-center gap-3 text-sm text-slate-600 bg-emerald-50 text-emerald-800 p-4 rounded-lg border border-emerald-200">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <p>El sistema cruzará automáticamente los DNI y planes desde la base de datos maestra segura.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
