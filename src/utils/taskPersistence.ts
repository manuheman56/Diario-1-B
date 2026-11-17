import { DiaADiaItem } from '../types';

export interface SavedCompletedLookup {
  completedIds: Set<string>;
  completedTitles: Set<string>;
  knownIds: Set<string>;
}

/**
 * Lee las tareas completadas guardadas localmente en `diario_posts` sin borrar datos previos.
 */
export function readSavedCompletedTasks(
  storage: Pick<Storage, 'getItem'> | null | undefined =
    typeof localStorage !== 'undefined' ? localStorage : null
): SavedCompletedLookup {
  const completedIds = new Set<string>();
  const completedTitles = new Set<string>();
  const knownIds = new Set<string>();

  if (!storage) {
    return { completedIds, completedTitles, knownIds };
  }

  try {
    const saved = storage.getItem('diario_posts');
    if (!saved) return { completedIds, completedTitles, knownIds };
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return { completedIds, completedTitles, knownIds };

    parsed.forEach((p) => {
      if (!p || typeof p !== 'object') return;
      const id = typeof p.id === 'string' ? p.id.trim() : '';
      const title = typeof p.title === 'string' ? p.title.toLowerCase().trim() : '';

      if (id) knownIds.add(id);
      if (p.completed) {
        if (id) completedIds.add(id);
        if (title) completedTitles.add(title);
      }
    });
  } catch {
    // Ignorar error de parseo para no romper la hidratación
  }

  return { completedIds, completedTitles, knownIds };
}

/**
 * Fusiona publicaciones entrantes preservando tareas marcadas como completadas:
 * 1. Prioriza la coincidencia por `item.id` estable (resiste cambios de título en Sheets).
 * 2. Si el `id` no existía aún en el conjunto previo (compatibilidad con cachés antiguas),
 *    aplica fallback seguro por `title` normalizado.
 */
export function mergePostsWithCompleted(
  incomingPosts: DiaADiaItem[],
  previousPosts: DiaADiaItem[] = [],
  storage?: Pick<Storage, 'getItem'> | null
): DiaADiaItem[] {
  let lookup: SavedCompletedLookup;

  if (previousPosts.length > 0) {
    const completedIds = new Set<string>();
    const completedTitles = new Set<string>();
    const knownIds = new Set<string>();

    previousPosts.forEach((p) => {
      const id = typeof p.id === 'string' ? p.id.trim() : '';
      const title = typeof p.title === 'string' ? p.title.toLowerCase().trim() : '';
      if (id) knownIds.add(id);
      if (p.completed) {
        if (id) completedIds.add(id);
        if (title) completedTitles.add(title);
      }
    });

    lookup = { completedIds, completedTitles, knownIds };
  } else {
    lookup = readSavedCompletedTasks(storage);
  }

  return incomingPosts.map((item) => {
    const itemId = typeof item.id === 'string' ? item.id.trim() : '';
    const itemTitle = typeof item.title === 'string' ? item.title.toLowerCase().trim() : '';

    let isCompleted = false;
    if (itemId && lookup.knownIds.has(itemId)) {
      isCompleted = lookup.completedIds.has(itemId);
    } else if (itemId && lookup.completedIds.has(itemId)) {
      isCompleted = true;
    } else if (itemTitle && lookup.completedTitles.has(itemTitle)) {
      isCompleted = true;
    }

    return {
      ...item,
      completed: isCompleted,
    };
  });
}
