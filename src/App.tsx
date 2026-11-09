/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  CalendarEvent,
  Notice,
  ScheduleItem,
  DayOfWeek,
} from './types';
import {
  initialConfig,
  initialPosts,
  weeklySchedule,
  schoolEvents,
} from './data/defaultData';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DiarioTab } from './components/DiarioTab';
import { HorarioCalendarioTab } from './components/HorarioCalendarioTab';
import { MultimediaTab } from './components/MultimediaTab';
import { InstallModal } from './components/InstallModal';
import { Toast } from './components/Toast';
import {
  fetchNoticesFromSheets,
  fetchScheduleFromSheets,
  fetchCalendarFromSheets,
} from './services/sheetsService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // App Fixed State
  const [config] = useState<AppConfig>(initialConfig);

  // Tablón de avisos (conserva el estado local del checklist de tareas familiares)
  const [posts, setPosts] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('diario_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  // Horario y Calendario: CERO almacenamiento local (localStorage).
  // Se actualizan automáticamente en tiempo real desde las pestañas 'Horario' y 'Calendario' de Google Sheets.
  const [schedule, setSchedule] = useState<Record<DayOfWeek, ScheduleItem[]>>(weeklySchedule);
  const [events, setEvents] = useState<CalendarEvent[]>(schoolEvents);

  // UI View States
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);

  // Modal de instalación PWA
  const [isInstallOpen, setIsInstallOpen] = useState(false);

  // Background sync state (silent, no infinite loop)
  const [isSyncing, setIsSyncing] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync state de avisos y checklist familiar a LocalStorage
  useEffect(() => {
    localStorage.setItem('diario_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('diario_posts', JSON.stringify(posts));
  }, [posts]);

  // Transparent Background Synchronizer - Sincroniza Avisos, Horario y Calendario desde Google Sheets
  const syncAllFromSheets = useCallback(async (isManualPull = false) => {
    setIsSyncing(true);
    try {
      const [fetchedNotices, fetchedSchedule, fetchedEvents] = await Promise.all([
        fetchNoticesFromSheets(),
        fetchScheduleFromSheets(),
        fetchCalendarFromSheets(),
      ]);

      // 1. Actualizar avisos preservando el checklist interactivo de deberes completados
      if (fetchedNotices && fetchedNotices.length > 0) {
        setPosts((prevPosts) => {
          const localTasksCompleted = new Set(
            prevPosts
              .filter((p) => p.completed)
              .map((p) => p.title.toLowerCase().trim())
          );

          return fetchedNotices.map((n) => ({
            ...n,
            completed: localTasksCompleted.has(n.title.toLowerCase().trim()),
          }));
        });
      } else {
        setPosts((prev) => (prev.length > 0 ? prev : []));
      }

      // 2. Actualizar Horario directamente desde la pestaña 'Horario' (cero localStorage)
      if (fetchedSchedule) {
        setSchedule(fetchedSchedule);
      }

      // 3. Actualizar Calendario directamente desde la pestaña 'Calendario' (cero localStorage)
      if (fetchedEvents && fetchedEvents.length > 0) {
        setEvents(fetchedEvents);
      }

      if (isManualPull) {
        showToast('Datos escolares actualizados desde la nube');
      }
    } catch {
      if (isManualPull) {
        showToast('No se pudo actualizar en este momento');
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial silent background sync on app launch
  useEffect(() => {
    syncAllFromSheets(false);
  }, [syncAllFromSheets]);

  // Homework check toggle (checklist familiar)
  const handleToggleTask = (id: string) => {
    setPosts(
      posts.map((p) => {
        if (p.id === id) {
          const updated = !p.completed;
          showToast(
            updated
              ? '¡Tarea marcada como completada!'
              : 'Tarea marcada como pendiente'
          );
          return { ...p, completed: updated };
        }
        return p;
      })
    );
  };

  const handleSharePost = (post: Notice) => {
    const textToShare = `${post.title}\n\n${post.content}\n\n— Publicado en ${config.classTitle} (${config.schoolName})`;
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: textToShare,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(textToShare);
      showToast('Texto copiado al portapapeles para compartir');
    }
  };

  const pendingHomeworkCount = posts.filter(
    (p) => p.tag === 'Tarea' && !p.completed
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-0 sm:p-4 text-slate-800">
      {/* Toast Alert */}
      <Toast message={toastMessage} />

      {/* Offline Alert Badge */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 border border-amber-400 animate-in fade-in">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo sin conexión — Mostrando datos guardados</span>
        </div>
      )}

      {/* Main Container - Mobile Frame or Fullscreen View */}
      <div
        className={`w-full bg-slate-50 min-h-screen flex flex-col overflow-hidden relative shadow-2xl transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md sm:min-h-[850px] sm:max-h-[920px] sm:rounded-[2.5rem] border border-slate-700/60 ring-8 ring-slate-800/40'
            : 'max-w-4xl sm:min-h-[900px] sm:rounded-3xl border border-slate-700/60'
        }`}
      >
        {/* Header con título del colegio y curso 2026/27 */}
        <Header
          config={config}
          onOpenInstall={() => setIsInstallOpen(true)}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          showPwaBanner={showPwaBanner}
          onDismissPwaBanner={() => setShowPwaBanner(false)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
          {activeTab === 'diario' && (
            <DiarioTab
              posts={posts}
              onToggleTask={handleToggleTask}
              onSharePost={handleSharePost}
              isRefreshing={isSyncing}
              onRefresh={() => syncAllFromSheets(true)}
              config={config}
            />
          )}

          {activeTab === 'horario' && (
            <HorarioCalendarioTab
              schedule={schedule}
              events={events}
            />
          )}

          {activeTab === 'multimedia' && (
            <MultimediaTab
              config={config}
            />
          )}
        </main>

        {/* Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          pendingTasksCount={pendingHomeworkCount}
        />
      </div>

      {/* Modal de instalación */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />
    </div>
  );
}
