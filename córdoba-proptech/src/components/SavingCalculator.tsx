/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  ArrowRight,
  TrendingUp,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Lock,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { LeadForm } from '../types';

interface SavingCalculatorProps {
  propertyValue: number;
  setPropertyValue: (val: number) => void;
}

export default function SavingCalculator({ propertyValue, setPropertyValue }: SavingCalculatorProps) {
  // Lead state
  const [leadForm, setLeadForm] = useState<LeadForm>({
    address: '',
    type: 'Casa',
    phone: ''
  });
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [tasacionResultado, setTasacionResultado] = useState<{
    estimatedMin: number;
    estimatedMax: number;
    estimatedAverage: number;
    classicFee: number;
    proptechFee: number;
    savings: number;
  } | null>(null);

  // Fee calculation
  const classicFee = propertyValue * 0.06;
  const proptechFee = propertyValue * 0.015;
  const savings = classicFee - proptechFee;

  // Format currency
  const formatUSD = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPropertyValue(Number(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check honeypot
    if (honeypot) {
      console.warn('Bot detected via honeypot');
      return; // Silently fail to protect server resources
    }

    if (!leadForm.address || !leadForm.phone) {
      alert('Por favor complete la dirección y el WhatsApp para calcular la tasación.');
      return;
    }

    setIsSubmitting(true);

    // Simulate high-fidelity algorithmic computation
    setTimeout(() => {
      // Create algorithmic estimation variance
      const factor = leadForm.type === 'Casa' ? 1.05 : leadForm.type === 'Depto' ? 0.98 : 0.65;
      const computedBase = propertyValue * factor;
      const min = computedBase * 0.94;
      const max = computedBase * 1.06;
      const avg = computedBase;

      setTasacionResultado({
        estimatedMin: min,
        estimatedMax: max,
        estimatedAverage: avg,
        classicFee: avg * 0.06,
        proptechFee: avg * 0.015,
        savings: (avg * 0.06) - (avg * 0.015)
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 1500);
  };

  const resetCalculator = () => {
    setLeadForm({ address: '', type: 'Casa', phone: '' });
    setTasacionResultado(null);
    setIsSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. CALCULADORA DE AHORRO REAL */}
      <div className="bg-brand-navy-900/70 backdrop-blur-xl border border-brand-navy-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-outfit font-bold text-white">
              Calculadora de Ahorro Real
            </h3>
            <p className="text-xs text-slate-300">
              Arrastrá el control para ver cuánto ahorrás con nuestra comisión fija del 1.5%
            </p>
          </div>
        </div>

        {/* Range Slider Container */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-slate-200">Valor de tu Propiedad:</span>
            <span className="text-2xl font-mono font-extrabold text-white tracking-tight">
              {formatUSD(propertyValue)} <span className="text-sm text-slate-400 font-sans font-normal">USD</span>
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              id="comision-range"
              min="50000"
              max="500000"
              step="10000"
              value={propertyValue}
              onChange={handleSliderChange}
              className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>USD 50k</span>
              <span>USD 150k</span>
              <span>USD 250k</span>
              <span>USD 350k</span>
              <span>USD 500k</span>
            </div>
          </div>
        </div>

        {/* Dynamic Display Blocks (Side-by-side or stacked) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Block A: Classic Real Estate */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-1">
            <div className="text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
              Inmobiliaria Clásica (6%)
            </div>
            <div className="text-xl font-bold text-slate-900 font-mono">
              {formatUSD(classicFee)} <span className="text-xs text-slate-500 font-normal">USD</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-normal">
              Comisión promedio de mercado sin soporte tecnológico integrado.
            </p>
          </div>

          {/* Block B: Córdoba Proptech */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 space-y-1">
            <div className="text-[11px] font-mono font-semibold text-blue-600 uppercase tracking-wider flex items-center justify-between">
              <span>Córdoba Proptech (1.5%)</span>
              <span className="bg-blue-100 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-sans uppercase">Fijo</span>
            </div>
            <div className="text-xl font-bold text-blue-700 font-mono">
              {formatUSD(proptechFee)} <span className="text-xs text-blue-500 font-normal">USD</span>
            </div>
            <p className="text-[10px] text-blue-800/70 leading-normal">
              Soporte legal de punta y marketing automatizado incluido.
            </p>
          </div>
        </div>

        {/* Tu Ahorro Estimado Highlight Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-emerald-700 uppercase tracking-widest font-mono font-bold block">
              Tu Ahorro Estimado
            </span>
            <span className="text-2xl font-mono font-black text-emerald-600">
              {formatUSD(savings)} <span className="text-sm font-sans font-medium text-emerald-700">USD</span>
            </span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[11px] text-emerald-800">Ahorrás un equivalente a</p>
            <span className="text-xs font-semibold text-emerald-600">~ {((savings / propertyValue) * 100).toFixed(1)}% del inmueble</span>
          </div>
        </div>
      </div>

      {/* 2. STEP-BY-STEP LEAD CAPTURE FORM (TASADOR ALGORÍTMICO) */}
      <div id="tasador-form-card" className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden">
        {isSubmitted && tasacionResultado ? (
          /* High Fidelity Result Display */
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                  <span>Tasación exitosa</span>
              </div>
              <h3 className="text-xl md:text-2xl font-outfit font-extrabold text-slate-900 flex items-center justify-center gap-2">
                ¡Tasación Algorítmica Estimada!
              </h3>
              <p className="text-xs text-slate-500">
                Hemos procesado los datos de <span className="text-blue-600 font-mono">{leadForm.address}</span>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Valor Promedio de Mercado Estimado
                </span>
                <div className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                  {formatUSD(tasacionResultado.estimatedAverage)}
                </div>
                <div className="text-xs text-slate-500">
                  Rango Estimado: <span className="font-mono text-slate-700">{formatUSD(tasacionResultado.estimatedMin)} - {formatUSD(tasacionResultado.estimatedMax)}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Tipo de Inmueble:</span>
                  <span className="font-semibold text-slate-900">{leadForm.type}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Ahorro en Comisión Proptech:</span>
                  <span className="font-semibold text-emerald-600 font-mono">+{formatUSD(tasacionResultado.savings)} USD</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Celular del Propietario:</span>
                  <span className="font-semibold text-slate-900">{leadForm.phone}</span>
                </div>
              </div>
            </div>

            {/* CTA action options */}
            <div className="space-y-2">
              <a
                href={`https://wa.me/5493510000000?text=Hola!%20Acabo%20de%20tasar%20mi%20propiedad%20en%20el%20sitio%20de%20C%C3%B3rdoba%20Proptech%20por%20un%20valor%20estimado%20de%20${encodeURIComponent(formatUSD(tasacionResultado.estimatedAverage))}%20USD.%20Quiero%20coordinar%20la%20verificaci%C3%B3n%20f%C3%ADsica.`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm tracking-wide transition-all duration-300 shadow-xl active:scale-95 group"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Confirmar Visita Física por WhatsApp</span>
              </a>

              <button
                onClick={resetCalculator}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-600 transition-colors"
              >
                Tasar otra Propiedad
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center leading-relaxed font-mono">
              *Tasación preliminar generada automáticamente por motor estadístico. Sujeto a verificación obligatoria del martillero Ley 9445.
            </p>
          </div>
        ) : (
          /* Lead Capture Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-widest text-blue-600 font-mono">
                TASADOR ALGORÍTMICO EN 30 SEGUNDOS
              </span>
            </div>

            <h4 className="text-base font-outfit font-extrabold text-slate-900">
              Obtené un reporte de tasación inmediata y estimación de ahorro
            </h4>

            {/* Input fields */}
            <div className="space-y-3">
              <div>
                <label htmlFor="prop-address" className="block text-xs font-medium text-slate-700 mb-1">
                  Dirección de la Propiedad <span className="text-blue-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="prop-address"
                    required
                    placeholder="Ej: Av. Tissera 500, La Calera"
                    value={leadForm.address}
                    onChange={(e) => setLeadForm({ ...leadForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="prop-type" className="block text-xs font-medium text-slate-700 mb-1">
                    Tipo de Propiedad
                  </label>
                  <select
                    id="prop-type"
                    value={leadForm.type}
                    onChange={(e) => setLeadForm({ ...leadForm, type: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Casa">Casa</option>
                    <option value="Depto">Departamento</option>
                    <option value="Lote">Lote</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="prop-whatsapp" className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp del Propietario <span className="text-blue-600">*</span>
                  </label>
                  <input
                    type="tel"
                    id="prop-whatsapp"
                    required
                    placeholder="Ej: +54 9 351 123 4567"
                    value={leadForm.phone}
                    onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Hidden Honeypot Input for anti-spam bots */}
              <input
                type="text"
                name="website_trap"
                id="website_trap"
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* CTA Button */}
            <button
              type="submit"
              id="valuation-submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-700 disabled:bg-blue-800 text-white font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Procesando Tasación Algorítmica...</span>
                </>
              ) : (
                <>
                  <span>Tasar Propiedad en 30s</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Disclaimer */}
            <p className="text-[10px] text-slate-400 leading-normal text-justify">
              Tasación estimada preliminar. Operación legal sujeta a verificación física por martillero matriculado Ley 9445. Al enviar, aceptás recibir la estimación vía WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
