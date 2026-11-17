/**
 * Normaliza un texto para búsquedas tolerantes en la aplicación:
 * - Convierte a minúsculas
 * - Elimina tildes/diacríticos (NFD)
 * - Colapsa múltiples espacios en blanco y recorta extremos
 */
export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenSearchFields(fields: Array<unknown>): string {
  const parts: string[] = [];
  for (const field of fields) {
    if (Array.isArray(field)) {
      const sub = flattenSearchFields(field);
      if (sub) parts.push(sub);
    } else {
      const normalized = normalizeSearchText(field);
      if (normalized) parts.push(normalized);
    }
  }
  return parts.join(' ');
}

/**
 * Comprueba si el texto buscado coincide con los campos proporcionados,
 * ignorando mayúsculas/minúsculas, tildes y espacios sobrantes.
 * Admite coincidencia directa de subcadena y coincidencia por palabras clave (tokens).
 */
export function matchesNormalizedSearch(
  query: string,
  fields: Array<unknown>
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const combinedText = flattenSearchFields(fields);
  if (!combinedText) return false;

  if (combinedText.includes(normalizedQuery)) {
    return true;
  }

  const tokens = normalizedQuery.split(' ').filter(Boolean);
  if (tokens.length > 1) {
    return tokens.every((token) => combinedText.includes(token));
  }

  return false;
}
