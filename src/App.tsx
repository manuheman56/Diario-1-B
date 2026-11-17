/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  AppConfig,
  AvisoItem,
  CalendarEvent,
  DiaADiaItem,
  EducationalResource,
  HomeLearningResource,
  MultimediaItem,
  ScheduleItem,
  DayOfWeek,
  MainTabType,
  SubScheduleTab,
  SubResourceTab,
} from './types';
import { initialConfig } from './data/defaultData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { InicioTab } from './components/InicioTab';
import { DiarioTab } from './components/DiarioTab';
import { AvisosTab } from './components/AvisosTab';
import { HorarioCalendarioTab } from './components/HorarioCalendarioTab';
import { MultimediaTab } from './components/MultimediaTab';
import { AprendemosTab } from './components/AprendemosTab';
import { RecursosTab } from './components/RecursosTab';
import { InstallModal } from './components/InstallModal';
import { ExitConfirmModal } from './components/ExitConfirmModal';
import { Toast } from './components/Toast';
import {
  syncAllData,
  sortDiaADiaItems,
  loadCachedSyncData,
  hasAnySyncData,
  SyncResult,
} from './services/sheetsService';
import { isAppsScriptConfigured } from './config/appsScriptConfig';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { useBackNavigation } from './hooks/useBackNavigation';
import { mergePostsWithCompleted } from './utils/taskPersistence';
import { WifiOff, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

const emptySchedule: Record<DayOfWeek, ScheduleItem[]> = {
  Lunes: [],
  Martes: [],
  Miércoles: [],
  Jueves: [],
  Viernes: [],
};

export default function App() {
  const isOnline = useOnlineStatus();
  const configured = isAppsScriptConfigured();

  // Hidratación síncrona inmediata desde `diario_sync_cache_v3` para todas las secciones
  const [initialCache] = useState<SyncResult | null>(() => loadCachedSyncData());

  // Estado que indica si la conexión con Google Apps Script está pendiente de configurar
  const [isPendingConfig, setIsPendingConfig] = useState(!configured);

  // 1. CONFIGURACION: Configuración general del aula
  const [config, setConfig] = useState<AppConfig>(() => ({
    ...initialConfig,
    ...(initialCache?.config || {}),
  }));

  // 2. DIA_A_DIA: Publicaciones diarias (hidrata desde caché unificada o respaldo legacy)
  const [posts, setPosts] = useState<DiaADiaItem[]>(() => {
    if (!configured) return [];
    if (initialCache?.posts && initialCache.posts.length > 0) {
      return mergePostsWithCompleted(initialCache.posts);
    }
    try {
      const saved = localStorage.getItem('diario_posts');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? sortDiaADiaItems(parsed) : [];
    } catch {
      return [];
    }
  });

  // 3. AVISOS: Tablón oficial de comunicaciones y circulares
  const [avisos, setAvisos] = useState<AvisoItem[]>(() =>
    configured ? initialCache?.avisos ?? [] : []
  );

  // 4. HORARIO: Horario semanal lectivo
  const [schedule, setSchedule] = useState<Record<DayOfWeek, ScheduleItem[]>>(() =>
    configured && initialCache?.schedule ? initialCache.schedule : emptySchedule
  );

  // 5. CALENDARIO: Eventos y salidas escolares
  const [events, setEvents] = useState<CalendarEvent[]>(() =>
    configured ? initialCache?.events ?? [] : []
  );

  // 6. MULTIMEDIA: Fotografías y vídeos protegidos
  const [multimedia, setMultimedia] = useState<MultimediaItem[]>(() =>
    configured ? initialCache?.multimedia ?? [] : []
  );

  // 7. APRENDEMOS: Qué trabajamos en clase (Lengua Castellana y Matemáticas)
  const [resources, setResources] = useState<EducationalResource[]>(() =>
    configured ? initialCache?.aprendemos ?? [] : []
  );

  // 8. RECURSOS: Biblioteca educativa para practicar en casa (9.ª Pestaña Oficial)
  const [homeResources, setHomeResources] = useState<HomeLearningResource[]>(() =>
    configured ? initialCache?.recursos ?? [] : []
  );

  // Navigation View States (Las 8 Secciones Oficiales) + Historial PWA / Android Atrás
  const {
    activeTab,
    isInstallOpen,
    isExitModalOpen,
    navigateToTab,
    openInstallModal,
    closeInstallModal,
    stayInApp,
    confirmExit,
  } = useBackNavigation();

  // UI View Mode (Mobile frame vs responsive wide)
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // Background sync, initial loading & error states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(
    () => configured && !hasAnySyncData(initialCache)
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncSeqRef = useRef(0);
  const hasLiveSyncRef = useRef(false);
  const autoRetryDoneRef = useRef(false);
  const autoRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  }, []);

  // Guardar estado del checklist de tareas en LocalStorage solo cuando hay posts reales
  useEffect(() => {
    if (posts.length > 0) {
      try {
        localStorage.setItem('diario_posts', JSON.stringify(posts));
      } catch {
        // Ignorar fallo de almacenamiento
      }
    }
  }, [posts]);

  const applySyncResultToState = useCallback((syncResult: SyncResult) => {
    if (syncResult.config && Object.keys(syncResult.config).length > 0) {
      setConfig((prev) => ({ ...prev, ...syncResult.config }));
    }

    setPosts((prevPosts) => mergePostsWithCompleted(syncResult.posts, prevPosts));
    setAvisos(syncResult.avisos);
    setEvents(syncResult.events);
    if (syncResult.schedule) {
      setSchedule(syncResult.schedule);
    }
    setMultimedia(syncResult.multimedia);
    setResources(syncResult.aprendemos);
    setHomeResources(syncResult.recursos);
  }, []);

  // Sincronizador Central Exclusivo con Google Apps Script (Sin acceso directo a Sheets)
  const syncAllFromSheets = useCallback(
    async (isManualPull = false) => {
      if (!isAppsScriptConfigured()) {
        setIsPendingConfig(true);
        setIsInitialLoading(false);
        setIsSyncing(false);
        setSyncError(null);
        if (isManualPull) {
          showToast('Conexión pendiente: Configura la URL de Google Apps Script en VITE_APPS_SCRIPT_URL');
        }
        return;
      }

      if (autoRetryTimerRef.current !== null) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }

      const requestSeq = ++syncSeqRef.current;
      setIsSyncing(true);

      try {
        const syncResult = await syncAllData(isManualPull);

        // Descartar respuesta si se inició otra petición posterior
        if (requestSeq !== syncSeqRef.current) {
          return;
        }

        if (syncResult.isPendingConfig) {
          setIsPendingConfig(true);
          setSyncError(null);
          if (isManualPull) {
            showToast('Conexión pendiente de configuración');
          }
          return;
        }

        setIsPendingConfig(false);

        if (syncResult.source === 'apps-script') {
          hasLiveSyncRef.current = true;
          autoRetryDoneRef.current = false;
          setSyncError(null);
          applySyncResultToState(syncResult);

          if (isManualPull) {
            showToast('Sincronizado en tiempo real vía Google Apps Script');
          }
          return;
        }

        if (syncResult.source === 'cache') {
          // Solo aplicar caché si aún no se han recibido datos en vivo en esta sesión
          if (!hasLiveSyncRef.current) {
            applySyncResultToState(syncResult);
          }

          if (syncResult.fromFallback && syncResult.errorMessage) {
            setSyncError(syncResult.errorMessage);
            if (isManualPull) {
              showToast('Sin conexión nueva: mostrando los últimos datos guardados');
            } else if (!autoRetryDoneRef.current && typeof navigator !== 'undefined' && navigator.onLine) {
              autoRetryDoneRef.current = true;
              autoRetryTimerRef.current = setTimeout(() => {
                syncAllFromSheets(false);
              }, 3500);
            }
          } else {
            setSyncError(null);
            if (isManualPull) {
              showToast('Datos cargados desde la memoria local protegida');
            }
          }
          return;
        }

        // Error sin caché disponible: nunca sobreescribir datos válidos previos
        setSyncError(syncResult.errorMessage || 'No se pudo conectar con Google Apps Script');
        if (isManualPull) {
          showToast('No se pudo conectar con Google Apps Script');
        } else if (!autoRetryDoneRef.current && typeof navigator !== 'undefined' && navigator.onLine) {
          autoRetryDoneRef.current = true;
          autoRetryTimerRef.current = setTimeout(() => {
            syncAllFromSheets(false);
          }, 3500);
        }
      } catch {
        if (requestSeq !== syncSeqRef.current) {
          return;
        }
        setSyncError('No se pudo conectar con Google Apps Script');
        if (isManualPull) {
          showToast('No se pudo conectar con Google Apps Script');
        }
      } finally {
        if (requestSeq === syncSeqRef.current) {
          setIsSyncing(false);
          setIsInitialLoading(false);
        }
      }
    },
    [applySyncResultToState, showToast]
  );

  // Sincronización inicial no bloqueante
  useEffect(() => {
    if (isAppsScriptConfigured()) {
      syncAllFromSheets(false);
    }
    return () => {
      if (autoRetryTimerRef.current !== null) {
        clearTimeout(autoRetryTimerRef.current);
        autoRetryTimerRef.current = null;
      }
    };
  }, [syncAllFromSheets]);

  // Recuperación automática cuando vuelve la conexión (offline -> online) o se reabre la PWA
  const prevOnlineRef = useRef(isOnline);
  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;
    if (!isAppsScriptConfigured()) return;
    if (wasOffline && isOnline) {
      autoRetryDoneRef.current = false;
      syncAllFromSheets(false);
    }
  }, [isOnline, syncAllFromSheets]);

  useEffect(() => {
    if (!isAppsScriptConfigured() || typeof document === 'undefined') return;
    const handleVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        navigator.onLine &&
        !hasLiveSyncRef.current
      ) {
        syncAllFromSheets(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncAllFromSheets]);

  // Homework check toggle
  const handleToggleTask = (id: string) => {
    setPosts((prev) =>
      prev.map((p) => {
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

  const handleSharePost = (item: { title: string; content: string }) => {
    const textToShare = `${item.title}\n\n${item.content}\n\n— Publicado en ${config.classTitle} (${config.schoolName})`;
    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text: textToShare,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(textToShare);
      showToast('Texto copiado al portapapeles para compartir');
    }
  };

  // Direct navigation handler
  const handleNavigate = (
    tab: MainTabType,
    subTab?: SubScheduleTab | SubResourceTab
  ) => {
    navigateToTab(tab, subTab, 'smooth');
  };

  const pendingHomeworkCount = posts.filter(
    (p) => p.tag === 'Tarea' && !p.completed
  ).length;

  const urgentNoticesCount =
    avisos.filter((a) => a.important || a.tipo?.toLowerCase().includes('urgente')).length ||
    posts.filter((p) => p.important || p.tag === 'Urgente').length;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-0 sm:p-4 text-slate-800">
      {/* Toast Alert */}
      <Toast message={toastMessage} />

      {/* Offline Alert Badge */}
      {!isOnline && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 border border-amber-400 animate-in fade-in">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Modo sin conexión</span>
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
        {/* Header con título del colegio y curso escolar */}
        <Header
          config={config}
          onOpenInstall={openInstallModal}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(!isMobileFrame)}
          activeTab={activeTab}
          onTabChange={(tab) => navigateToTab(tab, undefined, 'smooth')}
          pendingTasksCount={pendingHomeworkCount}
          urgentNoticesCount={urgentNoticesCount}
        />

        {/* Scrollable Main Content Area para las 8 secciones oficiales */}
        <main className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-4">
          {/* Aviso Explícito de Conexión Pendiente (cuando no hay VITE_APPS_SCRIPT_URL) */}
          {isPendingConfig && (
            <div className="bg-amber-50/95 border border-amber-300/80 rounded-3xl p-4.5 shadow-xs flex items-start gap-3.5 text-amber-950 animate-in fade-in duration-300">
              <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <h4 className="font-display font-bold text-slate-900 text-sm">
                  Conexión segura pendiente de configuración
                </h4>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  La hoja de cálculo oficial de don Manuel Herrera permanece <strong>100% privada y protegida</strong>.
                  El canal de lectura para las familias se activará automáticamente al introducir la URL del intermediario en la variable <code className="font-mono font-bold bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">VITE_APPS_SCRIPT_URL</code>.
                </p>
                <div className="pt-1.5 flex items-center gap-3 text-[10px] text-amber-800 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span>Hoja privada protegida</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Cero datos ficticios</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Indicador discreto solo en primera carga sin caché local */}
          {!isPendingConfig &&
            isInitialLoading &&
            posts.length === 0 &&
            avisos.length === 0 &&
            events.length === 0 && (
              <div className="bg-indigo-50/90 border border-indigo-200/80 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-indigo-900">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />
                <span className="font-medium">Cargando los últimos contenidos del aula…</span>
              </div>
            )}

          {/* Aviso discreto con reintento si falla la carga inicial y aún no hay caché */}
          {!isPendingConfig &&
            !isInitialLoading &&
            !isSyncing &&
            syncError &&
            posts.length === 0 &&
            avisos.length === 0 &&
            events.length === 0 && (
              <div className="bg-amber-50/95 border border-amber-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-950">
                <span className="font-medium">
                  No se pudieron cargar los datos en este momento.
                </span>
                <button
                  type="button"
                  onClick={() => syncAllFromSheets(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shrink-0 cursor-pointer"
                >
                  Reintentar
                </button>
              </div>
            )}

          {/* 1. Inicio */}
          {activeTab === 'inicio' && (
            <InicioTab
              config={config}
              posts={posts}
              events={events}
              avisos={avisos}
              onNavigate={handleNavigate}
              onRefresh={() => syncAllFromSheets(true)}
              isRefreshing={isSyncing}
            />
          )}

          {/* 2. Día a Día */}
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

          {/* 3. Calendario */}
          {activeTab === 'calendario' && (
            <HorarioCalendarioTab
              schedule={schedule}
              events={events}
              initialSubView="calendario"
            />
          )}

          {/* 4. Horario */}
          {activeTab === 'horario' && (
            <HorarioCalendarioTab
              schedule={schedule}
              events={events}
              initialSubView="horario"
            />
          )}

          {/* 5. Fotografías y Vídeos */}
          {activeTab === 'multimedia' && (
            <MultimediaTab
              config={config}
              items={multimedia}
            />
          )}

          {/* 6. Aprendemos (Qué trabajamos en clase) */}
          {activeTab === 'aprendemos' && (
            <AprendemosTab
              resources={resources}
            />
          )}

          {/* 7. Recursos (Biblioteca para practicar en casa) */}
          {activeTab === 'recursos' && (
            <RecursosTab
              resources={homeResources}
            />
          )}

          {/* 8. Avisos */}
          {activeTab === 'avisos' && (
            <AvisosTab
              avisos={avisos}
              posts={posts}
              onSharePost={handleSharePost}
              isRefreshing={isSyncing}
              onRefresh={() => syncAllFromSheets(true)}
            />
          )}
        </main>

        {/* Bottom Navigation con 5 accesos directos y corrección táctil integral */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={(tab) => navigateToTab(tab, undefined, 'instant')}
          pendingTasksCount={pendingHomeworkCount}
          urgentNoticesCount={urgentNoticesCount}
        />
      </div>

      {/* Modal de instalación */}
      <InstallModal
        isOpen={isInstallOpen}
        onClose={closeInstallModal}
      />

      {/* Confirmación discreta al pulsar Atrás desde Inicio */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        onStay={stayInApp}
        onExit={confirmExit}
      />
    </div>
  );
}
