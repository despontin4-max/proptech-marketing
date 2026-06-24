/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Eye,
  Users,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Home,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardMockupProps {
  activePath: 'vender' | 'comprar';
  propertyValue: number; // Linked dynamically to the range slider!
}

export default function DashboardMockup({ activePath, propertyValue }: DashboardMockupProps) {
  const [activeStep, setActiveStep] = useState(1);
  
  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  useEffect(() => {
    // Alternate some minor indicators
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 3) + 1);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Absolute Decorative Glow behind dashboard */}
      <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/15 to-brand-navy-500/15 blur-xl opacity-80" />

      {/* Main glassmorphic dashboard block */}
      <div
        id="dashboard-isometric-preview"
        className="relative bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.01] hover:-translate-y-1"
      >
        {/* Dashboard Top bar */}
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            <span className="text-[11px] font-mono text-slate-500 ml-2 tracking-wider uppercase">
              {activePath === 'vender' ? 'Owner_Dashboard.bin' : 'Buyer_Portal.bin'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200">
              ● LIVE
            </span>
            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
              CP
            </div>
          </div>
        </div>

        {/* Dashboard Body */}
        <div className="p-4 md:p-6 space-y-4">
          
          {/* Header Greeting inside Mockup */}
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono">
                {activePath === 'vender' ? 'Panel de Control Propietario' : 'Portal de Búsqueda Activa'}
              </div>
              <h3 className="text-lg font-outfit font-extrabold text-brand-navy-950 mt-1 flex items-center gap-2">
                {activePath === 'vender' ? 'Gisela Del Río' : 'Tomás Schiaretti'}
                <span className="text-xs font-normal text-slate-500 font-mono">
                  {activePath === 'vender' ? '#ID-V942' : '#ID-C503'}
                </span>
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-red-500" />
                {activePath === 'vender' ? 'B° Cerro de las Rosas, Córdoba' : 'Nueva Córdoba / Urca, Córdoba'}
              </p>
            </div>
            
            {/* Dynamic Value Tracker Badge */}
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Tasación Algorítmica</span>
              <span className="text-sm font-extrabold text-blue-600 font-mono tracking-tight">
                {activePath === 'vender' ? formatCurrency(propertyValue) : 'Presupuesto: USD 250k'}
              </span>
            </div>
          </div>

          {/* Conditional Content: QUIERO VENDER */}
          {activePath === 'vender' ? (
            <div className="space-y-4 animate-fadeIn">
              {/* Stat Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-1">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Interés de Compra</span>
                  <span className="text-base font-extrabold text-brand-navy-900 mt-1 block">Alta</span>
                  <div className="w-full bg-slate-200 h-1 rounded-full mt-1.5 overflow-hidden">
                    <div className="bg-blue-500 h-1 rounded-full w-[85%]" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Visitas Web</span>
                  <span className="text-base font-extrabold text-brand-navy-900 mt-1 block">412</span>
                  <span className="text-[9px] text-emerald-500 flex items-center gap-0.5 mt-1 font-mono">
                    +18% este mes
                  </span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-[10px] text-slate-500 block">Ofertas Recibidas</span>
                  <span className="text-base font-extrabold text-emerald-500 mt-1 block">2</span>
                  <span className="text-[9px] text-slate-400 block mt-1 font-mono">Última hace 4h</span>
                </div>
              </div>

              {/* Home Staging por IA Interactive Preview widget */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-brand-navy-900">Filtro de Home Staging por IA</span>
                  </div>
                  <span className="text-[9px] font-mono bg-blue-50 text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded uppercase">
                    Módulo Activo
                  </span>
                </div>
                
                {/* Visual rendering of Before vs After slider placeholder inside dashboard */}
                <div className="relative h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=400&q=80"
                    alt="IA Staging Preview"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  
                  {/* Left Label */}
                  <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-slate-900/85 border border-white/10 text-[9px] text-slate-200 font-mono">
                    Living Original
                  </span>
                  
                  {/* Right Label */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-white/95 border border-blue-200 text-[9px] text-blue-600 font-semibold flex items-center gap-0.5 font-mono">
                    <Sparkles className="w-2.5 h-2.5" /> IA Amoblado
                  </span>

                  {/* Absolute Center Divider */}
                  <div className="absolute inset-y-0 left-1/2 w-0.5 bg-blue-500 shadow-[0_0_10px_#3b82f6]">
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-[8px] font-bold text-white shadow-lg">
                      ↔
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 text-center leading-relaxed italic">
                  "Se agregaron sofás modernos, luminarias minimalistas y texturas escandinavas automáticamente."
                </p>
              </div>

              {/* Progress Timeline Tracker */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <span className="text-xs font-semibold text-brand-navy-900 block">Cronograma de Venta Digital</span>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-500 flex items-center justify-center text-[10px] font-bold text-emerald-600">
                      ✓
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-slate-800">Tasación Algorítmica Realizada</span>
                        <span className="text-[9px] text-slate-500">23/06/2026</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Publicado exitosamente en 12 portales automáticamente.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-500 flex items-center justify-center text-[10px] font-bold text-blue-600 animate-pulse">
                      2
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-blue-600">Home Staging por IA y Fotos</span>
                        <span className="text-[9px] text-blue-500 font-semibold">En Curso</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Renderizados fotorrealistas de alta fidelidad completados.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 opacity-60">
                    <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      3
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-700">Coordinación de Visitas Físicas</span>
                        <span className="text-[9px] text-slate-500">Siguiente etapa</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            // Conditional Content: QUIERO COMPRAR
            <div className="space-y-4 animate-fadeIn">
              
              {/* Active Search & Alert Status */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-brand-navy-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Alertas de Búsqueda Activa
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                    4 Propiedades Clave
                  </span>
                </div>
                
                {/* Simulated Matches */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <div>
                        <span className="text-xs text-brand-navy-900 block font-semibold">Semipiso Nueva Córdoba</span>
                        <span className="text-[9px] text-slate-500">Chacabuco 1100 - USD 125,000</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 font-mono">Match 98%</span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded bg-white border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <div>
                        <span className="text-xs text-brand-navy-900 block font-semibold">Duplex en Urca con Terraza</span>
                        <span className="text-[9px] text-slate-500">Emilio Lamarca - USD 185,000</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-500 font-mono">Match 91%</span>
                  </div>
                </div>
              </div>

              {/* Book Virtual Tour Scheduled widget */}
              <div className="bg-brand-navy-900 rounded-xl p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Tour Virtual CPCPI Programado
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-slate-300">
                  <div>
                    <span className="text-xs font-semibold block text-slate-100">Hoy 18:30hs</span>
                    <span className="text-[10px] text-slate-400 block">Martillero CPCPI: Walter Peralta</span>
                  </div>
                  <button className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 transition-all">
                    <span>Unirse</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Algorithm Search Matrix Graphic */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider block mb-2">
                  Preferencias del Comprador
                </span>
                
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                      <span>Rango Presupuestario</span>
                      <span className="font-mono text-blue-600 font-semibold">USD 120k - USD 260k</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full ml-[30%] w-[55%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] text-slate-600 mb-1">
                      <span>Ubicación Estratégica</span>
                      <span className="font-mono text-blue-600 font-semibold">Alta Densidad / Segura</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[80%]" />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Footer compliance stamp in mockup */}
          <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-mono">
            <span>SISTEMA DE SEGURIDAD SHA-256</span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> CONEXIÓN SEGURA CPCPI
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
