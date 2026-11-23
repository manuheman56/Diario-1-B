import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  computeUnreadSummary,
  createEmptyUnreadCounts,
  loadReadStatusState,
  markPublicationAsRead,
  READ_STATUS_STORAGE_KEY,
  ReadStatusState,
  reconcileReadStatus,
  saveReadStatusState,
  SectionsContentSnapshot,
  UnreadCountsBySection,
  UnreadSectionId,
  UnreadSummary,
  getFirstUnreadSection,
} from '../utils/readStatusService';

const BANNER_DISMISSED_SESSION_KEY = 'diario_novedades_banner_dismissed_v1';

function loadSessionBannerDismissed(): boolean {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return false;
    return window.sessionStorage.getItem(BANNER_DISMISSED_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

function saveSessionBannerDismissed(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.setItem(BANNER_DISMISSED_SESSION_KEY, '1');
  } catch {
    // Ignorar fallos de almacenamiento de sesión
  }
}

function clearSessionBannerDismissed(): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    window.sessionStorage.removeItem(BANNER_DISMISSED_SESSION_KEY);
  } catch {
    // Ignorar fallos de almacenamiento de sesión
  }
}

function createEmptyUnreadSummary(): UnreadSummary {
  return {
    counts: createEmptyUnreadCounts(),
    totalUnread: 0,
    unreadKeys: new Set<string>(),
    unreadBySection: {
      diario: [],
      avisos: [],
      calendario: [],
      multimedia: [],
      aprendemos: [],
      recursos: [],
    },
  };
}

interface UseUnreadContentParams {
  snapshot: SectionsContentSnapshot;
  /** True solo cuando las 6 secciones hayan terminado de cargarse de forma válida */
  isDataReady: boolean;
  /** True cuando ya se completó al menos una sincronización real en vivo */
  hasConfirmedLiveSync: boolean;
}

export interface UseUnreadContentResult {
  unreadCounts: UnreadCountsBySection;
  totalUnread: number;
  unreadKeys: ReadonlySet<string>;
  firstUnreadSection: UnreadSectionId | null;
  isInitialized: boolean;
  showEntryBanner: boolean;
  dismissEntryBanner: () => void;
  markAsRead: (publicationKey: string) => void;
}

export function useUnreadContent({
  snapshot,
  isDataReady,
  hasConfirmedLiveSync,
}: UseUnreadContentParams): UseUnreadContentResult {
  const [readState, setReadState] = useState<ReadStatusState>(() =>
    loadReadStatusState()
  );
  const readStateRef = useRef<ReadStatusState>(readState);
  readStateRef.current = readState;

  const [bannerDismissed, setBannerDismissed] = useState(() =>
    loadSessionBannerDismissed()
  );

  // Sincronización entre pestañas si otra ventana del mismo navegador actualiza las lecturas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== READ_STATUS_STORAGE_KEY) return;
      const latest = loadReadStatusState();
      readStateRef.current = latest;
      setReadState(latest);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Reconciliar estado cuando las 6 secciones hayan terminado de cargarse de forma válida
  useEffect(() => {
    if (!isDataReady) return;

    const current = readStateRef.current;
    const { nextState, changed } = reconcileReadStatus(current, snapshot, {
      isDataReady,
      hasConfirmedLiveSync,
    });

    if (changed) {
      readStateRef.current = nextState;
      saveReadStatusState(nextState);
      setReadState(nextState);
    }
  }, [
    isDataReady,
    hasConfirmedLiveSync,
    snapshot.diario,
    snapshot.avisos,
    snapshot.calendario,
    snapshot.multimedia,
    snapshot.aprendemos,
    snapshot.recursos,
  ]);

  const summary = useMemo(() => {
    if (!isDataReady) {
      return createEmptyUnreadSummary();
    }
    return computeUnreadSummary(readState, snapshot);
  }, [
    isDataReady,
    readState,
    snapshot.diario,
    snapshot.avisos,
    snapshot.calendario,
    snapshot.multimedia,
    snapshot.aprendemos,
    snapshot.recursos,
  ]);

  // Cuando se leen todas las novedades pendientes, limpiar el cierre de sesión del aviso
  // para que solo pueda volver a mostrarse si más adelante llega una publicación nueva real.
  useEffect(() => {
    if (isDataReady && readState.initialized && summary.totalUnread === 0 && bannerDismissed) {
      clearSessionBannerDismissed();
      setBannerDismissed(false);
    }
  }, [isDataReady, readState.initialized, summary.totalUnread, bannerDismissed]);

  const firstUnreadSection = useMemo(
    () => getFirstUnreadSection(summary.counts),
    [summary.counts]
  );

  // Guardado síncrono inmediato en localStorage antes de cualquier navegación o enlace externo
  const markAsRead = useCallback((publicationKey: string) => {
    if (!publicationKey) return;

    const current = readStateRef.current;
    const { nextState, changed } = markPublicationAsRead(current, publicationKey);

    if (changed) {
      readStateRef.current = nextState;
      saveReadStatusState(nextState);
      setReadState(nextState);
    }
  }, []);

  const dismissEntryBanner = useCallback(() => {
    setBannerDismissed(true);
    saveSessionBannerDismissed();
  }, []);

  const showEntryBanner =
    isDataReady &&
    readState.initialized &&
    summary.totalUnread > 0 &&
    !bannerDismissed;

  return {
    unreadCounts: summary.counts,
    totalUnread: summary.totalUnread,
    unreadKeys: summary.unreadKeys,
    firstUnreadSection,
    isInitialized: readState.initialized,
    showEntryBanner,
    dismissEntryBanner,
    markAsRead,
  };
}
