/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  PhoneCall,
  ChevronRight,
  Calculator,
  Search,
  MessageCircle
} from 'lucide-react';

import AnnouncementBar from './components/AnnouncementBar';
import Header from './components/Header';
import DashboardMockup from './components/DashboardMockup';
import SavingCalculator from './components/SavingCalculator';
import PropertyCatalog from './components/PropertyCatalog';
import Footer from './components/Footer';

export default function App() {
  // Navigation active state
  const [activePath, setActivePath] = useState<'vender' | 'comprar'>('vender');
  
  // Real-time synced property range state (shared between slider and dashboard mockup)
  const [propertyValue, setPropertyValue] = useState<number>(150000);

  // Smooth scroll handler
  const handleScrollToElement = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-brand-navy-500/30 selection:text-brand-navy-900 antialiased overflow-x-hidden">
      {/* SECTION A: ANNOUNCEMENT BAR & HEADER */}
      <AnnouncementBar />
      <Header
        activePath={activePath}
        setActivePath={setActivePath}
        onScrollToElement={handleScrollToElement}
      />

      {/* Hero Section Container */}
      <main className="flex-grow">
        
        {/* SECTION B: HERO SECTION & DYNAMIC STATE TABS */}
        <section
          id="main-hero"
          className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
        >
          {/* Decorative Background Blob Elements */}
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-brand-navy-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* 2-column grid on desktop, 1-column on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Column 1: Hero Content */}
            <div className="lg:col-span-7 space-y-6 lg:pr-6">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-navy-50 border border-brand-navy-200/60 text-brand-navy-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-widest uppercase font-mono">
                  LA EVOLUCIÓN INMOBILIARIA
                </span>
              </div>

              {/* Main Headline (H1) */}
              <h1 className="font-outfit text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-navy-950 leading-[1.1]">
                Vendé tu propiedad sin pagar{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-navy-600 to-blue-500">
                  comisiones abusivas
                </span>
                .
              </h1>

              {/* Subtext */}
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Te acompañamos con tecnología de punta, tasación algorítmica y reportes en tiempo real en todo Córdoba. Descubrí el verdadero valor de tu inmueble al instante.
              </p>

              {/* Navigation Tabs Switcher (Pill Container) */}
              <div className="pt-2">
                <div className="inline-flex p-1.5 rounded-full bg-slate-100 border border-slate-200 shadow-sm relative">
                  {/* Button 1 (Quiero Vender) */}
                  <button
                    id="btn-tab-vender"
                    onClick={() => setActivePath('vender')}
                    className={`px-6 py-3 rounded-full text-xs md:text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${
                      activePath === 'vender'
                        ? 'bg-brand-navy-800 text-white shadow-lg shadow-brand-navy-850/20 scale-100'
                        : 'bg-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Quiero Vender</span>
                  </button>

                  {/* Button 2 (Quiero Comprar) */}
                  <button
                    id="btn-tab-comprar"
                    onClick={() => setActivePath('comprar')}
                    className={`px-6 py-3 rounded-full text-xs md:text-sm font-bold tracking-wide transition-all duration-300 flex items-center gap-2 ${
                      activePath === 'comprar'
                        ? 'bg-brand-navy-800 text-white shadow-lg shadow-brand-navy-850/20 scale-100'
                        : 'bg-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>Quiero Comprar</span>
                  </button>
                </div>
              </div>

              {/* Trust Bulletpoints */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-250">
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <span>Sin contratos abusivos ni exclusividades forzadas</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                  <span>Martilleros Matriculados CPCPI Ley 9445</span>
                </div>
              </div>

            </div>

            {/* Column 2: Platform Isometric Private Dashboard Mockup */}
            <div className="lg:col-span-5 relative w-full flex justify-center">
              <DashboardMockup activePath={activePath} propertyValue={propertyValue} />
            </div>

          </div>
        </section>

        {/* SECTION C & D: MAIN DYNAMIC CONTENT PATHS */}
        <section
          id="main-functional-path"
          className="relative py-16 bg-slate-50 text-slate-900 border-y border-slate-200"
        >
          {/* Inner constraint */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {activePath === 'vender' ? (
              /* PATH 1: "QUIERO VENDER" (Savings Calculator & Lead Capture) */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Visual Context Left Block */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest font-mono">
                      Maximiza tu ganancia
                    </span>
                    <h2 className="font-outfit text-3xl font-extrabold text-slate-900">
                      Calculá tu comisión y tasá de manera inteligente.
                    </h2>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      El mercado inmobiliario tradicional te cobra hasta el 6% de comisión por vender tu casa. Con nuestro modelo ágil pagás una tarifa fija del 1.5% sin letra chica.
                    </p>
                  </div>

                  {/* Bullet Highlights */}
                  <div className="space-y-3.5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs font-mono">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Tasación Algorítmica</h4>
                        <p className="text-xs text-slate-500">Modelamos el valor de tu inmueble en tiempo real cruzando datos del registro provincial.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs font-mono">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Home Staging por IA</h4>
                        <p className="text-xs text-slate-500">Amueblamos digitalmente tus fotos vacías con renders hiperrealistas para acelerar la venta.</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 font-bold text-xs font-mono">
                        3
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Acompañamiento Legal</h4>
                        <p className="text-xs text-slate-500">Operaciones firmadas digitalmente y validadas por martilleros CPCPI de Córdoba.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Interactive Calculators & Lead Forms Right Block */}
                <div className="lg:col-span-7">
                  <SavingCalculator
                    propertyValue={propertyValue}
                    setPropertyValue={setPropertyValue}
                  />
                </div>

              </div>
            ) : (
              /* PATH 2: "QUIERO COMPRAR" (Search Module & Product Catalog Grid) */
              <div className="animate-fadeIn">
                <PropertyCatalog />
              </div>
            )}
          </div>
        </section>

        {/* Dynamic CTA Banner to encourage connection */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="cta-section">
          <div className="relative rounded-3xl bg-white border border-slate-200 p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
            {/* Absolute visual backdrop element */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="text-xs text-blue-500 uppercase tracking-widest font-mono font-bold block">
                Atención Personalizada Profesional
              </span>
              <h3 className="font-outfit text-2xl md:text-3xl font-extrabold text-brand-navy-950">
                ¿Preferís conversar directamente con un martillero?
              </h3>
              <p className="text-sm text-slate-600">
                Llamanos o escribinos hoy mismo. Te asesoramos sobre tasaciones periciales oficiales, fideicomisos y financiamientos privados.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="https://wa.me/5493510000000?text=Hola!%20Quiero%20hacer%20una%20consulta%20con%20un%20martillero%20matriculado%20de%20C%C3%B3rdoba%20Proptech."
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Contacto WhatsApp</span>
              </a>

              <button
                onClick={() => handleScrollToElement('footer-section')}
                className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-brand-navy-900 font-semibold text-sm transition-colors text-center"
              >
                Ver Matriculación Legal
              </button>
            </div>
          </div>
        </section>

      </main>

      {/* SECTION E: FOOTER COMPLIANCE & LINKS */}
      <Footer />
    </div>
  );
}
