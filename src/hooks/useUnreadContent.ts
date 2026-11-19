import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  computeUnreadSummary,
  loadReadStatusState,
  markPublicationAsRead,
  reconcileReadStatus,
  saveReadStatusState,
  SectionsContentSnapshot,
  UnreadCountsBySection,
  UnreadSectionId,
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
  const [readState, setReadState] = useState(() => loadReadStatusState());
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    loadSessionBannerDismissed()
  );

  // Reconciliar estado cuando haya datos cargados de forma válida
  useEffect(() => {
    if (!isDataReady) return;

    setReadState((prev) => {
      const { nextState, changed } = reconcileReadStatus(prev, snapshot, {
        isDataReady,
        hasConfirmedLiveSync,
      });

      if (changed) {
        saveReadStatusState(nextState);
        return nextState;
      }

      return prev;
    });
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

  const summary = useMemo(
    () => computeUnreadSummary(readState, snapshot),
    [
      readState,
      snapshot.diario,
      snapshot.avisos,
      snapshot.calendario,
      snapshot.multimedia,
      snapshot.aprendemos,
      snapshot.recursos,
    ]
  );

  const firstUnreadSection = useMemo(
    () => getFirstUnreadSection(summary.counts),
    [summary.counts]
  );

  const markAsRead = useCallback((publicationKey: string) => {
    if (!publicationKey) return;
    setReadState((prev) => {
      const { nextState, changed } = markPublicationAsRead(prev, publicationKey);
      if (changed) {
        saveReadStatusState(nextState);
        return nextState;
      }
      return prev;
    });
  }, []);

  const dismissEntryBanner = useCallback(() => {
    setBannerDismissed(true);
    saveSessionBannerDismissed();
  }, []);

  const showEntryBanner =
    readState.initialized && summary.totalUnread > 0 && !bannerDismissed;

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
