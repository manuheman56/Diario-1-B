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

  // UI View Mode (Por defecto ancho cómodo adaptado a tablet/escritorio; conmutable a lectura compacta)
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);

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

  const containerWidthClass = isMobileFrame ? 'max-w-2xl' : 'max-w-5xl';

  return (
    <div className="h-dvh min-h-screen bg-[#F7F8FA] text-[#0F172A] flex flex-col overflow-hidden">
      {/* Toast Alert (posicionado abajo para no solaparse con cabecera ni avisos) */}
      <Toast message={toastMessage} />

      {/* Header ligero y navegación superior en tablet/escritorio */}
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

      {/* Área principal scrollable conservando <main> para scroll-to-top y pull-to-refresh */}
      <main className="flex-1 overflow-y-auto no-scrollbar">
        <div
          className={`w-full ${containerWidthClass} mx-auto px-4 sm:px-6 pt-4 pb-8 space-y-5 transition-all duration-200`}
        >
          {/* Indicador inline de modo sin conexión (sin colisión con Toast ni cabecera) */}
          {!isOnline && (
            <div
              role="status"
              className="bg-[#FEF3C7] border border-amber-300/80 text-[#92400E] px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] font-semibold flex items-center gap-2.5 diario-slide-down"
            >
              <WifiOff className="w-4 h-4 text-[#D97706] shrink-0" />
              <span>
                Modo sin conexión: mostrando la última información guardada en este dispositivo.
              </span>
            </div>
          )}

          {/* Aviso Explícito de Conexión Pendiente (cuando no hay VITE_APPS_SCRIPT_URL) */}
          {isPendingConfig && (
            <div className="diario-card rounded-3xl p-4 sm:p-5 bg-[#FEF3C7]/45 border-amber-200 flex items-start gap-3.5 text-[#0F172A] diario-fade-in">
              <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0 border border-amber-200/80">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h4 className="font-display font-bold text-[#0F172A] text-sm sm:text-base">
                  Conexión segura pendiente de configuración
                </h4>
                <p className="text-[13.5px] text-[#334155] leading-relaxed">
                  La hoja de cálculo oficial de don Manuel Herrera permanece{' '}
                  <strong>100% privada y protegida</strong>. El canal de lectura para las
                  familias se activará al configurar la variable{' '}
                  <code className="font-mono font-semibold bg-[#FEF3C7] text-[#92400E] px-1.5 py-0.5 rounded text-xs">
                    VITE_APPS_SCRIPT_URL
                  </code>
                  .
                </p>
                <div className="pt-1 flex flex-wrap items-center gap-2 text-xs text-[#475569] font-medium">
                  <span>Hoja privada protegida</span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#0D9488] font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Cero datos ficticios</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Esqueleto discreto solo en primera carga sin caché local */}
          {!isPendingConfig &&
            isInitialLoading &&
            posts.length === 0 &&
            avisos.length === 0 &&
            events.length === 0 && (
              <div className="diario-card rounded-3xl p-4 sm:p-5 space-y-3 diario-fade-in">
                <div className="flex items-center gap-2.5 text-sm font-semibold text-[#4338CA]">
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Cargando los últimos contenidos del aula…</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-2/3 rounded-lg bg-slate-200/70" />
                  <div className="h-3 w-full rounded-lg bg-slate-100" />
                  <div className="h-3 w-5/6 rounded-lg bg-slate-100" />
                </div>
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
              <div className="diario-card rounded-3xl p-4 sm:p-5 bg-[#FFF1F2]/60 border-rose-200 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[13.5px] font-medium text-[#0F172A]">
                  No se pudieron cargar los datos en este momento.
                </span>
                <button
                  type="button"
                  onClick={() => syncAllFromSheets(true)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white font-bold text-xs sm:text-[13px] diario-press cursor-pointer"
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
        </div>
      </main>

      {/* Navegación móvil inferior (sin duplicar en tablet/escritorio) */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => navigateToTab(tab, undefined, 'instant')}
        pendingTasksCount={pendingHomeworkCount}
        urgentNoticesCount={urgentNoticesCount}
      />

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
