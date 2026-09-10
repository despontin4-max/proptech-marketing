'use client';

import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, LogOut, History, Users, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const [clientes, setClientes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; nombre: string; rol: string } | null>(null);

  useEffect(() => {
    async function init() {
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

        // Fetch all clients
        const clientsRes = await fetch('/api/clientes?all=true');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          if (clientsData.success) {
            setClientes(clientsData.clientes);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {}
  };

  const handleGeneratePDF = async (cliente: any) => {
    const amount = prompt(`Monto a cobrar para ${cliente.name}:`, cliente.amount || '0');
    if (amount === null) return;
    
    const medioPago = prompt(`Medio de Pago (Efectivo / MercadoPago):`, 'Efectivo');
    if (medioPago === null) return;

    if (medioPago.toLowerCase().includes('mercado') || medioPago.toLowerCase().includes('mp')) {
       alert("ALERTA DE SEGURIDAD: Los pagos por MercadoPago deben ser verificados por Administración en Google Drive antes de entregar el recibo final.");
    }

    setIsGenerating(cliente.cod);
    try {
      // Mock generation API call - you should adapt this to your actual /api/generate
      const record = {
        id: crypto.randomUUID(),
        cod: cliente.cod,
        contrato: cliente.soli,
        cliente: cliente.name,
        dni: cliente.dni,
        telefono: cliente.phone,
        direccion: cliente.address,
        localidad: cliente.city,
        plan: cliente.plan,
        cuota: cliente.cuotaNum || '1',
        importe: amount,
        medio_pago: medioPago
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records: [record] }),
      });

      const data = await response.json();
      
      if (data.success && data.files && data.files.length > 0) {
        const fileInfo = data.files[0];
        window.open(fileInfo.pdfUrl, '_blank');
      } else {
        alert("Error generando PDF: " + data.error);
      }
    } catch (error) {
      alert("Error de conexión con el generador.");
    } finally {
      setIsGenerating(null);
    }
  };

  const norm = (s: any) =>
    String(s ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const filteredClientes = clientes.filter(c => {
    if (!searchTerm.trim()) return true;
    const haystack = [c.name, c.soli, c.cod, c.dni, c.phone].map(norm).join(' ');
    const words = norm(searchTerm).split(/\s+/).filter(Boolean);
    return words.every(word => haystack.includes(word));
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-800">AutoHogar CRM</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/historial" className="text-sm text-slate-500 hover:text-slate-900">Auditoría</Link>
            <button onClick={handleLogout} className="text-red-600 text-sm font-semibold">Salir</button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Buscador en Vivo</h2>
            <p className="text-slate-500 text-sm">Busca por Nombre, DNI, Solicitud o Teléfono para emitir recibos al instante.</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 mb-6">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Ej: 24735389 o Cepeda"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none text-slate-700 bg-transparent text-lg"
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
          ) : (
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Solicitud</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">DNI</th>
                    <th className="px-4 py-3">Teléfono</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClientes.slice(0, 100).map(c => (
                    <tr key={c.cod} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-900">{c.cod}</td>
                      <td className="px-4 py-3 text-slate-600">{c.soli}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 text-slate-600">{c.dni}</td>
                      <td className="px-4 py-3 text-slate-600">{c.phone}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleGeneratePDF(c)}
                          disabled={isGenerating === c.cod}
                          className="bg-emerald-600 text-white px-3 py-1.5 rounded-md hover:bg-emerald-700 disabled:opacity-50 text-xs font-semibold"
                        >
                          {isGenerating === c.cod ? 'Generando...' : 'Generar PDF'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredClientes.length > 100 && (
                 <div className="p-3 text-center text-xs text-slate-500 bg-slate-50">Mostrando los primeros 100 resultados. Escribe más letras para filtrar.</div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
