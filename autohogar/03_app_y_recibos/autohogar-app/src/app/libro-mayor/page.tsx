'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  RefreshCw, 
  LogOut, 
  Users, 
  DollarSign, 
  Calendar,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ClienteLibroMayor {
  cod: string;
  soli: string;
  nombre: string;
  dni: string;
  telefono: string;
  plan: string;
  cuotaExigible: number;
  valorCuota: number;
  cuotasAdeudadas: number;
  cuotasFaltantes: number[];
  detalleCuotasImpagas: string;
  deudaExigible: number;
  estadoMora: 'BAJA_AUTOMATICA' | 'MORA_LEVE' | 'AL_DIA';
  ultimoPago: string | null;
  ultimoMedioPago: string | null;
  fechaVto: string;
  pagadoEsteMes: boolean;
}

interface KPIs {
  total: number;
  bajaAutomatica: number;
  moraLeve: number;
  alDia: number;
  deudaTotalExigible: number;
}

export default function LibroMayorPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<{ nombre: string; rol: string } | null>(null);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [clientes, setClientes] = useState<ClienteLibroMayor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFiltro, setTabFiltro] = useState<'TODOS' | 'BAJA_AUTOMATICA' | 'MORA_LEVE' | 'AL_DIA'>('TODOS');

  const fetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // Verificar sesión
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      if (!authData.authenticated) {
        router.push('/login');
        return;
      }
      setCurrentUser(authData.user);

      // Obtener datos del Libro Mayor
      const res = await fetch('/api/libro-mayor');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setKpis(data.kpis);
          setClientes(data.clientes || []);
        }
      }
    } catch (err) {
      console.error('Error cargando Libro Mayor:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      console.error(e);
    }
  };

  // Normalizar búsqueda
  const norm = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const clientesFiltrados = clientes.filter(c => {
    // Filtro por pestaña
    if (tabFiltro !== 'TODOS' && c.estadoMora !== tabFiltro) {
      return false;
    }

    // Filtro por buscador
    if (!searchTerm.trim()) return true;
    const haystack = [c.nombre, c.dni, c.soli, c.cod, c.plan, c.detalleCuotasImpagas].map(norm).join(' ');
    const terms = norm(searchTerm).split(/\s+/).filter(Boolean);
    return terms.every(term => haystack.includes(term));
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="bg-orange-600 p-2 rounded-lg text-white">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Libro Mayor de Cuotas Impagas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentUser && (
              <span className="text-sm text-slate-500 hidden sm:inline">
                {currentUser.nombre} · <span className="uppercase text-xs font-bold text-orange-600">{currentUser.rol}</span>
              </span>
            )}
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              🔍 Cobranzas
            </Link>
            <Link href="/resumen-mes" className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1">
              📊 Estado del Mes
            </Link>
            <Link href="/historial" className="text-sm text-slate-500 hover:text-slate-900">
              Auditoría
            </Link>
            <button onClick={handleLogout} className="text-red-600 text-sm font-semibold flex items-center gap-1 hover:text-red-700">
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {/* Título y Acciones */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Estado de Cuentas Corrientes y Morosidad</h2>
            <p className="text-slate-500 text-sm mt-1">
              Auditoría integral de cuotas vencidas consecutivas y alternadas, control de baja automática y saldo deudor.
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50 self-start sm:self-auto"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-600' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar Libro Mayor'}</span>
          </button>
        </div>

        {/* Tarjetas de Métricas KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-red-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-red-600">
                <ShieldAlert className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Baja Automática (≥2 cuotas)</span>
              </div>
              <p className="text-3xl font-extrabold text-red-700">
                {isLoading ? '...' : kpis?.bajaAutomatica || 0}
              </p>
              <p className="text-xs text-red-600 mt-1 font-medium">Requiere PIN 2026 de Maximiliano</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-amber-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Mora Leve (1 cuota)</span>
              </div>
              <p className="text-3xl font-extrabold text-amber-700">
                {isLoading ? '...' : kpis?.moraLeve || 0}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">Atraso de 1 mes / A cobrar</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Al Día (0 cuotas)</span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700">
                {isLoading ? '...' : kpis?.alDia || 0}
              </p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">Al corriente contractualmente</p>
            </div>
          </div>

          {currentUser?.rol?.toUpperCase() === 'ADMIN' ? (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-0" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-slate-600">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Deuda Total Exigible</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800">
                  ${isLoading ? '...' : Number(kpis?.deudaTotalExigible || 0).toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Exclusivo Administrador</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -z-0" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-slate-600">
                  <Users className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Total Clientes</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-800">
                  {isLoading ? '...' : kpis?.total || 0}
                </p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Cartera activa en seguimiento</p>
              </div>
            </div>
          )}
        </div>

        {/* Barra de Filtros y Buscador */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Pestañas de Filtro */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTabFiltro('TODOS')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tabFiltro === 'TODOS'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({clientes.length})
              </button>
              <button
                onClick={() => setTabFiltro('BAJA_AUTOMATICA')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  tabFiltro === 'BAJA_AUTOMATICA'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                }`}
              >
                🚨 Baja Automática ({kpis?.bajaAutomatica || 0})
              </button>
              <button
                onClick={() => setTabFiltro('MORA_LEVE')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  tabFiltro === 'MORA_LEVE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                ⚠️ En Mora ({kpis?.moraLeve || 0})
              </button>
              <button
                onClick={() => setTabFiltro('AL_DIA')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-all ${
                  tabFiltro === 'AL_DIA'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                ✅ Al Día ({kpis?.alDia || 0})
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar cliente, DNI o N° Solicitud..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
              />
            </div>
          </div>
        </div>

        {/* Tabla del Libro Mayor */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="py-20 text-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-orange-500" />
              <p className="text-base font-medium text-slate-600">Calculando Libro Mayor y saldos deudores...</p>
              <p className="text-xs text-slate-400 mt-1">Auditando 1_CLIENTES y 2_CUENTA_CORRIENTE</p>
            </div>
          ) : clientesFiltrados.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 stroke-[1.5] text-slate-300" />
              <p className="text-base font-semibold text-slate-600">No se encontraron clientes</p>
              <p className="text-xs text-slate-400 mt-1">Prueba cambiando el filtro o término de búsqueda.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">Cliente / Contrato</th>
                    <th className="py-3 px-4">Plan / Cuota</th>
                    <th className="py-3 px-4 text-center">Cuota Exigible</th>
                    <th className="py-3 px-4">Cuotas Impagas (Libro Mayor)</th>
                    <th className="py-3 px-4 text-right">Saldo Deudor</th>
                    <th className="py-3 px-4 text-center">Estado Contractual</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientesFiltrados.map((c) => {
                    const esBaja = c.estadoMora === 'BAJA_AUTOMATICA';
                    const esMora = c.estadoMora === 'MORA_LEVE';

                    return (
                      <tr 
                        key={c.cod} 
                        className={`hover:bg-slate-50/80 transition-colors ${
                          esBaja ? 'bg-red-50/20' : esMora ? 'bg-amber-50/20' : ''
                        }`}
                      >
                        {/* Cliente */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900 leading-snug">{c.nombre}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>COD: <strong>{c.cod}</strong></span>
                            <span>·</span>
                            <span>SOLI: <strong>{c.soli}</strong></span>
                            {c.dni && (
                              <>
                                <span>·</span>
                                <span>DNI: {c.dni}</span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3.5 px-4">
                          <p className="font-medium text-slate-800 text-xs">{c.plan || '-'}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            ${Number(c.valorCuota).toLocaleString('es-AR')}
                          </p>
                        </td>

                        {/* Cuota Exigible */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-block bg-slate-100 text-slate-800 font-bold px-2.5 py-1 rounded-md text-xs">
                            N° {c.cuotaExigible}
                          </span>
                        </td>

                        {/* Cuotas Impagas */}
                        <td className="py-3.5 px-4">
                          {c.cuotasFaltantes.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {c.cuotasFaltantes.map(num => (
                                <span 
                                  key={num}
                                  className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                                    esBaja 
                                      ? 'bg-red-100 text-red-800 border border-red-300' 
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}
                                >
                                  Cuota {num}
                                </span>
                              ))}
                              <span className="text-[11px] text-slate-500 ml-1">
                                ({c.cuotasAdeudadas} {c.cuotasAdeudadas === 1 ? 'cuota' : 'cuotas'})
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Al día ✅
                            </span>
                          )}
                        </td>

                        {/* Saldo Deudor */}
                        <td className="py-3.5 px-4 text-right">
                          <p className={`font-bold ${c.deudaExigible > 0 ? 'text-red-700' : 'text-emerald-600'}`}>
                            ${c.deudaExigible.toLocaleString('es-AR')}
                          </p>
                          {c.ultimoPago && (
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Último: {c.ultimoPago}
                            </p>
                          )}
                        </td>

                        {/* Estado Contractual */}
                        <td className="py-3.5 px-4 text-center">
                          {esBaja ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-red-100 text-red-800 border border-red-200">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                              BAJA AUTOMÁTICA
                            </span>
                          ) : esMora ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              EN MORA (1)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              AL DÍA
                            </span>
                          )}
                        </td>

                        {/* Acción */}
                        <td className="py-3.5 px-4 text-center">
                          <Link
                            href={`/?buscar=${encodeURIComponent(c.soli || c.dni || c.nombre)}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-lg border border-orange-200 transition-colors"
                          >
                            <span>Cobrar / Ficha</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
