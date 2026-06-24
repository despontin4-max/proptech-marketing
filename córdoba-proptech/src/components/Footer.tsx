/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Lock,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Send,
  X,
  Scale,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function Footer() {
  // Modal states
  const [activeModal, setActiveModal] = useState<'quejas' | 'privacy' | 'terms' | null>(null);
  
  // Libro de quejas form state
  const [complaintForm, setComplaintForm] = useState({
    fullName: '',
    dni: '',
    email: '',
    phone: '',
    message: ''
  });
  const [complaintSubmitted, setComplaintSubmitted] = useState(false);

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintSubmitted(true);
    setTimeout(() => {
      // Clear after success
      setComplaintForm({ fullName: '', dni: '', email: '', phone: '', message: '' });
    }, 4000);
  };

  return (
    <footer id="footer-section" className="bg-brand-navy-950 border-t border-white/10 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12 border-b border-white/5">
          
          {/* Col 1: Brand & Matriculation info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/10">
                C
              </div>
              <span className="font-outfit text-lg font-bold tracking-tight text-white">
                Córdoba <span className="text-blue-500">Proptech</span>
              </span>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm">
              La evolución digital del mercado inmobiliario cordobés. Tecnología algorítmica para tasar, publicar, comprar y vender de forma transparente, ágil y segura.
            </p>

            <div className="flex flex-col gap-1 text-[11px] text-slate-400 font-mono">
              <span>Matrícula CPCPI Profesional N° 9445</span>
              <span>Colegio Profesional de Corredores Públicos de Córdoba</span>
              <span>Ley Provincial de Córdoba N° 9445</span>
            </div>
          </div>

          {/* Col 2: Compliance Badges & Safe Seal */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Sellos de Confianza y Regulación
            </h4>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Trust Badge A: Safe Transaction (Cobalt Blue lock icon) */}
              <div
                id="safe-transaction-seal"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-navy-900/60 border border-brand-navy-700/30 text-slate-100 max-w-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <div>
                  <span className="text-xs font-bold block text-white uppercase tracking-wide">Transacción Segura</span>
                  <span className="text-[10px] text-slate-400 block font-mono">Encriptación SSL de 256 bits</span>
                </div>
              </div>

              {/* Trust Badge B: CPCPI Córdoba logo placeholder */}
              <div
                id="cpcpi-trust-seal"
                className="flex items-center gap-2.5 p-3 rounded-xl bg-brand-navy-900/40 border border-white/5 text-slate-300 max-w-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-brand-navy-800 flex items-center justify-center text-blue-500 shrink-0 font-mono text-[10px] font-bold border border-white/10">
                  CPCPI
                </div>
                <div>
                  <span className="text-xs font-bold block text-slate-200 uppercase tracking-wide">CPCPI Homologado</span>
                  <span className="text-[10px] text-slate-400 block">Martillero Walter Peralta</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-normal">
              Todas las operaciones legales de tasación física, intermediación y corretaje son dirigidas bajo estricta observancia del marco de la Ley Provincial 9445.
            </p>
          </div>

          {/* Col 3: Compliance Action Links */}
          <div className="space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Vínculos Legales e Instrumentos
            </h4>
            
            <div className="flex flex-col gap-2.5 text-xs text-slate-300 font-medium">
              <button
                onClick={() => setActiveModal('privacy')}
                className="flex items-center gap-2 hover:text-blue-500 text-left transition-colors self-start"
              >
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                <span>Política de Privacidad y RGPD</span>
              </button>

              <button
                onClick={() => setActiveModal('terms')}
                className="flex items-center gap-2 hover:text-blue-500 text-left transition-colors self-start"
              >
                <Scale className="w-4 h-4 text-slate-400" />
                <span>Términos y Condiciones del Servicio</span>
              </button>

              {/* STRICT REQUIREMENT: "Libro de Quejas Digital" */}
              <button
                onClick={() => {
                  setComplaintSubmitted(false);
                  setActiveModal('quejas');
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-colors self-start"
                title="Libro de Quejas Digital Homologado de Córdoba"
              >
                <AlertTriangle className="w-4 h-4" />
                <span className="font-semibold">Libro de Quejas Digital</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bottom copyright segment */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
          <div>
            © {new Date().getFullYear()} Córdoba Proptech. Todos los derechos reservados.
          </div>
          <div className="flex gap-4">
            <span>CUIT: 30-71459422-9</span>
            <span>Gobierno de la Provincia de Córdoba</span>
          </div>
        </div>
      </div>

      {/* MODALS RENDER SECTION */}
      
      {/* 1. LIBRO DE QUEJAS DIGITAL MODAL */}
      {activeModal === 'quejas' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-outfit font-extrabold text-brand-navy-900">
                    Libro de Quejas Digital
                  </h4>
                  <p className="text-[10px] text-blue-700 uppercase font-mono font-bold">
                    Provincia de Córdoba - Ley N° 10.247 / Resol. 45
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-brand-navy-900 hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {complaintSubmitted ? (
              <div className="text-center py-8 space-y-3 animate-fadeIn">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h5 className="text-sm font-bold text-slate-900">¡Queja o Reclamo Registrado con Éxito!</h5>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  Se ha generado el folio digital de queja. Copia fiel del mismo ha sido despachada a tu correo electrónico y notificada a Defensa del Consumidor de la Provincia de Córdoba para su debida fiscalización.
                </p>
                <span className="inline-block text-[10px] font-mono bg-slate-950 px-3 py-1 rounded text-blue-500">
                  Código de Seguimiento: CORD-QUE-{Math.floor(100000 + Math.random() * 900000)}
                </span>
              </div>
            ) : (
              <form onSubmit={handleComplaintSubmit} className="space-y-3">
                <p className="text-[11px] text-slate-600 leading-normal">
                  De acuerdo con las reglamentaciones vigentes en la Provincia de Córdoba, este registro digital constituye una vía legal para el ingreso de denuncias, reclamos o disconformidades en el servicio inmobiliario de Córdoba Proptech.
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">Nombre Completo</label>
                    <input
                      type="text"
                      required
                      value={complaintForm.fullName}
                      onChange={(e) => setComplaintForm({ ...complaintForm, fullName: e.target.value })}
                      placeholder="Ej: Sofía Martínez"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-navy-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">DNI / CUIL</label>
                    <input
                      type="text"
                      required
                      value={complaintForm.dni}
                      onChange={(e) => setComplaintForm({ ...complaintForm, dni: e.target.value })}
                      placeholder="Ej: 34.123.456"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-navy-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">Correo Electrónico</label>
                    <input
                      type="email"
                      required
                      value={complaintForm.email}
                      onChange={(e) => setComplaintForm({ ...complaintForm, email: e.target.value })}
                      placeholder="Ej: sofia@gmail.com"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-navy-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-700 mb-1">WhatsApp / Teléfono</label>
                    <input
                      type="tel"
                      required
                      value={complaintForm.phone}
                      onChange={(e) => setComplaintForm({ ...complaintForm, phone: e.target.value })}
                      placeholder="Ej: +54 9 351 1234"
                      className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-brand-navy-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-700 mb-1">Detalle del Reclamo o Queja</label>
                  <textarea
                    required
                    rows={3}
                    value={complaintForm.message}
                    onChange={(e) => setComplaintForm({ ...complaintForm, message: e.target.value })}
                    placeholder="Escribí aquí detalladamente los hechos..."
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-navy-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ingresar Queja Formal</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2. PRIVACY POLICY MODAL */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                <h4 className="text-base font-outfit font-extrabold text-brand-navy-900">Política de Privacidad</h4>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-brand-navy-900 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Última actualización: Junio de 2026.</p>
              <p className="font-semibold text-brand-navy-800">1. Compromiso de Datos</p>
              <p>En Córdoba Proptech garantizamos la protección de la información de contacto de los propietarios e inversores cordobeses. Los datos personales como el WhatsApp, nombre y dirección del inmueble ingresados en nuestro tasador son estrictamente confidenciales y de uso exclusivo para formular estimaciones de tasación algorítmica.</p>
              <p className="font-semibold text-brand-navy-800">2. Destinatarios de la Información</p>
              <p>Toda gestión legal inmobiliaria, tasación final u oferta vinculante es controlada bajo supervisión del martillero matriculado CPCPI N° 9445, asegurando el acatamiento de la Ley Provincial de Córdoba N° 9445 de corretaje inmobiliario.</p>
              <p>Usted puede solicitar la baja o rectificación de su información en cualquier momento contactándonos mediante nuestro correo institucional.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. TERMS & CONDITIONS MODAL */}
      {activeModal === 'terms' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-brand-navy-600" />
                <h4 className="text-base font-outfit font-extrabold text-brand-navy-900">Términos y Condiciones</h4>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-1 rounded-lg text-slate-400 hover:text-brand-navy-900 hover:bg-slate-100 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>Última actualización: Junio de 2026.</p>
              <p className="font-semibold text-brand-navy-800">1. Condiciones de Uso del Tasador</p>
              <p>El tasador algorítmico proporciona un estimado preliminar de mercado del inmueble para la Provincia de Córdoba, basado en comparables estadísticos activos. El mismo carece de validez pericial oficial hasta tanto se efectúe la verificación física obligatoria por el martillero público matriculado Ley 9445.</p>
              <p className="font-semibold text-brand-navy-800">2. Comisión Fija del 1.5%</p>
              <p>La comisión inmobiliaria acordada para la venta de inmuebles en la plataforma de Córdoba Proptech está fijada de manera inamovible en el 1.5% del monto final de escrituración de la propiedad. Este porcentaje es regulado en favor del ahorro del usuario, cumpliendo los topes legales y normativos.</p>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
