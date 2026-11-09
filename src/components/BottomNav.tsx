import React from 'react';
import {
  Sparkles,
  BookOpen,
  Bell,
  Clock,
  GraduationCap,
} from 'lucide-react';
import { MainTabType } from '../types';

export type TabType = MainTabType;

interface BottomNavProps {
  activeTab: MainTabType;
  onTabChange: (tab: MainTabType) => void;
  pendingTasksCount?: number;
  urgentNoticesCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  pendingTasksCount = 0,
  urgentNoticesCount = 0,
}) => {
  const tabs: {
    id: MainTabType;
    label: string;
    icon: React.ReactNode;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      id: 'diario',
      label: 'Día a Día',
      icon: <BookOpen className="w-5 h-5" />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'avisos',
      label: 'Avisos',
      icon: <Bell className="w-5 h-5" />,
      badge: urgentNoticesCount > 0 ? urgentNoticesCount : undefined,
      badgeColor: 'bg-rose-500 animate-pulse',
    },
    {
      id: 'horario',
      label: 'Horario',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      id: 'recursos',
      label: 'Recursos',
      icon: <GraduationCap className="w-5 h-5" />,
    },
  ];

  return (
    <nav
      className="sticky bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-1.5 pt-1.5 pb-[max(env(safe-area-inset-bottom),0.5rem)] shadow-lg pointer-events-auto"
      role="tablist"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch justify-between w-full max-w-lg mx-auto gap-0.5 sm:gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 min-w-0 min-h-[52px] flex flex-col items-center justify-center py-1 px-0.5 rounded-2xl transition-all duration-150 cursor-pointer select-none touch-manipulation active:scale-95 ${
                isActive
                  ? 'text-indigo-600 font-extrabold bg-indigo-50/70 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <div className="relative flex items-center justify-center">
                {tab.icon}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 text-white text-[9px] font-black min-w-4 h-4 px-1 rounded-full flex items-center justify-center ring-2 ring-white shadow-xs ${
                      tab.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight truncate w-full text-center leading-none">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
