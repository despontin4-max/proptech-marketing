/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sparkles } from 'lucide-react';

export default function AnnouncementBar() {
  return (
    <div
      id="announcement-bar"
      className="h-[32px] w-full bg-slate-900 border-b border-white/5 flex items-center justify-center px-4 overflow-hidden"
    >
      <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-slate-50 tracking-wide animate-pulse">
        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
        <span>
          Comisión fija del <strong className="text-blue-400 font-semibold">1.5%</strong>. Ahorrá miles de USD en tu venta.
        </span>
        <span className="hidden md:inline-block text-slate-500">|</span>
        <span className="hidden md:inline-block text-slate-300 text-xs">
          Habilitado CPCPI N° 9445
        </span>
      </div>
    </div>
  );
}
