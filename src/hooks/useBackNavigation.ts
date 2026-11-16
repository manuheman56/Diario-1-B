import { useEffect, useRef, useState, useCallback } from 'react';
import { MainTabType, SubResourceTab, SubScheduleTab } from '../types';

export type HistoryEntryRole = 'sentinel' | 'app' | 'tab' | 'modal';

export interface DiarioHistoryState {
  __diarioNav: true;
  role: HistoryEntryRole;
  tab: MainTabType;
  depth: number;
}

export interface BackNavSnapshot {
  activeTab: MainTabType;
  isInstallOpen: boolean;
  isExitModalOpen: boolean;
  currentDepth: number;
  currentRole: HistoryEntryRole;
}

export interface HistoryLike {
  readonly state: unknown;
  readonly length?: number;
  replaceState(data: unknown, unused: string, url?: string | URL | null): void;
  pushState(data: unknown, unused: string, url?: string | URL | null): void;
  back(): void;
  go(delta?: number): void;
}

export interface WindowNavigationAdapter {
  history: HistoryLike;
  href: string;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject): void;
  isStandalone?: () => boolean;
  tryCloseWindow?: () => void;
}

export function isDiarioHistoryState(value: unknown): value is DiarioHistoryState {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DiarioHistoryState>;
  return (
    candidate.__diarioNav === true &&
    typeof candidate.role === 'string' &&
    typeof candidate.tab === 'string' &&
    typeof candidate.depth === 'number'
  );
}

export function makeDiarioHistoryState(
  role: HistoryEntryRole,
  tab: MainTabType,
  depth: number
): DiarioHistoryState {
  return {
    __diarioNav: true,
    role,
    tab,
    depth,
  };
}

export function resolveMainTab(
  tab: MainTabType,
  subTab?: SubScheduleTab | SubResourceTab
): MainTabType {
  if (tab === 'horario' && subTab === 'calendario') {
    return 'calendario';
  }
  if (tab === 'recursos' && subTab === 'aprendemos') {
    return 'aprendemos';
  }
  if (tab === 'recursos' && (subTab === 'fotos' || subTab === 'multimedia')) {
    return 'multimedia';
  }
  return tab;
}

function createBrowserAdapter(): WindowNavigationAdapter | null {
  if (typeof window === 'undefined' || !window.history) return null;
  return {
    history: window.history,
    get href() {
      return window.location.href;
    },
    addEventListener: (type, listener) => window.addEventListener(type, listener),
    removeEventListener: (type, listener) => window.removeEventListener(type, listener),
    isStandalone: () => {
      const matchMediaStandalone =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(display-mode: standalone)').matches;
      const iosStandalone = Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      );
      return matchMediaStandalone || iosStandalone;
    },
    tryCloseWindow: () => {
      try {
        window.close();
      } catch {
        // Ignorar si el navegador bloquea window.close()
      }
    },
  };
}

export function createBackNavigationController(
  adapter: WindowNavigationAdapter | null,
  onChange: (snapshot: BackNavSnapshot) => void
) {
  let activeTab: MainTabType = 'inicio';
  let isInstallOpen = false;
  let isExitModalOpen = false;
  let currentDepth = 1;
  let currentRole: HistoryEntryRole = 'app';
  let isExiting = false;
  let exitResetTimer: ReturnType<typeof setTimeout> | null = null;
  let closeFallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let mounted = false;

  const clearTimers = () => {
    if (exitResetTimer !== null) {
      clearTimeout(exitResetTimer);
      exitResetTimer = null;
    }
    if (closeFallbackTimer !== null) {
      clearTimeout(closeFallbackTimer);
      closeFallbackTimer = null;
    }
  };

  const emit = () => {
    onChange({
      activeTab,
      isInstallOpen,
      isExitModalOpen,
      currentDepth,
      currentRole,
    });
  };

  const handlePopState = (event: Event) => {
    if (isExiting) {
      return;
    }

    const popEvent = event as PopStateEvent;
    const nextState = popEvent.state;

    // Si el usuario vuelve a pulsar Atrás mientras la confirmación está visible, salir limpiamente
    if (isExitModalOpen) {
      confirmExit();
      return;
    }

    // Si el modal de instalación estaba abierto (cierre por botón Atrás o por X)
    if (isInstallOpen || currentRole === 'modal') {
      isInstallOpen = false;
      if (isDiarioHistoryState(nextState)) {
        currentDepth = nextState.depth;
        currentRole = nextState.role;
        activeTab = nextState.role === 'sentinel' ? 'inicio' : nextState.tab;
      } else {
        currentDepth = Math.max(0, currentDepth - 1);
        currentRole = currentDepth === 0 ? 'sentinel' : 'app';
      }
      emit();
      return;
    }

    // Si el usuario está en Inicio, no salir inmediatamente: mostrar confirmación discreta
    if (activeTab === 'inicio') {
      if (isDiarioHistoryState(nextState)) {
        currentDepth = nextState.depth;
        currentRole = nextState.role;
      } else {
        currentDepth = 0;
        currentRole = 'sentinel';
      }
      isExitModalOpen = true;
      emit();
      return;
    }

    // Si está en una sección interna, regresar a la sección anterior del historial interno
    if (isDiarioHistoryState(nextState)) {
      if (nextState.role === 'sentinel') {
        activeTab = 'inicio';
        currentDepth = 0;
        currentRole = 'sentinel';
        if (adapter) {
          adapter.history.pushState(
            makeDiarioHistoryState('app', 'inicio', 1),
            '',
            adapter.href
          );
          currentDepth = 1;
          currentRole = 'app';
        }
      } else {
        activeTab = nextState.tab;
        currentDepth = nextState.depth;
        currentRole = nextState.role;
      }
    } else {
      activeTab = 'inicio';
      currentDepth = 0;
      currentRole = 'sentinel';
    }

    emit();
  };

  const handlePageShow = () => {
    isExiting = false;
    clearTimers();
  };

  const mount = () => {
    if (mounted) return;
    mounted = true;

    if (!adapter) {
      emit();
      return;
    }

    const existingState = adapter.history.state;
    if (!isDiarioHistoryState(existingState)) {
      adapter.history.replaceState(
        makeDiarioHistoryState('sentinel', 'inicio', 0),
        '',
        adapter.href
      );
      adapter.history.pushState(
        makeDiarioHistoryState('app', 'inicio', 1),
        '',
        adapter.href
      );
      currentDepth = 1;
      currentRole = 'app';
      activeTab = 'inicio';
    } else if (existingState.role === 'sentinel') {
      adapter.history.pushState(
        makeDiarioHistoryState('app', 'inicio', 1),
        '',
        adapter.href
      );
      currentDepth = 1;
      currentRole = 'app';
      activeTab = 'inicio';
    } else {
      currentDepth = Math.max(1, existingState.depth);
      currentRole = 'app';
      activeTab = 'inicio';
      if (existingState.tab !== 'inicio' || existingState.role === 'modal') {
        adapter.history.replaceState(
          makeDiarioHistoryState('app', 'inicio', currentDepth),
          '',
          adapter.href
        );
      }
    }

    adapter.addEventListener('popstate', handlePopState);
    adapter.addEventListener('pageshow', handlePageShow);
    emit();
  };

  const unmount = () => {
    if (!mounted) return;
    mounted = false;
    clearTimers();
    if (adapter) {
      adapter.removeEventListener('popstate', handlePopState);
      adapter.removeEventListener('pageshow', handlePageShow);
    }
  };

  const navigateToTab = (nextTab: MainTabType): boolean => {
    if (nextTab === activeTab) {
      if (isExitModalOpen) {
        stayInApp();
      } else if (isInstallOpen) {
        closeInstallModal();
      }
      return false;
    }

    isExitModalOpen = false;
    isInstallOpen = false;

    const nextDepth = currentDepth + 1;
    currentDepth = nextDepth;
    currentRole = 'tab';
    activeTab = nextTab;

    if (adapter) {
      adapter.history.pushState(
        makeDiarioHistoryState('tab', nextTab, nextDepth),
        '',
        adapter.href
      );
    }

    emit();
    return true;
  };

  const openInstallModal = () => {
    if (isInstallOpen) return;
    isExitModalOpen = false;
    isInstallOpen = true;
    const nextDepth = currentDepth + 1;
    currentDepth = nextDepth;
    currentRole = 'modal';

    if (adapter) {
      adapter.history.pushState(
        makeDiarioHistoryState('modal', activeTab, nextDepth),
        '',
        adapter.href
      );
    }

    emit();
  };

  const closeInstallModal = () => {
    if (!isInstallOpen) return;
    isInstallOpen = false;
    emit();

    if (adapter && currentRole === 'modal') {
      adapter.history.back();
    }
  };

  const stayInApp = () => {
    if (!isExitModalOpen) return;
    isExitModalOpen = false;
    activeTab = 'inicio';
    const nextDepth = currentDepth + 1;
    currentDepth = nextDepth;
    currentRole = 'app';

    if (adapter) {
      adapter.history.pushState(
        makeDiarioHistoryState('app', 'inicio', nextDepth),
        '',
        adapter.href
      );
    }

    emit();
  };

  const confirmExit = () => {
    isExiting = true;
    isExitModalOpen = false;
    emit();

    const stepsBack = Math.max(1, currentDepth + 1);
    currentDepth = 0;
    currentRole = 'sentinel';

    if (adapter) {
      adapter.history.go(-stepsBack);

      if (adapter.isStandalone?.()) {
        closeFallbackTimer = setTimeout(() => {
          adapter.tryCloseWindow?.();
        }, 120);
      }
    }

    exitResetTimer = setTimeout(() => {
      isExiting = false;
    }, 500);
  };

  const getSnapshot = (): BackNavSnapshot => ({
    activeTab,
    isInstallOpen,
    isExitModalOpen,
    currentDepth,
    currentRole,
  });

  return {
    mount,
    unmount,
    navigateToTab,
    openInstallModal,
    closeInstallModal,
    stayInApp,
    confirmExit,
    getSnapshot,
  };
}

export function useBackNavigation() {
  const [snapshot, setSnapshot] = useState<BackNavSnapshot>({
    activeTab: 'inicio',
    isInstallOpen: false,
    isExitModalOpen: false,
    currentDepth: 1,
    currentRole: 'app',
  });

  const controllerRef = useRef<ReturnType<typeof createBackNavigationController> | null>(null);

  if (!controllerRef.current) {
    controllerRef.current = createBackNavigationController(
      createBrowserAdapter(),
      (next) => setSnapshot(next)
    );
  }

  useEffect(() => {
    const controller = controllerRef.current;
    controller?.mount();
    return () => {
      controller?.unmount();
    };
  }, []);

  const scrollMainToTop = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (typeof document === 'undefined') return;
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior });
    }
  }, []);

  const navigateToTab = useCallback(
    (
      tab: MainTabType,
      subTab?: SubScheduleTab | SubResourceTab,
      scrollBehavior: ScrollBehavior = 'smooth'
    ) => {
      const targetTab = resolveMainTab(tab, subTab);
      controllerRef.current?.navigateToTab(targetTab);
      scrollMainToTop(scrollBehavior);
    },
    [scrollMainToTop]
  );

  // Al volver con el botón Atrás a otra sección, desplazar arriba suavemente
  const prevTabRef = useRef<MainTabType>('inicio');
  useEffect(() => {
    if (snapshot.activeTab !== prevTabRef.current) {
      prevTabRef.current = snapshot.activeTab;
      scrollMainToTop('smooth');
    }
  }, [snapshot.activeTab, scrollMainToTop]);

  const openInstallModal = useCallback(() => {
    controllerRef.current?.openInstallModal();
  }, []);

  const closeInstallModal = useCallback(() => {
    controllerRef.current?.closeInstallModal();
  }, []);

  const stayInApp = useCallback(() => {
    controllerRef.current?.stayInApp();
  }, []);

  const confirmExit = useCallback(() => {
    controllerRef.current?.confirmExit();
  }, []);

  return {
    activeTab: snapshot.activeTab,
    isInstallOpen: snapshot.isInstallOpen,
    isExitModalOpen: snapshot.isExitModalOpen,
    navigateToTab,
    openInstallModal,
    closeInstallModal,
    stayInApp,
    confirmExit,
  };
}
