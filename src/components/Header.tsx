import React from 'react';
import { AppConfig } from '../types';
import { Smartphone, Monitor, Download, X } from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  onOpenInstall: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  showPwaBanner: boolean;
  onDismissPwaBanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenInstall,
  isMobileFrame,
  onToggleFrame,
  showPwaBanner,
  onDismissPwaBanner,
}) => {
  return (
    <header className="sticky top-0 z-30 flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* PWA Promo Banner */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-sky-600 via-indigo-600 to-teal-600 text-white px-3 py-1.5 flex items-center justify-between text-xs transition-all">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-xs shrink-0">
              <Download className="w-3 h-3" />
            </span>
            <span className="font-medium text-[11px] truncate">
              Instala esta app en tu pantalla de inicio
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <button
              onClick={onOpenInstall}
              className="bg-white text-sky-900 font-bold px-2 py-0.5 rounded-full text-[10px] shadow-xs hover:bg-sky-50 transition cursor-pointer"
            >
              ¿Cómo?
            </button>
            <button
              onClick={onDismissPwaBanner}
              className="text-white/80 hover:text-white p-0.5 text-xs cursor-pointer"
              title="Cerrar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        {/* School & Class Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-sky-500/20 shrink-0 border border-slate-200/80 bg-white flex items-center justify-center">
            <img
              src="/pwa-192x192.png"
              alt="Mascota 1ºB Las Hormiguitas"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-display font-extrabold text-slate-900 text-base leading-tight truncate">
                {config.classTitle}
              </h1>
              {/* Etiqueta del curso solicitada */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                Curso 2026/27
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate leading-tight">
              {config.schoolName}
            </p>
          </div>
        </div>

        {/* Right Tools - Frame switcher on desktop */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleFrame}
            title={isMobileFrame ? 'Expandir a vista de escritorio' : 'Ajustar a marco de móvil'}
            className="hidden sm:flex w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition cursor-pointer"
          >
            {isMobileFrame ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
