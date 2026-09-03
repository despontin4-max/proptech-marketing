'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Error al iniciar sesión.');
        setIsLoading(false);
        return;
      }

      // Guardar info no-sensible para renderizado UI rápido
      if (data.user) {
        localStorage.setItem('ah_user', JSON.stringify({
          id: data.user.rol,
          username: data.user.email,
          label: data.user.nombre,
          role: data.user.rol.startsWith('admin') ? 'Admin' : 'Operador',
        }));
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setErrorMessage('Error de conexión con el servidor. Intente nuevamente.');
      setIsLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-slate-100">
        
        {/* Header con Logo */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-orange-500/10 text-orange-600 mb-4 border border-orange-200">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            AUTOHOGAR
          </h2>
          <p className="text-xs uppercase tracking-widest font-semibold text-orange-600 mt-1">
            Sistema de Cobranzas y Recibos
          </p>
          <p className="mt-3 text-sm text-slate-500">
            Ingresá con tu correo y contraseña corporativa.
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm animate-shake">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>{errorMessage}</div>
          </div>
        )}

        {/* Formulario */}
        <form className="mt-6 space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-5 w-5" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@autohogar.com"
                className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-11 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all shadow-lg shadow-orange-600/20 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              'Ingresar al Sistema'
            )}
          </button>
        </form>

        {/* Accesos rápidos de prueba */}
        <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            Cuentas precargadas (para pruebas):
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickFill('despontin4@gmail.com', 'AutoHogar2026!')}
              className="p-2 rounded-lg bg-orange-50/70 hover:bg-orange-100 text-orange-900 border border-orange-200 transition-colors text-left col-span-3"
            >
              <span className="font-bold block flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                Administrador Principal
              </span>
              <span className="text-[11px] text-orange-700">despontin4@gmail.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('recepcion@autohogar.com', 'AutoHogar2026!')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 transition-colors text-left"
            >
              <span className="font-bold block">Recepción</span>
              <span className="text-[10px] text-slate-400">recepcion@autohogar.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('cobranzas1@autohogar.com', 'AutoHogar2026!')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 transition-colors text-left"
            >
              <span className="font-bold block">Cobranzas 1</span>
              <span className="text-[10px] text-slate-400">cobranzas1@autohogar.com</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('cobranzas2@autohogar.com', 'AutoHogar2026!')}
              className="p-2 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-700 text-slate-600 transition-colors text-left"
            >
              <span className="font-bold block">Cobranzas 2</span>
              <span className="text-[10px] text-slate-400">cobranzas2@autohogar.com</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
