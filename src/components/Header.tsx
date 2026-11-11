import React from 'react';
import { AppConfig, MainTabType } from '../types';
import {
  Smartphone,
  Monitor,
  Download,
  Sparkles,
  BookOpen,
  Calendar,
  Clock,
  Film,
  School,
  GraduationCap,
  Bell,
} from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  onOpenInstall?: () => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  activeTab?: MainTabType;
  onTabChange?: (tab: MainTabType) => void;
  pendingTasksCount?: number;
  urgentNoticesCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenInstall,
  isMobileFrame,
  onToggleFrame,
  activeTab = 'inicio',
  onTabChange,
  pendingTasksCount = 0,
  urgentNoticesCount = 0,
}) => {
  const allSections: {
    id: MainTabType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: <Sparkles className="w-3.5 h-3.5" /> },
    {
      id: 'diario',
      label: 'Día a Día',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-3.5 h-3.5" /> },
    { id: 'horario', label: 'Horario', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'multimedia', label: 'Fotos y Vídeos', icon: <Film className="w-3.5 h-3.5" /> },
    { id: 'aprendemos', label: 'Aprendemos', icon: <School className="w-3.5 h-3.5" /> },
    { id: 'recursos', label: 'Recursos', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    {
      id: 'avisos',
      label: 'Avisos',
      icon: <Bell className="w-3.5 h-3.5" />,
      badge: urgentNoticesCount > 0 ? urgentNoticesCount : undefined,
      badgeColor: 'bg-rose-500 animate-pulse',
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex-shrink-0 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* 1. Main Brand Bar */}
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
              {/* Etiqueta del curso */}
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sky-50 text-sky-800 border border-sky-200">
                {config.schoolYear || 'Curso 2026/27'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium truncate leading-tight">
              {config.schoolName}
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenInstall && (
            <button
              type="button"
              onClick={onOpenInstall}
              title="Información de instalación en pantalla de inicio"
              className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
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

      {/* 2. Horizontal Scrollable Navigation for the 8 Sections */}
      {onTabChange && (
        <nav
          className="flex items-center gap-1 px-3 py-1.5 overflow-x-auto no-scrollbar border-t border-slate-100 bg-slate-50/70"
          aria-label="Secciones del Diario del Aula"
        >
          {allSections.map((sec) => {
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onTabChange(sec.id)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 select-none touch-manipulation active:scale-95 relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-400'}>
                  {sec.icon}
                </span>
                <span>{sec.label}</span>
                {sec.badge !== undefined && sec.badge > 0 && (
                  <span
                    className={`ml-0.5 text-white text-[9px] font-black min-w-3.5 h-3.5 px-1 rounded-full flex items-center justify-center ${
                      sec.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
