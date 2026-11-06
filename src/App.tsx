/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  CalendarEvent,
  Notice,
  PostItem,
  ScheduleItem,
  TutoriaRequest,
} from './types';
import {
  initialConfig,
  initialPosts,
  weeklySchedule,
  schoolEvents,
  sampleTutorias,
} from './data/defaultData';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { DiarioTab } from './components/DiarioTab';
import { HorarioCalendarioTab } from './components/HorarioCalendarioTab';
import { MultimediaTab } from './components/MultimediaTab';
import { ServiciosTab } from './components/ServiciosTab';
import { NewPostModal } from './components/NewPostModal';
import { SettingsModal } from './components/SettingsModal';
import { InstallModal } from './components/InstallModal';
import { MenuPdfModal } from './components/MenuPdfModal';
import { PinModal } from './components/PinModal';
import { Toast } from './components/Toast';
import { fetchNoticesFromSheets } from './services/sheetsService';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // App Persistent State
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('diario_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialConfig,
        ...parsed,
        teacherPin: parsed.teacherPin || '1234',
        sheetsUrl: parsed.sheetsUrl ?? '',
      };
    }
    return initialConfig;
  });

  const [posts, setPosts] = useState<Notice[]>(() => {
    const saved = localStorage.getItem('diario_posts');
    return saved ? JSON.parse(saved) : initialPosts;
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('diario_events');
    return saved ? JSON.parse(saved) : schoolEvents;
  });

  const [tutorias, setTutorias] = useState<TutoriaRequest[]>(() => {
    const saved = localStorage.getItem('diario_tutorias');
    return saved ? JSON.parse(saved) : sampleTutorias;
  });

  // UI View States
  const [activeTab, setActiveTab] = useState<TabType>('diario');
  const [role, setRole] = useState<'family' | 'teacher'>('family');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);
  const [showPwaBanner, setShowPwaBanner] = useState<boolean>(true);

  // Modals
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [isMenuPdfOpen, setIsMenuPdfOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Google Sheets state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('diario_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('diario_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('diario_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('diario_tutorias', JSON.stringify(tutorias));
  }, [tutorias]);

  // Google Sheets Synchronizer
  const syncWithSheets = useCallback(
    async (url: string, showSuccessToast = false) => {
      if (!url || !url.trim()) {
        setSheetsError(null);
        return;
      }

      setIsSyncingSheets(true);
      setSheetsError(null);

      try {
        const fetchedNotices = await fetchNoticesFromSheets(url);
        // Retain completion status of any matching homework tasks
        const localTasksCompleted = new Set(
          posts.filter((p) => p.completed).map((p) => p.title.toLowerCase().trim())
        );

        const mergedNotices: Notice[] = fetchedNotices.map((n) => ({
          ...n,
          completed: localTasksCompleted.has(n.title.toLowerCase().trim()),
        }));

        setPosts(mergedNotices);
        if (showSuccessToast) {
          showToast(`¡Avisos sincronizados con éxito desde Google Sheets (${mergedNotices.length})!`);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al sincronizar con Google Sheets';
        setSheetsError(message);
        // Fallback to local notices from storage
        const saved = localStorage.getItem('diario_posts');
        if (saved) {
          setPosts(JSON.parse(saved));
        }
        if (showSuccessToast) {
          showToast('No se pudo descargar la hoja. Mostrando avisos guardados en memoria.');
        }
      } finally {
        setIsSyncingSheets(false);
      }
    },
    [posts]
  );

  // Initial fetch from sheets on mount if URL configured
  useEffect(() => {
    if (config.sheetsUrl && config.sheetsUrl.trim()) {
      syncWithSheets(config.sheetsUrl, false);
    }
  }, [config.sheetsUrl, syncWithSheets]);

  // Role toggle with PIN protection (Requisito 1)
  const handleToggleRole = () => {
    if (role === 'family') {
      // Switching to teacher requires entering PIN
      setIsPinModalOpen(true);
    } else {
      // Switching from teacher back to family is immediate
      setRole('family');
      setIsSettingsOpen(false); // Auto-close settings modal on returning to Family mode
      setIsNewPostOpen(false);   // Auto-close new post modal
      showToast('Modo Familia activado');
    }
  };

  const handlePinSuccess = () => {
    setRole('teacher');
    showToast('¡Modo Docente desbloqueado!');
  };

  // Safe Settings opener - restricted to teacher role
  const handleOpenSettings = () => {
    if (role === 'teacher') {
      setIsSettingsOpen(true);
    } else {
      setIsPinModalOpen(true);
      showToast('Introduce tu PIN de docente para acceder a los ajustes');
    }
  };

  // New post opener (checks teacher authorization)
  const handleOpenNewPost = () => {
    if (role === 'teacher') {
      setIsNewPostOpen(true);
    } else {
      // Prompt for PIN to enter teacher mode and publish
      setIsPinModalOpen(true);
      showToast('Introduce tu PIN de docente para publicar un aviso');
    }
  };

  // Handlers for posts
  const handleSavePost = (newPostData: Omit<Notice, 'id' | 'timestamp'>) => {
    const newPost: Notice = {
      ...newPostData,
      id: `post-${Date.now()}`,
      timestamp: Date.now(),
      source: 'local',
    };
    setPosts([newPost, ...posts]);
    showToast('Aviso publicado correctamente en el diario');
  };

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

  const handleDeletePost = (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este aviso del diario?')) {
      setPosts(posts.filter((p) => p.id !== id));
      showToast('Aviso eliminado del diario');
    }
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

  // Tutoria handlers
  const handleAddTutoria = (
    req: Omit<TutoriaRequest, 'id' | 'createdAt' | 'status'>
  ) => {
    const newReq: TutoriaRequest = {
      ...req,
      id: `tut-${Date.now()}`,
      status: 'pendiente',
      createdAt: new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'short',
      }).format(new Date()),
    };
    setTutorias([newReq, ...tutorias]);
    showToast('Solicitud de tutoría enviada a la docente');
  };

  const handleUpdateTutoriaStatus = (
    id: string,
    status: 'pendiente' | 'confirmada' | 'atendida'
  ) => {
    setTutorias(
      tutorias.map((t) => (t.id === id ? { ...t, status } : t))
    );
    showToast(
      status === 'confirmada' ? 'Tutoría confirmada' : 'Estado actualizado'
    );
  };

  // Restore defaults
  const handleRestoreDefaults = () => {
    if (
      window.confirm(
        '¿Restablecer todos los avisos, configuración y datos de ejemplo iniciales?'
      )
    ) {
      localStorage.removeItem('diario_config');
      localStorage.removeItem('diario_posts');
      localStorage.removeItem('diario_events');
      localStorage.removeItem('diario_tutorias');
      setConfig(initialConfig);
      setPosts(initialPosts);
      setEvents(schoolEvents);
      setTutorias(sampleTutorias);
      showToast('Datos de ejemplo restaurados');
    }
  };

  const pendingHomeworkCount = posts.filter(
    (p) => p.tag === 'Tarea' && !p.completed
  ).length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-0 sm:p-4 text-slate-800">
      {/* Toast Alert */}
      <Toast message={toastMessage} />

      {/* Offline Alert Badge (Requisito 4) */}
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
        {/* Header */}
        <Header
          config={config}
          onOpenSettings={handleOpenSettings}
          onOpenInstall={() => setIsInstallOpen(true)}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          role={role}
          onToggleRole={handleToggleRole}
          showPwaBanner={showPwaBanner}
          onDismissPwaBanner={() => setShowPwaBanner(false)}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
          {activeTab === 'diario' && (
            <DiarioTab
              posts={posts}
              onOpenNewPost={handleOpenNewPost}
              onToggleTask={handleToggleTask}
              onDeletePost={handleDeletePost}
              onSharePost={handleSharePost}
              role={role}
              sheetsUrl={config.sheetsUrl}
              isSyncingSheets={isSyncingSheets}
              onRefreshSheets={() => syncWithSheets(config.sheetsUrl, true)}
              sheetsError={sheetsError}
              onOpenSettings={handleOpenSettings}
            />
          )}

          {activeTab === 'horario' && (
            <HorarioCalendarioTab
              schedule={weeklySchedule}
              events={events}
              role={role}
            />
          )}

          {activeTab === 'multimedia' && (
            <MultimediaTab
              config={config}
            />
          )}

          {activeTab === 'servicios' && (
            <ServiciosTab
              config={config}
              tutorias={tutorias}
              onAddTutoria={handleAddTutoria}
              onUpdateTutoriaStatus={handleUpdateTutoriaStatus}
              onOpenMenuPdf={() => setIsMenuPdfOpen(true)}
              role={role}
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

      {/* Modals */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        correctPin={config.teacherPin || '1234'}
      />

      <NewPostModal
        isOpen={isNewPostOpen}
        onClose={() => setIsNewPostOpen(false)}
        onSavePost={handleSavePost}
        authorName={config.teacherName}
      />

      <SettingsModal
        isOpen={isSettingsOpen && role === 'teacher'}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={(newConfig) => {
          setConfig(newConfig);
          showToast('Configuración del aula guardada con éxito');
          if (newConfig.sheetsUrl && newConfig.sheetsUrl !== config.sheetsUrl) {
            syncWithSheets(newConfig.sheetsUrl, true);
          }
        }}
        onRestoreDefaults={handleRestoreDefaults}
      />

      <InstallModal
        isOpen={isInstallOpen}
        onClose={() => setIsInstallOpen(false)}
      />

      <MenuPdfModal
        isOpen={isMenuPdfOpen}
        onClose={() => setIsMenuPdfOpen(false)}
        onDownloadToast={() =>
          showToast('Descargando copia del Menú Escolar en PDF...')
        }
      />
    </div>
  );
}
