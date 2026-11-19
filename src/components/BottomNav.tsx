import React, { useEffect, useState } from 'react';
import {
  Home,
  BookOpen,
  Bell,
  Calendar,
  LayoutGrid,
  Clock,
  Film,
  School,
  GraduationCap,
  X,
  ChevronRight,
} from 'lucide-react';
import { MainTabType } from '../types';
import { UnreadCountsBySection } from '../utils/readStatusService';

export type TabType = MainTabType;

interface BottomNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  pendingTasksCount?: number;
  urgentNoticesCount?: number;
  unreadCounts?: UnreadCountsBySection;
}

interface SectionDirectoryItem {
  id: MainTabType;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  badge?: number;
  badgeClass?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  unreadCounts,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const diarioUnread = unreadCounts?.diario ?? 0;
  const avisosUnread = unreadCounts?.avisos ?? 0;
  const calendarioUnread = unreadCounts?.calendario ?? 0;
  const multimediaUnread = unreadCounts?.multimedia ?? 0;
  const aprendemosUnread = unreadCounts?.aprendemos ?? 0;
  const recursosUnread = unreadCounts?.recursos ?? 0;
  const secondaryUnreadTotal = multimediaUnread + aprendemosUnread + recursosUnread;

  useEffect(() => {
    if (!isDrawerOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Al cambiar de pestaña externa (ej. botón Atrás), cerrar el panel si estaba abierto
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [activeTab]);

  const secondarySections: MainTabType[] = ['horario', 'multimedia', 'aprendemos', 'recursos'];
  const isSecondaryActive = secondarySections.includes(activeTab);

  const primaryTabs: {
    id: MainTabType;
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: <Home className="w-5 h-5" strokeWidth={activeTab === 'inicio' ? 2.2 : 1.85} />,
      isActive: activeTab === 'inicio',
    },
    {
      id: 'diario',
      label: 'Día a Día',
      icon: <BookOpen className="w-5 h-5" strokeWidth={activeTab === 'diario' ? 2.2 : 1.85} />,
      isActive: activeTab === 'diario',
      badge: diarioUnread > 0 ? diarioUnread : undefined,
      badgeColor: 'bg-[#4338CA]',
    },
    {
      id: 'avisos',
      label: 'Avisos',
      icon: <Bell className="w-5 h-5" strokeWidth={activeTab === 'avisos' ? 2.2 : 1.85} />,
      isActive: activeTab === 'avisos',
      badge: avisosUnread > 0 ? avisosUnread : undefined,
      badgeColor: 'bg-[#E11D48]',
    },
    {
      id: 'calendario',
      label: 'Calendario',
      icon: <Calendar className="w-5 h-5" strokeWidth={activeTab === 'calendario' ? 2.2 : 1.85} />,
      isActive: activeTab === 'calendario',
      badge: calendarioUnread > 0 ? calendarioUnread : undefined,
      badgeColor: 'bg-[#D97706]',
    },
  ];

  const allSectionsDirectory: SectionDirectoryItem[] = [
    {
      id: 'horario',
      label: 'Horario semanal',
      subtitle: 'Sesiones de lunes a viernes y apoyos',
      icon: <Clock className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
    },
    {
      id: 'multimedia',
      label: 'Fotos y vídeos',
      subtitle: 'Álbumes en Google Drive y canal de YouTube',
      icon: <Film className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#EEF2FF] text-[#4338CA] border border-indigo-200/80',
      badge: multimediaUnread > 0 ? multimediaUnread : undefined,
      badgeClass: 'bg-[#EEF2FF] text-[#4338CA]',
    },
    {
      id: 'aprendemos',
      label: 'Aprendemos',
      subtitle: 'Contenidos de clase y pautas para acompañar',
      icon: <School className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#F5F3FF] text-[#7C3AED] border border-violet-200/80',
      badge: aprendemosUnread > 0 ? aprendemosUnread : undefined,
      badgeClass: 'bg-[#F5F3FF] text-[#6D28D9]',
    },
    {
      id: 'recursos',
      label: 'Recursos en casa',
      subtitle: 'Juegos interactivos, fichas PDF y orientación',
      icon: <GraduationCap className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/80',
      badge: recursosUnread > 0 ? recursosUnread : undefined,
      badgeClass: 'bg-[#F0FDFA] text-[#0F766E]',
    },
    {
      id: 'inicio',
      label: 'Inicio',
      subtitle: 'Resumen general de la clase',
      icon: <Home className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#F1F5F9] text-[#334155] border border-slate-200',
    },
    {
      id: 'diario',
      label: 'Día a Día',
      subtitle: 'Novedades, actividades y tareas del hogar',
      icon: <BookOpen className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#EEF2FF] text-[#4338CA] border border-indigo-200/80',
      badge: diarioUnread > 0 ? diarioUnread : undefined,
      badgeClass: 'bg-[#EEF2FF] text-[#4338CA]',
    },
    {
      id: 'avisos',
      label: 'Avisos y circulares',
      subtitle: 'Comunicaciones oficiales y fechas límite',
      icon: <Bell className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#FFF1F2] text-[#E11D48] border border-rose-200/80',
      badge: avisosUnread > 0 ? avisosUnread : undefined,
      badgeClass: 'bg-[#FFF1F2] text-[#BE123C]',
    },
    {
      id: 'calendario',
      label: 'Calendario escolar',
      subtitle: 'Eventos, salidas, festivos y evaluaciones',
      icon: <Calendar className="w-5 h-5" strokeWidth={1.9} />,
      iconBg: 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/80',
      badge: calendarioUnread > 0 ? calendarioUnread : undefined,
      badgeClass: 'bg-[#FEF3C7] text-[#92400E]',
    },
  ];

  return (
    <>
      {/* Menú completo de secciones para móvil (sin conmutaciones ocultas ni accesos ambiguos) */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-sections-title"
          className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-end justify-center diario-fade-in"
          onClick={() => setIsDrawerOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl border-t border-[#E2E8F0] shadow-2xl px-4 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)] max-h-[82dvh] flex flex-col diario-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div>
                <h3
                  id="mobile-sections-title"
                  className="font-display font-bold text-[#0F172A] text-base"
                >
                  Todas las secciones
                </h3>
                <p className="text-xs text-[#475569]">
                  Acceso directo a las 8 áreas de 1.º B
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                aria-label="Cerrar menú de secciones"
                className="min-w-[44px] min-h-[44px] rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center cursor-pointer diario-press"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar py-2 space-y-1.5">
              {allSectionsDirectory.map((sec) => {
                const isSelected = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onTabChange(sec.id);
                    }}
                    className={`w-full min-h-[54px] px-3 py-2.5 rounded-2xl border text-left flex items-center gap-3 cursor-pointer diario-press ${
                      isSelected
                        ? 'bg-[#EEF2FF] border-[#C7D2FE]'
                        : 'bg-white border-transparent hover:bg-[#F7F8FA] hover:border-[#E2E8F0]'
                    }`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${sec.iconBg}`}
                    >
                      {sec.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-display font-semibold text-[15px] truncate ${
                            isSelected ? 'text-[#4338CA]' : 'text-[#0F172A]'
                          }`}
                        >
                          {sec.label}
                        </span>
                        {sec.badge !== undefined && sec.badge > 0 && (
                          <span
                            className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
                              sec.badgeClass || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sec.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#475569] truncate">
                        {sec.subtitle}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#4338CA]' : 'text-[#64748B]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barra inferior fija exclusiva de móvil */}
      <nav
        className="md:hidden shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-1.5 pt-1.5 safe-bottom shadow-[0_-4px_16px_rgba(15,23,42,0.04)]"
        role="tablist"
        aria-label="Navegación principal móvil"
      >
        <div className="grid grid-cols-5 items-stretch w-full max-w-lg mx-auto gap-1">
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.isActive}
              onClick={() => {
                setIsDrawerOpen(false);
                onTabChange(tab.id);
              }}
              className={`min-w-0 min-h-[50px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl cursor-pointer select-none touch-manipulation diario-press ${
                tab.isActive
                  ? 'text-[#4338CA] bg-[#EEF2FF] font-bold'
                  : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F7F8FA] font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-white text-[10px] font-bold tabular-nums min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white ${
                      tab.badgeColor || 'bg-[#E11D48]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate w-full text-center leading-none">
                {tab.label}
              </span>
            </button>
          ))}

          {/* Botón 5: Menú explícito para todas las secciones */}
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isDrawerOpen}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className={`min-w-0 min-h-[50px] flex flex-col items-center justify-center py-1 px-1 rounded-2xl cursor-pointer select-none touch-manipulation diario-press ${
              isDrawerOpen || isSecondaryActive
                ? 'text-[#4338CA] bg-[#EEF2FF] font-bold'
                : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F7F8FA] font-medium'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <LayoutGrid
                className="w-5 h-5"
                strokeWidth={isDrawerOpen || isSecondaryActive ? 2.2 : 1.85}
              />
              {secondaryUnreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-2.5 text-white text-[10px] font-bold tabular-nums min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white bg-[#4338CA]">
                  {secondaryUnreadTotal}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight truncate w-full text-center leading-none">
              Secciones
            </span>
          </button>
        </div>
      </nav>
    </>
  );
};
