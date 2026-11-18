import React from 'react';
import { AppConfig, MainTabType } from '../types';
import {
  Smartphone,
  Monitor,
  Download,
  Home,
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
    badgeTone?: string;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: <Home className="w-4 h-4" strokeWidth={1.9} /> },
    {
      id: 'diario',
      label: 'Día a Día',
      icon: <BookOpen className="w-4 h-4" strokeWidth={1.9} />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeTone: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
    },
    { id: 'calendario', label: 'Calendario', icon: <Calendar className="w-4 h-4" strokeWidth={1.9} /> },
    { id: 'horario', label: 'Horario', icon: <Clock className="w-4 h-4" strokeWidth={1.9} /> },
    { id: 'multimedia', label: 'Fotos y Vídeos', icon: <Film className="w-4 h-4" strokeWidth={1.9} /> },
    { id: 'aprendemos', label: 'Aprendemos', icon: <School className="w-4 h-4" strokeWidth={1.9} /> },
    { id: 'recursos', label: 'Recursos', icon: <GraduationCap className="w-4 h-4" strokeWidth={1.9} /> },
    {
      id: 'avisos',
      label: 'Avisos',
      icon: <Bell className="w-4 h-4" strokeWidth={1.9} />,
      badge: urgentNoticesCount > 0 ? urgentNoticesCount : undefined,
      badgeTone: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]',
    },
  ];

  const containerWidthClass = isMobileFrame ? 'max-w-2xl' : 'max-w-5xl';

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] safe-top">
      <div className={`${containerWidthClass} mx-auto px-4 sm:px-6 transition-all duration-200`}>
        {/* 1. Fila principal de marca (ligera y compacta en móvil) */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#E2E8F0] bg-[#EEF2FF] flex items-center justify-center shadow-xs">
              <img
                src="/pwa-192x192.png"
                alt="Mascota 1.º B Las Hormiguitas"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="font-display font-bold text-[#0F172A] text-base sm:text-lg leading-tight truncate">
                  {config.classTitle}
                </h1>
              </div>
              <p className="text-xs text-[#475569] font-medium truncate leading-tight">
                {config.schoolName}
                <span aria-hidden="true" className="mx-1.5 text-slate-300">·</span>
                <span>{config.schoolYear || 'Curso 2026/27'}</span>
              </p>
            </div>
          </div>

          {/* Acciones de cabecera */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenInstall && (
              <button
                type="button"
                onClick={onOpenInstall}
                title="Instalar en la pantalla de inicio"
                aria-label="Instalar aplicación en la pantalla de inicio"
                className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] text-[#334155] flex items-center justify-center gap-1.5 hover:bg-[#EEF2FF] hover:text-[#4338CA] hover:border-[#C7D2FE] diario-press cursor-pointer text-xs font-semibold"
              >
                <Download className="w-4 h-4 shrink-0" strokeWidth={2} />
                <span className="hidden sm:inline whitespace-nowrap">Instalar app</span>
              </button>
            )}

            <button
              type="button"
              onClick={onToggleFrame}
              title={isMobileFrame ? 'Ampliar ancho de lectura' : 'Vista de lectura compacta'}
              aria-label={isMobileFrame ? 'Ampliar ancho de lectura' : 'Vista de lectura compacta'}
              className="hidden md:flex min-h-[44px] min-w-[44px] rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] text-[#334155] items-center justify-center hover:bg-[#EEF2FF] hover:text-[#4338CA] hover:border-[#C7D2FE] diario-press cursor-pointer"
            >
              {isMobileFrame ? (
                <Monitor className="w-4 h-4" strokeWidth={2} />
              ) : (
                <Smartphone className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* 2. Navegación superior visible en Tablet y Ordenador (evita duplicidad en móvil) */}
        {onTabChange && (
          <nav
            className="hidden md:flex items-center gap-1 pb-2 overflow-x-auto no-scrollbar border-t border-slate-100 pt-2"
            aria-label="Secciones del Diario del Aula"
          >
            {allSections.map((sec) => {
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => onTabChange(sec.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0 select-none diario-press ${
                    isActive
                      ? 'bg-[#EEF2FF] text-[#4338CA]'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <span className={isActive ? 'text-[#4338CA]' : 'text-[#64748B]'}>
                    {sec.icon}
                  </span>
                  <span>{sec.label}</span>
                  {sec.badge !== undefined && sec.badge > 0 && (
                    <span
                      className={`ml-0.5 text-[11px] font-bold tabular-nums min-w-5 h-5 px-1.5 rounded-full inline-flex items-center justify-center ${
                        sec.badgeTone || 'bg-[#FFF1F2] text-[#BE123C]'
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
      </div>
    </header>
  );
};
