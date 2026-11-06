import React from 'react';
import { AppConfig } from '../types';
import { School, Settings, Smartphone, Monitor, UserCheck, GraduationCap, Download, X, Lock, LogOut } from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  onOpenSettings: () => void;
  onOpenInstall: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  role: 'family' | 'teacher';
  onToggleRole: () => void;
  showPwaBanner: boolean;
  onDismissPwaBanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onOpenInstall,
  isMobileFrame,
  onToggleFrame,
  role,
  onToggleRole,
  showPwaBanner,
  onDismissPwaBanner,
}) => {
  return (
    <header className="sticky top-0 z-30 flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* PWA Promo Banner */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-teal-600 text-white px-3 py-1.5 flex items-center justify-between text-xs transition-all">
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
              className="bg-white text-indigo-900 font-bold px-2 py-0.5 rounded-full text-[10px] shadow-xs hover:bg-indigo-50 transition cursor-pointer"
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
          <div className="w-10 h-10 rounded-2xl overflow-hidden shadow-md shadow-cyan-500/20 shrink-0 border border-slate-200/80 bg-white flex items-center justify-center">
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
              <button
                onClick={onToggleRole}
                type="button"
                title={
                  role === 'teacher'
                    ? 'Modo Docente activo. Toca para volver a Modo Familia'
                    : 'Modo Familia activo. Toca para desbloquear Modo Docente (Requiere PIN)'
                }
                className={`cursor-pointer inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition ${
                  role === 'teacher'
                    ? 'bg-purple-100 text-purple-900 border border-purple-300 hover:bg-purple-200 shadow-2xs'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {role === 'teacher' ? (
                  <>
                    <GraduationCap className="w-2.5 h-2.5 text-purple-700" />
                    <span>Docente</span>
                    <LogOut className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                  </>
                ) : (
                  <>
                    <UserCheck className="w-2.5 h-2.5 text-indigo-600" />
                    <span>Familia</span>
                    <Lock className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate leading-tight">
              {config.schoolName}
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Frame Toggle (Desktop preview helper) */}
          <button
            onClick={onToggleFrame}
            title={isMobileFrame ? 'Expandir a vista de escritorio' : 'Ajustar a marco de móvil'}
            className="hidden sm:flex w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition cursor-pointer"
          >
            {isMobileFrame ? (
              <Monitor className="w-4 h-4" />
            ) : (
              <Smartphone className="w-4 h-4" />
            )}
          </button>

          {/* Teacher Settings - Exclusively visible for Docente role */}
          {role === 'teacher' && (
            <button
              onClick={onOpenSettings}
              title="Ajustes de aula (Modo Docente)"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center hover:bg-purple-100 hover:text-purple-900 transition cursor-pointer shadow-2xs animate-in fade-in zoom-in-95 duration-200"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
