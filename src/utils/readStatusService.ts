import {
  AvisoItem,
  CalendarEvent,
  DiaADiaItem,
  EducationalResource,
  HomeLearningResource,
  MultimediaItem,
} from '../types';

export const READ_STATUS_STORAGE_KEY = 'diario_read_state_v1';
export const READ_STATUS_SCHEMA_VERSION = 1;

export type UnreadSectionId =
  | 'diario'
  | 'avisos'
  | 'calendario'
  | 'multimedia'
  | 'aprendemos'
  | 'recursos';

export const UNREAD_SECTIONS: readonly UnreadSectionId[] = [
  'diario',
  'avisos',
  'calendario',
  'multimedia',
  'aprendemos',
  'recursos',
] as const;

export type UnreadCountsBySection = Record<UnreadSectionId, number>;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface ReadStatusState {
  version: typeof READ_STATUS_SCHEMA_VERSION;
  initialized: boolean;
  initializedAt: string | null;
  knownIds: string[];
  readIds: string[];
  updatedAt: string;
}

export interface SectionsContentSnapshot {
  diario: DiaADiaItem[];
  avisos: AvisoItem[];
  calendario: CalendarEvent[];
  multimedia: MultimediaItem[];
  aprendemos: EducationalResource[];
  recursos: HomeLearningResource[];
}

export interface UnreadSummary {
  counts: UnreadCountsBySection;
  totalUnread: number;
  unreadKeys: Set<string>;
  unreadBySection: Record<UnreadSectionId, string[]>;
}

const SYNTHETIC_FALLBACK_PATTERNS: Record<UnreadSectionId, RegExp> = {
  diario: /^dia-\d+$/,
  avisos: /^aviso-\d+$/,
  calendario: /^cal-\d+$/,
  multimedia: /^media-\d+$/,
  aprendemos: /^aprende-\d+$/,
  recursos: /^rec-\d+$/,
};

export function createEmptyUnreadCounts(): UnreadCountsBySection {
  return {
    diario: 0,
    avisos: 0,
    calendario: 0,
    multimedia: 0,
    aprendemos: 0,
    recursos: 0,
  };
}

export function createDefaultReadStatusState(): ReadStatusState {
  return {
    version: READ_STATUS_SCHEMA_VERSION,
    initialized: false,
    initializedAt: null,
    knownIds: [],
    readIds: [],
    updatedAt: '',
  };
}

function getSafeBrowserStorage(): StorageAdapter | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Comprueba si un elemento debe considerarse publicado y visible para las familias.
 * Acepta PUBLICAR y PUBLICADO (o ausencia del campo si ya viene prefiltrado) y excluye
 * estrictamente BORRADOR y ARCHIVADO.
 */
export function isItemPublishedForTracking(estado?: string | null): boolean {
  if (estado === undefined || estado === null || estado === '') return true;
  const normalized = String(estado)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toUpperCase();
  return normalized === 'PUBLICAR' || normalized === 'PUBLICADO';
}

function normalizeFingerprintPart(value?: string | number | null): string {
  if (value === undefined || value === null) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Hash determinista FNV-1a de 32 bits (en hexadecimal) usado únicamente como respaldo
 * cuando una fila de Google Sheets carece de identificador real propio.
 */
function fnv1aHex(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function isMissingOrSyntheticFallbackId(
  section: UnreadSectionId,
  rawId?: string | null
): boolean {
  if (!rawId || typeof rawId !== 'string') return true;
  const trimmed = rawId.trim();
  if (!trimmed) return true;
  return SYNTHETIC_FALLBACK_PATTERNS[section].test(trimmed);
}

type TrackableItemLike = {
  id?: string;
  estado?: string;
  titulo?: string;
  title?: string;
  fecha?: string;
  fecha_publicacion?: string;
  fecha_inicio?: string;
  date?: string;
  url_media?: string;
  url_recurso?: string;
  enlace_url?: string;
  externalUrl?: string;
  categoria?: string;
  tipo?: string;
};

/**
 * Devuelve una clave estable y única por sección para cualquier publicación.
 * Prioriza siempre el identificador real de Google Sheets (`item.id`).
 * Solo calcula la huella determinista cuando falta un identificador real.
 */
export function getPublicationKey(
  section: UnreadSectionId,
  item: TrackableItemLike
): string {
  const rawId = typeof item.id === 'string' ? item.id.trim() : '';

  if (!isMissingOrSyntheticFallbackId(section, rawId)) {
    return `${section}:id:${rawId}`;
  }

  const stableDate =
    item.fecha_inicio || item.fecha_publicacion || item.fecha || item.date || '';
  const stableTitle = item.titulo || item.title || '';
  const stableLink =
    item.url_media || item.url_recurso || item.enlace_url || item.externalUrl || '';
  const stableKind = item.categoria || item.tipo || '';

  const seed = [
    section,
    normalizeFingerprintPart(stableDate),
    normalizeFingerprintPart(stableTitle),
    normalizeFingerprintPart(stableLink),
    normalizeFingerprintPart(stableKind),
  ].join('|');

  return `${section}:fp:${fnv1aHex(seed)}`;
}

function dedupeStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((v) => typeof v === 'string' && v.length > 0)));
}

export function loadReadStatusState(storage?: StorageAdapter | null): ReadStatusState {
  const target = storage === undefined ? getSafeBrowserStorage() : storage;
  if (!target) return createDefaultReadStatusState();

  try {
    const raw = target.getItem(READ_STATUS_STORAGE_KEY);
    if (!raw) return createDefaultReadStatusState();

    const parsed = JSON.parse(raw) as Partial<ReadStatusState> | null;
    if (!parsed || typeof parsed !== 'object') {
      return createDefaultReadStatusState();
    }

    if (parsed.version !== READ_STATUS_SCHEMA_VERSION) {
      return createDefaultReadStatusState();
    }

    const initialized = Boolean(parsed.initialized);
    const knownIds = Array.isArray(parsed.knownIds)
      ? dedupeStrings(parsed.knownIds)
      : [];
    const readIds = Array.isArray(parsed.readIds)
      ? dedupeStrings(parsed.readIds)
      : [];

    return {
      version: READ_STATUS_SCHEMA_VERSION,
      initialized,
      initializedAt:
        typeof parsed.initializedAt === 'string' ? parsed.initializedAt : null,
      knownIds,
      readIds,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return createDefaultReadStatusState();
  }
}

export function saveReadStatusState(
  state: ReadStatusState,
  storage?: StorageAdapter | null
): boolean {
  const target = storage === undefined ? getSafeBrowserStorage() : storage;
  if (!target) return false;

  try {
    target.setItem(READ_STATUS_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function collectPublishedKeysBySection(
  snapshot: SectionsContentSnapshot
): Record<UnreadSectionId, string[]> {
  const extract = (section: UnreadSectionId, items: TrackableItemLike[]): string[] => {
    const keys: string[] = [];
    for (const item of items) {
      if (!item || !isItemPublishedForTracking(item.estado)) continue;
      keys.push(getPublicationKey(section, item));
    }
    return dedupeStrings(keys);
  };

  return {
    diario: extract('diario', snapshot.diario || []),
    avisos: extract('avisos', snapshot.avisos || []),
    calendario: extract('calendario', snapshot.calendario || []),
    multimedia: extract('multimedia', snapshot.multimedia || []),
    aprendemos: extract('aprendemos', snapshot.aprendemos || []),
    recursos: extract('recursos', snapshot.recursos || []),
  };
}

export interface ReconcileOptions {
  /** Debe ser true solo cuando las 6 secciones hayan terminado de cargarse de forma válida */
  isDataReady: boolean;
  /** True si se ha completado al menos una sincronización real en vivo con Apps Script */
  hasConfirmedLiveSync: boolean;
  nowIso?: string;
}

/**
 * Reconcilia el estado persistido de lectura con los contenidos publicados actuales.
 * - En primera visita: espera a que los datos estén completamente cargados y registra todas
 *   las publicaciones vigentes como referencia inicial leída (evita avalancha histórica).
 * - En visitas posteriores: registra nuevas publicaciones detectadas como pendientes de leer
 *   sin duplicar claves ni resetear las ya leídas.
 */
export function reconcileReadStatus(
  currentState: ReadStatusState,
  snapshot: SectionsContentSnapshot,
  options: ReconcileOptions
): { nextState: ReadStatusState; changed: boolean } {
  if (!options.isDataReady) {
    return { nextState: currentState, changed: false };
  }

  const keysBySection = collectPublishedKeysBySection(snapshot);
  const allCurrentKeys = dedupeStrings(
    UNREAD_SECTIONS.flatMap((section) => keysBySection[section])
  );
  const now = options.nowIso || new Date().toISOString();

  // Primera inicialización segura: nunca usar listas vacías ni cargas incompletas
  if (!currentState.initialized) {
    if (allCurrentKeys.length === 0 && !options.hasConfirmedLiveSync) {
      return { nextState: currentState, changed: false };
    }

    const nextState: ReadStatusState = {
      version: READ_STATUS_SCHEMA_VERSION,
      initialized: true,
      initializedAt: now,
      knownIds: allCurrentKeys,
      readIds: allCurrentKeys,
      updatedAt: now,
    };

    return { nextState, changed: true };
  }

  // Dispositivo ya inicializado: incorporar nuevas claves a knownIds sin marcarlas como leídas
  const knownSet = new Set(currentState.knownIds);
  let hasNewKnown = false;

  for (const key of allCurrentKeys) {
    if (!knownSet.has(key)) {
      knownSet.add(key);
      hasNewKnown = true;
    }
  }

  if (!hasNewKnown) {
    return { nextState: currentState, changed: false };
  }

  const nextState: ReadStatusState = {
    ...currentState,
    knownIds: Array.from(knownSet),
    updatedAt: now,
  };

  return { nextState, changed: true };
}

/**
 * Marca una única publicación como leída de forma idempotente.
 */
export function markPublicationAsRead(
  currentState: ReadStatusState,
  publicationKey: string,
  nowIso?: string
): { nextState: ReadStatusState; changed: boolean } {
  if (!publicationKey || typeof publicationKey !== 'string') {
    return { nextState: currentState, changed: false };
  }

  const readSet = new Set(currentState.readIds);
  const knownSet = new Set(currentState.knownIds);

  if (readSet.has(publicationKey) && knownSet.has(publicationKey)) {
    return { nextState: currentState, changed: false };
  }

  readSet.add(publicationKey);
  knownSet.add(publicationKey);

  const nextState: ReadStatusState = {
    ...currentState,
    knownIds: Array.from(knownSet),
    readIds: Array.from(readSet),
    updatedAt: nowIso || new Date().toISOString(),
  };

  return { nextState, changed: true };
}

/**
 * Calcula los contadores independientes por sección y el conjunto exacto de claves
 * pendientes de lectura entre las publicaciones visibles actuales.
 */
export function computeUnreadSummary(
  state: ReadStatusState,
  snapshot: SectionsContentSnapshot
): UnreadSummary {
  const counts = createEmptyUnreadCounts();
  const unreadKeys = new Set<string>();
  const unreadBySection: Record<UnreadSectionId, string[]> = {
    diario: [],
    avisos: [],
    calendario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  };

  // Mientras no exista referencia inicial válida, no mostrar novedades falsas
  if (!state.initialized) {
    return { counts, totalUnread: 0, unreadKeys, unreadBySection };
  }

  const readSet = new Set(state.readIds);
  const keysBySection = collectPublishedKeysBySection(snapshot);
  let totalUnread = 0;

  for (const section of UNREAD_SECTIONS) {
    for (const key of keysBySection[section]) {
      if (!readSet.has(key)) {
        unreadKeys.add(key);
        unreadBySection[section].push(key);
        counts[section] += 1;
        totalUnread += 1;
      }
    }
  }

  return { counts, totalUnread, unreadKeys, unreadBySection };
}

/**
 * Devuelve la primera sección prioritaria que tenga novedades pendientes de consultar.
 */
export function getFirstUnreadSection(
  counts: UnreadCountsBySection
): UnreadSectionId | null {
  const priorityOrder: UnreadSectionId[] = [
    'avisos',
    'diario',
    'calendario',
    'aprendemos',
    'recursos',
    'multimedia',
  ];

  for (const section of priorityOrder) {
    if (counts[section] > 0) {
      return section;
    }
  }

  return null;
}
