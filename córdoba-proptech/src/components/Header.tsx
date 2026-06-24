/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Shield, Home, Search, Calculator, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  activePath: 'vender' | 'comprar';
  setActivePath: (path: 'vender' | 'comprar') => void;
  onScrollToElement: (id: string) => void;
}

export default function Header({ activePath, setActivePath, onScrollToElement }: HeaderProps) {
  return (
    <header
      id="main-header"
      className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left-aligned Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActivePath('vender');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 group focus:outline-none"
            aria-label="Córdoba Proptech Home"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-navy-800 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-brand-navy-800/20 group-hover:scale-105 transition-transform duration-300">
              C
            </div>
            <span className="font-outfit text-xl font-extrabold tracking-tight text-brand-navy-900 group-hover:text-blue-600 transition-colors duration-300">
              Córdoba <span className="text-blue-600">Proptech</span>
            </span>
          </button>
        </div>

        {/* CPCPI Compliance Badge */}
        <div className="flex items-center justify-center">
          <div
            id="compliance-badge"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] md:text-xs font-semibold uppercase tracking-wider"
            title="Corredor Público Inmobiliario Matriculado Ley 9445"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-600/10" />
            <span>CPCPI N° 9445</span>
          </div>
        </div>

        {/* Desktop Navigation Links & Action */}
        <nav className="hidden lg:flex items-center gap-6">
          <button
            id="nav-link-vender"
            onClick={() => {
              setActivePath('vender');
              onScrollToElement('main-hero');
            }}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 py-1.5 border-b-2 ${
              activePath === 'vender'
                ? 'text-brand-navy-900 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-blue-600'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Quiero Vender</span>
          </button>

          <button
            id="nav-link-comprar"
            onClick={() => {
              setActivePath('comprar');
              onScrollToElement('main-hero');
            }}
            className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-200 py-1.5 border-b-2 ${
              activePath === 'comprar'
                ? 'text-brand-navy-900 border-blue-600'
                : 'text-slate-600 border-transparent hover:text-blue-600'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Quiero Comprar</span>
          </button>

          <button
            onClick={() => onScrollToElement('footer-section')}
            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-all duration-200"
          >
            Legal y CPCPI
          </button>

          <button
            onClick={() => {
              setActivePath('vender');
              setTimeout(() => onScrollToElement('tasador-form-card'), 200);
            }}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all duration-200 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 active:scale-95"
          >
            <span>Tasar Propiedad</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </nav>

        {/* Mobile quick action indicator */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => {
              setActivePath(activePath === 'vender' ? 'comprar' : 'vender');
            }}
            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 transition-colors text-xs font-semibold flex items-center gap-1"
          >
            {activePath === 'vender' ? <Search className="w-3.5 h-3.5" /> : <Calculator className="w-3.5 h-3.5" />}
            <span>Ir a {activePath === 'vender' ? 'Comprar' : 'Vender'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
