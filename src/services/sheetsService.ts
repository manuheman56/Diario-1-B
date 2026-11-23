/**
 * Servicio Central de Integración con Google Apps Script
 *
 * ARQUITECTURA DE PRIVACIDAD ESTRICTA:
 * - Google Sheets (1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1) es estrictamente PRIVADA.
 * - Cero acceso directo desde el navegador del usuario a Google Sheets (sin CSV ni URLs públicas).
 * - Google Apps Script actúa como único intermediario de lectura segura.
 * - Si VITE_APPS_SCRIPT_URL no está configurada, no se realiza ninguna petición externa ni se muestran datos ficticios.
 * - Filtro estricto: Solo registros con estado === 'PUBLICAR'.
 * - Exclusividad curricular: Lengua Castellana y Matemáticas (+ Apoyo Familiar).
 */

import {
  AppConfig,
  AprendemosCategory,
  AvisoItem,
  CalendarEvent,
  DayOfWeek,
  DiaADiaItem,
  EducationalResource,
  HomeLearningResource,
  HomeResourceCategory,
  MultimediaItem,
  PostCategory,
  PublicacionEstado,
  ScheduleItem,
} from '../types';
import {
  APPS_SCRIPT_WEBAPP_URL,
  SPREADSHEET_ID,
  isAppsScriptConfigured,
} from '../config/appsScriptConfig';

export const SHEETS_DOCUMENT_ID = SPREADSHEET_ID;
export const CACHE_STORAGE_KEY = 'diario_sync_cache_v3';

/**
 * Realiza una petición JSONP segura inyectando dinámicamente un elemento <script>.
 * Google Apps Script redirige con un 302 a script.googleusercontent.com, donde fetch()
 * convencional puede fallar por cabeceras CORS en algunos navegadores/webviews.
 * JSONP garantiza lectura 100% libre de CORS sin exponer credenciales.
 */
export function fetchViaJsonp<T = unknown>(baseUrl: string, params: Record<string, string> = {}, timeoutMs = 12000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('JSONP solo está disponible en el entorno del navegador'));
    }

    const callbackName = `diario_jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const urlObj = new URL(baseUrl);

    Object.entries(params).forEach(([key, val]) => {
      urlObj.searchParams.set(key, val);
    });
    urlObj.searchParams.set('callback', callbackName);

    let scriptEl: HTMLScriptElement | null = document.createElement('script');
    let timer: number | null = null;

    const cleanup = () => {
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      if (scriptEl && scriptEl.parentNode) {
        scriptEl.parentNode.removeChild(scriptEl);
      }
      scriptEl = null;
      try {
        delete (window as unknown as Record<string, unknown>)[callbackName];
      } catch {
        (window as unknown as Record<string, unknown>)[callbackName] = undefined;
      }
    };

    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Tiempo de espera agotado (${timeoutMs}ms) en petición JSONP`));
    }, timeoutMs);

    (window as unknown as Record<string, (data: T) => void>)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    scriptEl.onerror = () => {
      cleanup();
      reject(new Error('Fallo de red al conectar con Google Apps Script'));
    };

    scriptEl.src = urlObj.toString();
    scriptEl.async = true;
    document.head.appendChild(scriptEl);
  });
}

/**
 * Petición fetch directa alternativa a JSONP
 */
export async function fetchViaFetch<T = unknown>(url: string, timeoutMs = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json, text/plain, */*' },
      signal: controller.signal,
      cache: 'no-cache',
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`Error HTTP ${res.status}`);
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * Parser RFC-4180 completo para filas estructuradas
 */
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((c) => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Normaliza encabezados
 */
function normalizeHeader(h: string): string {
  return (h || '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Evalúa si un valor representa un destacado (SI / TRUE / 1)
 */
function parseDestacado(val: string | boolean | undefined): boolean {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const v = String(val).toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return v === 'SI' || v === 'TRUE' || v === '1' || v === 'YES';
}

/**
 * Normaliza el estado de publicación. Solo "PUBLICAR" y "PUBLICADO" son visibles.
 * BORRADOR y ARCHIVADO permanecen ocultos.
 */
export function parseEstado(val: unknown): PublicacionEstado {
  const v = String(val ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toUpperCase();
  if (v === 'PUBLICAR' || v === 'PUBLICADO') return 'PUBLICAR';
  if (v === 'ARCHIVADO') return 'ARCHIVADO';
  return 'BORRADOR';
}

export function isPayloadItemPublished(rawEstado: unknown): boolean {
  if (rawEstado === undefined || rawEstado === null) return true;
  const cleaned = String(rawEstado).replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
  if (cleaned === '') return true;
  return parseEstado(cleaned) === 'PUBLICAR';
}

export const APRENDEMOS_CATEGORY_LABELS: Record<AprendemosCategory, string> = {
  lectura: 'Lectura y comprensión',
  escritura: 'Escritura y trazo',
  calculo: 'Cálculo y lógica',
  talleres: 'Talleres y dinámicas',
};

/**
 * Normaliza la categoría de APRENDEMOS (insensible a tildes y mayúsculas)
 * hacia las 4 categorías oficiales del proyecto.
 */
export function normalizeAprendemosCategory(rawCat: unknown): AprendemosCategory {
  const normalized = String(rawCat ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

  if (!normalized) return 'lectura';
  if (
    normalized.includes('taller') ||
    normalized.includes('dinam') ||
    normalized.includes('juego') ||
    normalized.includes('pauta') ||
    normalized.includes('habito') ||
    normalized.includes('emocion') ||
    normalized.includes('conviv')
  ) {
    return 'talleres';
  }
  if (
    normalized.includes('escri') ||
    normalized.includes('trazo') ||
    normalized.includes('cali') ||
    normalized.includes('grafo')
  ) {
    return 'escritura';
  }
  if (
    normalized.includes('calculo') ||
    normalized.includes('logic') ||
    normalized.includes('mat') ||
    normalized.includes('num') ||
    normalized.includes('suma') ||
    normalized.includes('resta') ||
    normalized.includes('problem')
  ) {
    return 'calculo';
  }
  return 'lectura';
}

const MADRID_TZ = 'Europe/Madrid';

function formatDateInMadrid(date: Date): string {
  if (Number.isNaN(date.getTime())) return '';
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: MADRID_TZ,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(date);
    const d = parts.find((p) => p.type === 'day')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const y = parts.find((p) => p.type === 'year')?.value;
    if (d && m && y) {
      return `${d}/${m}/${y}`;
    }
  } catch {
    // Fallback seguro si Intl con timeZone no estuviera disponible
  }
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear());
  return `${d}/${m}/${y}`;
}

const SPANISH_MONTH_TO_NUMBER: Record<string, string> = {
  enero: '01',
  ene: '01',
  febrero: '02',
  feb: '02',
  marzo: '03',
  mar: '03',
  abril: '04',
  abr: '04',
  mayo: '05',
  may: '05',
  junio: '06',
  jun: '06',
  julio: '07',
  jul: '07',
  agosto: '08',
  ago: '08',
  septiembre: '09',
  setiembre: '09',
  sep: '09',
  sept: '09',
  octubre: '10',
  oct: '10',
  noviembre: '11',
  nov: '11',
  diciembre: '12',
  dic: '12',
};

function formatSerialDateNumber(serial: number): string {
  const wholeDays = Math.floor(serial);
  const utcDate = new Date(Date.UTC(1899, 11, 30 + wholeDays, 12, 0, 0));
  const d = String(utcDate.getUTCDate()).padStart(2, '0');
  const m = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
  const y = String(utcDate.getUTCFullYear());
  return `${d}/${m}/${y}`;
}

function normalizeDayMonthPair(firstRaw: string, secondRaw: string, yearStr: string): string {
  const first = parseInt(firstRaw, 10);
  const second = parseInt(secondRaw, 10);
  // Si el segundo número supera 12 y el primero está entre 1 y 12, es formato MM/DD/AAAA
  if (second > 12 && first >= 1 && first <= 12) {
    return `${secondRaw.padStart(2, '0')}/${firstRaw.padStart(2, '0')}/${yearStr}`;
  }
  return `${firstRaw.padStart(2, '0')}/${secondRaw.padStart(2, '0')}/${yearStr}`;
}

/**
 * Formatea fechas a DD/MM/AAAA respetando la zona horaria Europe/Madrid
 * y evitando desplazamientos por conversiones UTC.
 */
export function formatSpanishDate(rawDate: string | Date | number | null | undefined): string {
  if (rawDate === null || rawDate === undefined || rawDate === '') return '';

  if (rawDate instanceof Date) {
    return formatDateInMadrid(rawDate);
  }

  // Número de serie de Google Sheets / Excel (época 30/12/1899)
  if (typeof rawDate === 'number' && Number.isFinite(rawDate) && rawDate > 20000 && rawDate < 100000) {
    return formatSerialDateNumber(rawDate);
  }

  const trimmed = String(rawDate)
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .trim();
  if (!trimmed) return '';

  // Número de serie de Google Sheets enviado como cadena (ej. "46356" o "46356.0")
  if (/^\d{5}(?:\.\d+)?$/.test(trimmed)) {
    const serial = Number(trimmed);
    if (Number.isFinite(serial) && serial > 20000 && serial < 100000) {
      return formatSerialDateNumber(serial);
    }
  }

  // Si viene como "DD/MM/AAAA", "DD/MM/AAAA HH:mm(:ss)?" o "DD/MM/AAAA, HH:mm(:ss)?"
  const dmySlash = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[\s,]+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (dmySlash) {
    const [, first, second, y] = dmySlash;
    return normalizeDayMonthPair(first, second, y);
  }

  // Si viene como "DD-MM-AAAA" o "DD.MM.AAAA" (con o sin hora)
  const dmyDashDot = trimmed.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{4})(?:[\s,]+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (dmyDashDot) {
    const [, first, second, y] = dmyDashDot;
    return normalizeDayMonthPair(first, second, y);
  }

  // Si viene como "DD/MM/AA", "DD-MM-AA" o "DD.MM.AA" (año en 2 dígitos)
  const dmyShort = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2})(?:[\s,]+\d{1,2}:\d{2}(?::\d{2})?)?$/);
  if (dmyShort) {
    const [, first, second, yy] = dmyShort;
    const year = String(2000 + parseInt(yy, 10));
    return normalizeDayMonthPair(first, second, year);
  }

  // Si viene como ISO con zona horaria explícita (Z o ±HH:MM), convertir al día real en Europe/Madrid
  if (/^\d{4}-\d{1,2}-\d{1,2}[T\s]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    const parsedInstant = new Date(trimmed);
    if (!Number.isNaN(parsedInstant.getTime())) {
      return formatDateInMadrid(parsedInstant);
    }
  }

  // Si viene como fecha ISO pura "AAAA-MM-DD" o ISO local sin zona horaria "AAAA-MM-DDTHH:mm(:ss)"
  const isoLocal = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s]\d{1,2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/);
  if (isoLocal) {
    const [, y, m, d] = isoLocal;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene en texto en español (ej. "30 de noviembre de 2026", "lunes, 30 nov 2026")
  const normalizedEs = trimmed
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const esTextMatch = normalizedEs.match(
    /(?:^|[,\s])(\d{1,2})\s+(?:de\s+)?([a-z]{3,10})\.?\s+(?:de\s+|del\s+)?(\d{4})$/
  );
  if (esTextMatch) {
    const [, d, monthWord, y] = esTextMatch;
    const m = SPANISH_MONTH_TO_NUMBER[monthWord];
    if (m) {
      return `${d.padStart(2, '0')}/${m}/${y}`;
    }
  }

  // Si viene como cadena Date de JavaScript (ej. "Mon Nov 30 2026 00:00:00 GMT+0100 ...")
  if (/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2}\s+\d{4}/.test(trimmed)) {
    const parsedJsDate = new Date(trimmed);
    if (!Number.isNaN(parsedJsDate.getTime())) {
      return formatDateInMadrid(parsedJsDate);
    }
  }

  return trimmed;
}

/**
 * Extrae día, mes (0-indexado) y año de una fecha DD/MM/AAAA validada.
 * Valida con mediodía UTC para ser 100% inmune a cambios horarios (DST) o zona local.
 * Devuelve null si la fecha está vacía o es inválida/ilegible para evitar fechas ficticias.
 */
export function parseCalendarDateParts(
  formattedDate: string
): { day: number; month: number; year: number } | null {
  if (!formattedDate) return null;
  const match = formattedDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1; // 0-indexed (0 = Enero ... 11 = Diciembre)
  const year = parseInt(match[3], 10);

  if (month < 0 || month > 11 || day < 1 || day > 31 || year < 1900 || year > 2100) {
    return null;
  }

  // Validación real de calendario (bisiestos, meses de 30/31 días) en mediodía UTC sin riesgo de DST
  const checkDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
  if (
    checkDate.getUTCFullYear() !== year ||
    checkDate.getUTCMonth() !== month ||
    checkDate.getUTCDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
}

/**
 * Parsea de forma estricta un valor numérico para `orden`.
 * Acepta números finitos (incluido 0) y cadenas numéricas válidas.
 * Devuelve null ante valores vacíos, NaN o no numéricos para evitar comparaciones falsas.
 */
export function parseNumericOrden(raw: unknown): number | null {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : null;
  }
  if (typeof raw === 'string') {
    const normalized = raw.trim().replace(',', '.');
    if (!normalized) return null;
    if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(normalized)) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Convierte una fecha (DD/MM/AAAA o ISO) en un entero comparable AAAAMMDD sin desfase horario.
 * Devuelve 0 si la fecha falta o no es válida.
 */
function toDateSortValue(rawDate?: string): number {
  if (!rawDate) return 0;
  const formatted = formatSpanishDate(rawDate);
  const parts = parseCalendarDateParts(formatted);
  if (!parts) return 0;
  return parts.year * 10000 + (parts.month + 1) * 100 + parts.day;
}

interface SortableEntry<T> {
  item: T;
  orden: number | null;
  dateStr?: string;
}

/**
 * Comparador estándar para publicaciones:
 * 1. Registros con `orden` numérico válido siempre van antes que los que carecen de `orden`.
 * 2. `orden` DESCENDENTE (mayor número primero).
 * 3. Desempate por fecha DESCENDENTE (más reciente primero) si ambos empatan.
 */
function compareSortableEntries<T>(a: SortableEntry<T>, b: SortableEntry<T>): number {
  if (a.orden !== null && b.orden === null) return -1;
  if (a.orden === null && b.orden !== null) return 1;
  if (a.orden !== null && b.orden !== null && a.orden !== b.orden) {
    return b.orden - a.orden;
  }

  const aDate = toDateSortValue(a.dateStr);
  const bDate = toDateSortValue(b.dateStr);
  if (aDate !== bDate) {
    return bDate - aDate;
  }

  return 0;
}

function sortByOrdenDesc<T>(entries: SortableEntry<T>[]): T[] {
  return [...entries].sort(compareSortableEntries).map((entry) => entry.item);
}

function parseCachedOrden(raw: unknown): number | null {
  const num = parseNumericOrden(raw);
  if (num === null || num < 0) return null;
  return num;
}

export function sortDiaADiaItems(items: DiaADiaItem[]): DiaADiaItem[] {
  return sortByOrdenDesc(
    items.map((item) => ({
      item,
      orden: parseCachedOrden(item.orden),
      dateStr: item.fecha || item.date,
    }))
  );
}

export function sortAvisosItems(items: AvisoItem[]): AvisoItem[] {
  return sortByOrdenDesc(
    items.map((item) => ({
      item,
      orden: parseCachedOrden(item.orden),
      dateStr: item.fecha_publicacion,
    }))
  );
}

export function sortMultimediaItems(items: MultimediaItem[]): MultimediaItem[] {
  return sortByOrdenDesc(
    items.map((item) => ({
      item,
      orden: parseCachedOrden(item.orden),
      dateStr: item.fecha,
    }))
  );
}

const INLINE_BULLET_SPLIT_RE = /\s*[•▪◦●‣]+\s*/;
const CONTEXTUAL_DASH_SPLIT_RE = /(?:^|(?<=[.!?:;])\s+)\s*[-*–—]\s+(?=[A-ZÁÉÍÓÚÑ¡¿])/;
const NUMBERED_LIST_SPLIT_RE = /(?:^|\s)\d{1,2}[.)]\s+(?=[A-ZÁÉÍÓÚÑ¡¿])/;
const ABBREVIATION_DOT_PLACEHOLDER = '\u0000';

function splitMultipleSentencesSafely(text: string): string[] {
  const masked = text
    .replace(/\bp\.\s*ej\./gi, `p${ABBREVIATION_DOT_PLACEHOLDER} ej${ABBREVIATION_DOT_PLACEHOLDER}`)
    .replace(
      /\b(Dr|Dra|Sr|Sra|Prof|Lic|etc|ej|pág|núm|vol|art|aprox|máx|mín|tel|ud|uds)\./gi,
      `$1${ABBREVIATION_DOT_PLACEHOLDER}`
    )
    .replace(/\b([A-ZÁÉÍÓÚÑ])\./g, `$1${ABBREVIATION_DOT_PLACEHOLDER}`);

  const parts = masked
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¡¿])/)
    .map((part) => part.replace(/\u0000/g, '.').trim())
    .filter((part) => part.length > 0);

  return parts.length > 1 ? parts : [text.trim()];
}

/**
 * Normaliza una lista de recomendaciones antes de renderizar o almacenar:
 * - Separa saltos de línea, saltos escapados (\n), viñetas inline (•, ▪, etc.) y listas numeradas.
 * - Si todas las recomendaciones llegan concatenadas en un único texto separado por puntos,
 *   las divide de forma segura respetando abreviaturas, siglas y ordinales (1.º, Dr., p. ej.).
 * - Elimina vacíos, duplicados y cualquier repetición de la explicación.
 */
export function normalizeAprendemosTips(
  rawTips: string[] | undefined,
  description?: string
): string[] {
  if (!Array.isArray(rawTips) || rawTips.length === 0) return [];

  const normalizedDesc = (description || '').trim().toLowerCase();

  const expanded: string[] = [];
  rawTips.forEach((raw) => {
    if (typeof raw !== 'string') return;
    const cleanedRaw = raw
      .replace(/\\n/g, '\n')
      .replace(/^c[oó]mo acompañar este aprendizaje\s*:?\s*/i, '');

    cleanedRaw.split(/\r?\n/).forEach((line) => {
      line.split(INLINE_BULLET_SPLIT_RE).forEach((bulletPart) => {
        bulletPart.split(NUMBERED_LIST_SPLIT_RE).forEach((numPart) => {
          numPart.split(CONTEXTUAL_DASH_SPLIT_RE).forEach((part) => {
            const clean = part.replace(/^[•\-\*–—▪◦●‣]+\s*/, '').trim();
            if (clean.length > 0) {
              expanded.push(clean);
            }
          });
        });
      });
    });
  });

  const sentenceExpanded =
    rawTips.length === 1 && expanded.length === 1
      ? splitMultipleSentencesSafely(expanded[0])
      : expanded;

  const seen = new Set<string>();
  const finalTips: string[] = [];
  for (const tip of sentenceExpanded) {
    const clean = tip.replace(/^[•\-\*–—▪◦●‣]+\s*/, '').trim();
    const key = clean.toLowerCase();
    if (!clean) continue;
    if (normalizedDesc && key === normalizedDesc) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    finalTips.push(clean);
  }

  return finalTips;
}

/**
 * Separa la columna `descripcion` de APRENDEMOS en:
 * - `description`: exclusivamente la primera línea no vacía (explicación del aprendizaje).
 * - `tips`: exclusivamente las recomendaciones posteriores, sin prefijos de viñeta ni repetición de la explicación.
 */
export function splitAprendemosDescription(rawDescripcion: string): {
  description: string;
  tips: string[];
} {
  const normalizedText = String(rawDescripcion || '').replace(/\\n/g, '\n');
  const rawLines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (rawLines.length === 0) {
    return { description: '', tips: [] };
  }

  const firstLineParts = rawLines[0]
    .split(INLINE_BULLET_SPLIT_RE)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  const description = firstLineParts[0] || rawLines[0];
  const candidateTipLines = [...firstLineParts.slice(1), ...rawLines.slice(1)];

  if (candidateTipLines.length === 0) {
    return { description, tips: [] };
  }

  const tips = normalizeAprendemosTips(
    candidateTipLines.length === 1 ? [candidateTipLines[0]] : candidateTipLines,
    description
  );

  return { description, tips };
}

export function sortAprendemosItems(items: EducationalResource[]): EducationalResource[] {
  return sortByOrdenDesc(
    items.map((item) => {
      const normalizedCategory = normalizeAprendemosCategory(item.categoria || item.category);
      const split =
        typeof item.descripcion === 'string'
          ? splitAprendemosDescription(item.descripcion)
          : {};
      return {
        item: {
          ...item,
          ...split,
          category: normalizedCategory,
        },
        orden: parseCachedOrden(item.orden),
      };
    })
  );
}

export function sortRecursosItems(items: HomeLearningResource[]): HomeLearningResource[] {
  return sortByOrdenDesc(
    items.map((item) => ({
      item,
      orden: parseCachedOrden(item.orden),
    }))
  );
}

export function normalizeCalendarEvents(items: CalendarEvent[]): CalendarEvent[] {
  return items
    .map((ev): CalendarEvent | null => {
      // La fecha del evento en el calendario se determina EXCLUSIVAMENTE desde fecha_inicio
      const formattedStart = ev.fecha_inicio ? formatSpanishDate(ev.fecha_inicio) : '';
      const parsedStart = formattedStart ? parseCalendarDateParts(formattedStart) : null;

      if (ev.fecha_inicio && !parsedStart) {
        return null;
      }

      const day = parsedStart ? parsedStart.day : ev.day;
      const month = parsedStart ? parsedStart.month : ev.month;
      const year = parsedStart ? parsedStart.year : ev.year;
      const startCode = year * 10000 + (month + 1) * 100 + day;

      const formattedEnd = ev.fecha_fin ? formatSpanishDate(ev.fecha_fin) : '';
      const parsedEnd = formattedEnd ? parseCalendarDateParts(formattedEnd) : null;
      const endCode = parsedEnd
        ? parsedEnd.year * 10000 + (parsedEnd.month + 1) * 100 + parsedEnd.day
        : null;
      const validEnd = parsedEnd && endCode !== null && endCode >= startCode ? formattedEnd : undefined;

      const fechaInicioFinal =
        parsedStart
          ? formattedStart
          : `${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`;

      return {
        ...ev,
        fecha_inicio: fechaInicioFinal,
        fecha_fin: validEnd,
        day,
        month,
        year,
      };
    })
    .filter((ev): ev is CalendarEvent => ev !== null);
}

function sortSyncResultPublications(result: SyncResult): SyncResult {
  return {
    ...result,
    posts: Array.isArray(result.posts) ? sortDiaADiaItems(result.posts) : [],
    avisos: Array.isArray(result.avisos) ? sortAvisosItems(result.avisos) : [],
    events: Array.isArray(result.events) ? normalizeCalendarEvents(result.events) : [],
    multimedia: Array.isArray(result.multimedia) ? sortMultimediaItems(result.multimedia) : [],
    aprendemos: Array.isArray(result.aprendemos) ? sortAprendemosItems(result.aprendemos) : [],
    recursos: Array.isArray(result.recursos) ? sortRecursosItems(result.recursos) : [],
  };
}

/**
 * Normaliza horas a formato HH:MM
 */
export function formatSpanishTime(rawTime: string): string {
  if (!rawTime) return '';
  const trimmed = rawTime.trim();
  const match = trimmed.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return trimmed;
}

/**
 * Normaliza categorías del diario escolar
 */
export function normalizeCategory(raw: string): PostCategory {
  const trimmed = (raw || '').trim();
  const lower = trimmed.toLowerCase();
  if (!lower) return 'General';
  if (lower === 'general' || lower.includes('general')) return 'General';
  if (lower.includes('tarea') || lower.includes('deber')) return 'Tarea';
  if (lower.includes('clase') || lower.includes('actividad')) return 'Actividad';
  if (lower.includes('urgente')) return 'Urgente';
  if (lower.includes('aviso') || lower.includes('circular')) return 'Aviso';
  if (lower.includes('proyecto')) return 'Proyecto';
  // Si el docente utiliza una categoría específica en la hoja, se preserva con la primera letra en mayúscula:
  return (trimmed.charAt(0).toUpperCase() + trimmed.slice(1)) as PostCategory;
}

/**
 * Convierte URL de YouTube a embed seguro privado (youtube-nocookie.com)
 */
export function sanitizeYoutubeEmbedUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  const trimmed = rawUrl.trim();

  let videoId = '';
  const matchWatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube-nocookie\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (matchWatch && matchWatch[1]) {
    videoId = matchWatch[1];
  }

  if (videoId) {
    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  }

  return trimmed;
}

// ============================================================================
// PARSERS DE ESTRUCTURA OFICIAL PARA DATOS RECIBIDOS DE APPS SCRIPT
// ============================================================================

export function parseConfigObject(configMap: Record<string, string>): Partial<AppConfig> {
  const result: Partial<AppConfig> = {};
  if (configMap['nombre'] || configMap['titulo_app']) {
    result.classTitle = configMap['nombre'] || configMap['titulo_app'];
  }
  if (configMap['grupo'] || configMap['clase']) {
    result.classTitle = configMap['grupo'] || configMap['clase'];
  }
  if (configMap['colegio'] || configMap['centro']) {
    result.schoolName = configMap['colegio'] || configMap['centro'];
  }
  if (configMap['tutor']) {
    result.teacherName = configMap['tutor'];
  }
  if (configMap['curso_escolar']) {
    result.schoolYear = configMap['curso_escolar'];
  }
  if (configMap['mensaje_bienvenida']) {
    result.welcomeMessage = configMap['mensaje_bienvenida'];
  }
  if (configMap['zona_horaria']) {
    result.timezone = configMap['zona_horaria'];
  }
  if (configMap['idioma']) {
    result.language = configMap['idioma'];
  }
  if (configMap['drive_folder_url']) {
    result.driveFolderUrl = configMap['drive_folder_url'];
  }
  if (configMap['youtube_url']) {
    result.youtubeAuthorizedUrl = configMap['youtube_url'];
  }

  return result;
}

export function parseDiaADiaRows(rows: string[][]): DiaADiaItem[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colFecha = headers.findIndex((h) => h === 'fecha' || h.includes('fecha'));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'title');
  const colContenido = headers.findIndex((h) => h === 'contenido' || h.includes('contenido') || h === 'texto');
  const colCat = headers.findIndex((h) => h === 'categoria' || h.includes('categoria'));
  const colImg = headers.findIndex((h) => h === 'imagen_url' || h.includes('imagen') || h.includes('foto'));
  const colUrl = headers.findIndex((h) => h === 'enlace_url' || h.includes('enlace') || h.includes('link') || h.includes('url'));
  const colDestacado = headers.findIndex((h) => h === 'destacado' || h.includes('destacado'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  const entries: SortableEntry<DiaADiaItem>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    // REGLA ESTRICTA: Solo 'PUBLICAR'. BORRADOR y ARCHIVADO se descartan
    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `dia-${i}`;
    const rawFecha = colFecha !== -1 ? row[colFecha] : '';
    const fecha = formatSpanishDate(rawFecha);
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const contenido = colContenido !== -1 ? row[colContenido] || '' : '';
    const categoria = colCat !== -1 && row[colCat] ? row[colCat].trim() : 'General';
    const imagen_url = colImg !== -1 ? row[colImg] : undefined;
    const enlace_url = colUrl !== -1 ? row[colUrl] : undefined;
    const destacado = colDestacado !== -1 ? parseDestacado(row[colDestacado]) : false;
    const parsedOrden = colOrden !== -1 ? parseNumericOrden(row[colOrden]) : null;
    const orden = parsedOrden ?? -1;

    if (!titulo && !contenido) continue;

    const postCat = normalizeCategory(categoria);
    const isUrgent = postCat === 'Urgente' || categoria.toLowerCase().includes('urgente');

    entries.push({
      orden: parsedOrden,
      dateStr: fecha,
      item: {
        id,
        fecha,
        titulo,
        contenido,
        categoria,
        imagen_url: imagen_url || undefined,
        enlace_url: enlace_url || undefined,
        destacado,
        estado,
        orden,
        title: titulo,
        content: contenido,
        tag: postCat,
        date: fecha || 'Hoy',
        timestamp: Date.now() - orden * 1000,
        completed: false,
        important: isUrgent,
        author: 'Manuel Herrera',
        imageUrl: imagen_url || undefined,
        icon:
          postCat === 'Tarea'
            ? '📝'
            : postCat === 'Actividad'
            ? '🎨'
            : postCat === 'Urgente'
            ? '🚨'
            : postCat === 'Aviso'
            ? '📢'
            : postCat === 'Proyecto'
            ? '🚀'
            : '📰',
      },
    });
  }

  return sortByOrdenDesc(entries);
}

export function parseAvisosRows(rows: string[][]): AvisoItem[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colFechaPub = headers.findIndex((h) => h === 'fecha_publicacion' || (h.includes('fecha') && !h.includes('limite')));
  const colFechaLim = headers.findIndex((h) => h === 'fecha_limite' || h.includes('limite'));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'title');
  const colMensaje = headers.findIndex((h) => h === 'mensaje' || h.includes('mensaje') || h === 'contenido');
  const colTipo = headers.findIndex((h) => h === 'tipo' || h.includes('tipo'));
  const colPrioridad = headers.findIndex((h) => h === 'prioridad' || h.includes('prioridad'));
  const colUrl = headers.findIndex((h) => h === 'enlace_url' || h.includes('enlace') || h.includes('link') || h.includes('url'));
  const colDestacado = headers.findIndex((h) => h === 'destacado' || h.includes('destacado'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  const entries: SortableEntry<AvisoItem>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `aviso-${i}`;
    const fechaPub = formatSpanishDate(colFechaPub !== -1 ? row[colFechaPub] : '');
    const fechaLim = colFechaLim !== -1 ? formatSpanishDate(row[colFechaLim]) : undefined;
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const mensaje = colMensaje !== -1 ? row[colMensaje] || '' : '';
    const tipo = colTipo !== -1 ? row[colTipo] || 'Aviso' : 'Aviso';
    const prioridad = colPrioridad !== -1 ? row[colPrioridad] || 'Normal' : 'Normal';
    const enlace_url = colUrl !== -1 ? row[colUrl] : undefined;
    const destacado = colDestacado !== -1 ? parseDestacado(row[colDestacado]) : false;
    const parsedOrden = colOrden !== -1 ? parseNumericOrden(row[colOrden]) : null;
    const orden = parsedOrden ?? -1;

    if (!titulo && !mensaje) continue;

    const isImportant =
      destacado ||
      prioridad.toLowerCase().includes('alta') ||
      prioridad.toLowerCase().includes('urgente') ||
      tipo.toLowerCase().includes('urgente');

    entries.push({
      orden: parsedOrden,
      dateStr: fechaPub,
      item: {
        id,
        fecha_publicacion: fechaPub || 'Hoy',
        fecha_limite: fechaLim,
        titulo,
        mensaje,
        tipo,
        prioridad,
        enlace_url: enlace_url || undefined,
        destacado,
        estado,
        orden,
        author: 'Manuel Herrera',
        important: isImportant,
      },
    });
  }

  return sortByOrdenDesc(entries);
}

export function parseCalendarioRows(rows: string[][]): CalendarEvent[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  // Utilizar EXCLUSIVAMENTE la columna fecha_inicio (nunca fechas de creación, publicación o actualización)
  const colFIni = headers.findIndex(
    (h) => h === 'fecha_inicio' || h === 'fechainicio'
  );
  const colFFin = headers.findIndex(
    (h) => h === 'fecha_fin' || h === 'fechafin'
  );
  const colHIni = headers.findIndex((h) => h === 'hora_inicio' || (h.includes('hora') && !h.includes('fin')));
  const colHFin = headers.findIndex((h) => h === 'hora_fin' || (h.includes('hora') && h.includes('fin')));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'evento' || h === 'title');
  const colDesc = headers.findIndex((h) => h === 'descripcion' || h.includes('desc') || h.includes('detalle'));
  const colCat = headers.findIndex((h) => h === 'categoria' || h.includes('categoria') || h === 'tipo');
  const colLugar = headers.findIndex((h) => h === 'lugar' || h.includes('lugar') || h.includes('ubicacion'));
  const colDestacado = headers.findIndex((h) => h === 'destacado' || h.includes('destacado'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  if (colFIni === -1) return [];

  const events: CalendarEvent[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `cal-${i}`;
    const rawFIni = row[colFIni] ?? '';
    const rawFFin = colFFin !== -1 ? row[colFFin] : '';
    const fIni = formatSpanishDate(rawFIni);
    const fFinRaw = formatSpanishDate(rawFFin);
    const hIni = colHIni !== -1 ? formatSpanishTime(row[colHIni]) : '';
    const hFin = colHFin !== -1 ? formatSpanishTime(row[colHFin]) : '';
    const titulo = colTitulo !== -1 ? (row[colTitulo] || '').trim() : '';
    const descripcion = colDesc !== -1 ? (row[colDesc] || '').trim() : '';
    const rawCat = colCat !== -1 && row[colCat] ? row[colCat].trim() : 'lectivo';
    const lugar = colLugar !== -1 && row[colLugar] ? row[colLugar].trim() : undefined;
    const destacado = colDestacado !== -1 ? parseDestacado(row[colDestacado]) : false;
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    const parsedStart = parseCalendarDateParts(fIni);
    if (!parsedStart) continue;
    if (!titulo && !descripcion) continue;

    const { day, month, year } = parsedStart;
    const startCode = year * 10000 + (month + 1) * 100 + day;
    const parsedEnd = fFinRaw ? parseCalendarDateParts(fFinRaw) : null;
    const endCode = parsedEnd
      ? parsedEnd.year * 10000 + (parsedEnd.month + 1) * 100 + parsedEnd.day
      : null;
    const fFin = parsedEnd && endCode !== null && endCode >= startCode ? fFinRaw : '';

    const catLower = rawCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion' = 'lectivo';
    if (catLower.includes('salida') || catLower.includes('evento') || catLower.includes('excursion') || catLower.includes('visita')) {
      type = 'salida';
    } else if (catLower.includes('festivo') || catLower.includes('no lectivo') || catLower.includes('vacacion')) {
      type = 'festivo';
    } else if (catLower.includes('evaluacion') || catLower.includes('nota') || catLower.includes('trimestre')) {
      type = 'evaluacion';
    }

    let time = '';
    if (hIni && hFin) {
      time = `${hIni} - ${hFin}`;
    } else if (hIni) {
      time = `${hIni} h`;
    } else if (hFin) {
      time = `Hasta ${hFin} h`;
    }

    let descFinal = descripcion;
    if (fFin && fFin !== fIni) {
      descFinal = descripcion ? `Del ${fIni} al ${fFin}. ${descripcion}` : `Del ${fIni} al ${fFin}.`;
    }

    events.push({
      id,
      fecha_inicio: fIni,
      fecha_fin: fFin || undefined,
      hora_inicio: hIni || undefined,
      hora_fin: hFin || undefined,
      titulo,
      descripcion: descFinal,
      categoria: rawCat,
      lugar,
      destacado,
      estado,
      orden,
      day,
      month,
      year,
      title: titulo,
      description: descFinal,
      type,
      time: time || undefined,
    });
  }

  events.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return events;
}

function normalizeDayOfWeek(raw: string): DayOfWeek | null {
  const d = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (d.startsWith('lun')) return 'Lunes';
  if (d.startsWith('mar')) return 'Martes';
  if (d.startsWith('mie') || d === 'x') return 'Miércoles';
  if (d.startsWith('jue')) return 'Jueves';
  if (d.startsWith('vie')) return 'Viernes';
  return null;
}

function getSubjectTheme(subject: string): string {
  const s = subject.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('lengua') || s.includes('lectura') || s.includes('cuento') || s.includes('caligrafia')) {
    return 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900';
  }
  if (s.includes('matematica') || s.includes('calculo') || s.includes('numer')) {
    return 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900';
  }
  if (s.includes('recreo') || s.includes('patio') || s.includes('fruta')) {
    return 'border-l-amber-500 bg-amber-50/50 text-amber-900';
  }
  if (s.includes('musica')) {
    return 'border-l-purple-500 bg-purple-50/50 text-purple-900';
  }
  if (s.includes('fisica') || s.includes('psicomotricidad')) {
    return 'border-l-rose-500 bg-rose-50/50 text-rose-900';
  }
  return 'border-l-slate-400 bg-slate-50/50 text-slate-900';
}

export function parseHorarioRows(rows: string[][]): Record<DayOfWeek, ScheduleItem[]> | null {
  if (rows.length < 2) return null;

  const headers = rows[0].map(normalizeHeader);
  const colDia = headers.findIndex((h) => h === 'dia_semana' || h.includes('dia'));
  const colOrden = headers.findIndex((h) => h === 'orden_sesion' || h === 'orden');
  const colHIni = headers.findIndex((h) => h === 'hora_inicio');
  const colHFin = headers.findIndex((h) => h === 'hora_fin');
  const colAsignatura = headers.findIndex((h) => h === 'asignatura' || h === 'materia');
  const colObs = headers.findIndex((h) => h === 'observaciones' || h === 'aula');

  if (colDia === -1 || colAsignatura === -1) return null;

  const scheduleMap: Record<DayOfWeek, ScheduleItem[]> = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
  };

  let totalItems = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawDia = row[colDia] || '';
    const day = normalizeDayOfWeek(rawDia);
    const asignatura = row[colAsignatura] || '';
    if (!day || !asignatura) continue;

    const orden = colOrden !== -1 ? parseInt(row[colOrden], 10) || i : i;
    const hIni = colHIni !== -1 ? formatSpanishTime(row[colHIni]) : '';
    const hFin = colHFin !== -1 ? formatSpanishTime(row[colHFin]) : '';
    const timeStr = hIni && hFin ? `${hIni} - ${hFin}` : hIni || 'Horario lectivo';
    const observaciones = colObs !== -1 ? row[colObs] || 'Aula 1º B' : 'Aula 1º B';

    scheduleMap[day].push({
      dia_semana: day,
      orden_sesion: orden,
      hora_inicio: hIni,
      hora_fin: hFin,
      asignatura,
      observaciones,
      time: timeStr,
      subject: asignatura,
      loc: observaciones,
      teacher: 'Manuel Herrera',
      color: getSubjectTheme(asignatura),
    });

    totalItems++;
  }

  if (totalItems === 0) return null;

  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  days.forEach((d) => {
    scheduleMap[d].sort((a, b) => (a.orden_sesion ?? 0) - (b.orden_sesion ?? 0) || a.time.localeCompare(b.time));
  });

  return scheduleMap;
}

export function parseMultimediaRows(rows: string[][]): MultimediaItem[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colFecha = headers.findIndex((h) => h === 'fecha' || h.includes('fecha'));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'title');
  const colDesc = headers.findIndex((h) => h === 'descripcion' || h.includes('desc'));
  const colTipo = headers.findIndex((h) => h === 'tipo' || h.includes('tipo'));
  const colMedia = headers.findIndex((h) => h === 'url_media' || h.includes('media') || h.includes('video') || h.includes('foto'));
  const colThumb = headers.findIndex((h) => h === 'miniatura_url' || h.includes('miniatura') || h.includes('thumb'));
  const colAct = headers.findIndex((h) => h === 'actividad_relacionada' || h.includes('actividad'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  const entries: SortableEntry<MultimediaItem>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `media-${i}`;
    const fecha = formatSpanishDate(colFecha !== -1 ? row[colFecha] : '');
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const descripcion = colDesc !== -1 ? row[colDesc] || '' : '';
    const rawTipo = (colTipo !== -1 ? row[colTipo] || '' : '').toUpperCase().trim();
    const tipo: 'FOTOGRAFIA' | 'VIDEO' = rawTipo.includes('VID') ? 'VIDEO' : 'FOTOGRAFIA';
    const url_media = colMedia !== -1 ? row[colMedia] || '' : '';
    const miniatura_url = colThumb !== -1 ? row[colThumb] || undefined : undefined;
    const actividad_relacionada = colAct !== -1 ? row[colAct] || undefined : undefined;
    const parsedOrden = colOrden !== -1 ? parseNumericOrden(row[colOrden]) : null;
    const orden = parsedOrden ?? -1;

    if (!titulo && !url_media) continue;

    let embedUrl: string | undefined = undefined;
    if (tipo === 'VIDEO' && url_media) {
      embedUrl = sanitizeYoutubeEmbedUrl(url_media);
    }

    entries.push({
      orden: parsedOrden,
      dateStr: fecha,
      item: {
        id,
        fecha,
        titulo,
        descripcion,
        tipo,
        url_media,
        miniatura_url,
        actividad_relacionada,
        estado,
        orden,
        embedUrl,
      },
    });
  }

  return sortByOrdenDesc(entries);
}

export function parseAprendemosRows(rows: string[][]): EducationalResource[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colCat = headers.findIndex((h) => h === 'categoria' || h.includes('categoria'));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'title');
  const colDesc = headers.findIndex((h) => h === 'descripcion' || h.includes('desc'));
  const colTipoRec = headers.findIndex((h) => h === 'tipo_recurso' || h.includes('tipo'));
  const colUrlRec = headers.findIndex((h) => h === 'url_recurso' || h.includes('enlace') || h.includes('url') || h.includes('link'));
  const colImg = headers.findIndex((h) => h === 'imagen_url' || h.includes('imagen') || h.includes('foto'));
  const colNivel = headers.findIndex((h) => h === 'nivel' || h.includes('nivel') || h.includes('curso'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  const entries: SortableEntry<EducationalResource>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `aprende-${i}`;
    const rawCat = (colCat !== -1 ? row[colCat] || 'lectura' : 'lectura').trim();
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const descripcion = colDesc !== -1 ? row[colDesc] || '' : '';
    const tipo_recurso = colTipoRec !== -1 ? row[colTipoRec] || 'Pauta' : 'Pauta';
    const url_recurso = colUrlRec !== -1 ? row[colUrlRec] || undefined : undefined;
    const imagen_url = colImg !== -1 ? row[colImg] || undefined : undefined;
    const nivel = colNivel !== -1 ? row[colNivel] || '1.º Primaria' : '1.º Primaria';
    const parsedOrden = colOrden !== -1 ? parseNumericOrden(row[colOrden]) : null;
    const orden = parsedOrden ?? -1;

    if (!titulo && !descripcion) continue;

    const category = normalizeAprendemosCategory(rawCat);

    const { description, tips } = splitAprendemosDescription(descripcion);

    entries.push({
      orden: parsedOrden,
      item: {
        id,
        categoria: rawCat,
        titulo,
        descripcion,
        tipo_recurso,
        url_recurso,
        imagen_url,
        nivel,
        estado,
        orden,
        category,
        title: titulo,
        description,
        level: nivel,
        tips,
        externalUrl: url_recurso,
        externalLabel: url_recurso ? `Consultar ${tipo_recurso}` : undefined,
        badge: tipo_recurso,
      },
    });
  }

  return sortByOrdenDesc(entries);
}

export function parseRecursosRows(rows: string[][]): HomeLearningResource[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colCat = headers.findIndex((h) => h === 'categoria' || h.includes('categoria'));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'title');
  const colDesc = headers.findIndex((h) => h === 'descripcion' || h.includes('desc'));
  const colTipo = headers.findIndex((h) => h === 'tipo_recurso' || h.includes('tipo'));
  const colUrl = headers.findIndex((h) => h === 'url_recurso' || h.includes('enlace') || h.includes('url') || h.includes('link'));
  const colImg = headers.findIndex((h) => h === 'imagen_url' || h.includes('imagen') || h.includes('foto'));
  const colAsignatura = headers.findIndex((h) => h === 'asignatura' || h.includes('materia'));
  const colNivel = headers.findIndex((h) => h === 'nivel' || h.includes('nivel'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));
  const colDestacado = headers.findIndex((h) => h === 'destacado' || h.includes('destacado'));

  const entries: SortableEntry<HomeLearningResource>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    // REGLA ESTRICTA: Solo 'PUBLICAR'
    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `rec-${i}`;
    const rawCat = colCat !== -1 ? (row[colCat] || '').toLowerCase().trim() : '';
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const descripcion = colDesc !== -1 ? row[colDesc] || '' : '';
    const tipo = colTipo !== -1 ? row[colTipo] || 'Recurso didáctico' : 'Recurso didáctico';
    const url = colUrl !== -1 ? row[colUrl] || undefined : undefined;
    const img = colImg !== -1 ? row[colImg] || undefined : undefined;
    const rawAsignatura = colAsignatura !== -1 ? row[colAsignatura] || '' : '';
    const nivel = colNivel !== -1 ? row[colNivel] || '1.º Primaria' : '1.º Primaria';
    const parsedOrden = colOrden !== -1 ? parseNumericOrden(row[colOrden]) : null;
    const orden = parsedOrden ?? -1;
    const destacado = colDestacado !== -1 ? parseDestacado(row[colDestacado]) : false;

    if (!titulo && !descripcion) continue;

    // Restricción curricular: Exclusivamente Lengua Castellana y Matemáticas (+ Familias)
    const asigLower = rawAsignatura.toLowerCase();
    if (
      asigLower.includes('social') ||
      asigLower.includes('natural') ||
      asigLower.includes('ingles') ||
      asigLower.includes('science') ||
      asigLower.includes('english')
    ) {
      continue;
    }

    let categoria: HomeResourceCategory = 'lengua_lectura';
    if (rawCat.includes('mat') || rawCat.includes('calc')) {
      categoria = 'matematicas';
    } else if (rawCat.includes('lengua') || rawCat.includes('lect') || rawCat.includes('escri') || rawCat.includes('cuento')) {
      categoria = 'lengua_lectura';
    } else if (rawCat.includes('familia') || rawCat.includes('orienta') || rawCat.includes('pauta')) {
      categoria = 'familias';
    } else if (rawCat.includes('ficha') || rawCat.includes('pdf') || tipo.toLowerCase().includes('ficha') || tipo.toLowerCase().includes('pdf')) {
      categoria = 'fichas';
    } else if (asigLower.includes('mat')) {
      categoria = 'matematicas';
    } else {
      categoria = 'lengua_lectura';
    }

    let asignatura = 'Lengua Castellana';
    if (categoria === 'matematicas' || asigLower.includes('mat')) {
      asignatura = 'Matemáticas';
    } else if (categoria === 'familias') {
      asignatura = 'Apoyo Familiar';
    }

    entries.push({
      orden: parsedOrden,
      item: {
        id,
        categoria,
        titulo,
        descripcion,
        tipo_recurso: tipo,
        url_recurso: url,
        imagen_url: img,
        asignatura,
        nivel,
        estado,
        orden,
        destacado,
        destacado_casa: destacado,
        tiempo_estimado: tipo.toLowerCase().includes('juego') ? '10 - 15 min' : '5 - 10 min',
      },
    });
  }

  return sortByOrdenDesc(entries);
}

// ============================================================================
// CONSOLIDADOR CENTRAL Y SINCRONIZACIÓN EXCLUSIVA CON GOOGLE APPS SCRIPT
// ============================================================================

export interface SyncResult {
  isPendingConfig?: boolean;
  config: Partial<AppConfig>;
  posts: DiaADiaItem[];
  avisos: AvisoItem[];
  events: CalendarEvent[];
  schedule: Record<DayOfWeek, ScheduleItem[]> | null;
  multimedia: MultimediaItem[];
  aprendemos: EducationalResource[];
  recursos: HomeLearningResource[];
  source: 'apps-script' | 'cache' | 'pending-config' | 'error';
  updatedAt: string;
  errorMessage?: string;
  fromFallback?: boolean;
}

/**
 * Parsea la respuesta integral devuelta por doGet(?action=all) de Google Apps Script
 */
export function parseAppsScriptPayload(rawData: Record<string, unknown>): SyncResult {
  const normalizeSheetId = (rawId: unknown, fallback: string): string => {
    if (rawId === undefined || rawId === null) return fallback;
    const cleaned = String(rawId)
      .replace(/[\u200B-\u200D\uFEFF]/g, '')
      .trim();
    return cleaned || fallback;
  };

  // 1. Config
  const rawConfig = (rawData.config || {}) as Record<string, string>;
  const parsedConfig = parseConfigObject(rawConfig);

  // 2. Dia a dia
  const rawDia = Array.isArray(rawData.dia_a_dia) ? rawData.dia_a_dia : [];
  const posts: DiaADiaItem[] = sortByOrdenDesc(
    rawDia
      .filter((item) => isPayloadItemPublished(item.estado))
      .map((item, idx) => {
        const fecha = formatSpanishDate(item.fecha || '');
        const titulo = item.titulo || '';
        const contenido = item.contenido || '';
        const rawCategoria = item.categoria || '';
        const categoria = rawCategoria.trim() || 'General';
        const postCat = normalizeCategory(categoria);
        const parsedOrden = parseNumericOrden(item.orden);
        const orden = parsedOrden ?? -1;
        const destacado = parseDestacado(item.destacado);
        const isUrgent = postCat === 'Urgente' || categoria.toLowerCase().includes('urgente');

        return {
          orden: parsedOrden,
          dateStr: fecha,
          item: {
            id: normalizeSheetId(item.id, `dia-${idx}`),
            fecha,
            titulo,
            contenido,
            categoria,
            imagen_url: item.imagen_url || undefined,
            enlace_url: item.enlace_url || undefined,
            destacado,
            estado: 'PUBLICAR' as PublicacionEstado,
            orden,
            title: titulo,
            content: contenido,
            tag: postCat,
            date: fecha || 'Hoy',
            timestamp: Date.now() - orden * 1000,
            completed: false,
            important: isUrgent,
            author: 'Manuel Herrera',
            imageUrl: item.imagen_url || undefined,
            icon:
              postCat === 'Tarea'
                ? '📝'
                : postCat === 'Actividad'
                ? '🎨'
                : postCat === 'Urgente'
                ? '🚨'
                : postCat === 'Aviso'
                ? '📢'
                : postCat === 'Proyecto'
                ? '🚀'
                : '📰',
          },
        };
      })
  );

  // 3. Avisos
  const rawAvisos = Array.isArray(rawData.avisos) ? rawData.avisos : [];
  const avisos: AvisoItem[] = sortByOrdenDesc(
    rawAvisos
      .filter((item) => isPayloadItemPublished(item.estado))
      .map((item, idx) => {
        const fechaPub = formatSpanishDate(item.fecha_publicacion || item.fecha || '');
        const fechaLim = item.fecha_limite ? formatSpanishDate(item.fecha_limite) : undefined;
        const titulo = item.titulo || '';
        const mensaje = item.mensaje || item.contenido || '';
        const tipo = item.tipo || 'Aviso';
        const prioridad = item.prioridad || 'Normal';
        const destacado = parseDestacado(item.destacado);
        const parsedOrden = parseNumericOrden(item.orden);
        const orden = parsedOrden ?? -1;
        const isImportant =
          destacado ||
          prioridad.toLowerCase().includes('alta') ||
          prioridad.toLowerCase().includes('urgente') ||
          tipo.toLowerCase().includes('urgente');

        return {
          orden: parsedOrden,
          dateStr: fechaPub,
          item: {
            id: normalizeSheetId(item.id, `aviso-${idx}`),
            fecha_publicacion: fechaPub || 'Hoy',
            fecha_limite: fechaLim,
            titulo,
            mensaje,
            tipo,
            prioridad,
            enlace_url: item.enlace_url || undefined,
            destacado,
            estado: 'PUBLICAR' as PublicacionEstado,
            orden,
            author: 'Manuel Herrera',
            important: isImportant,
          },
        };
      })
  );

  // 4. Calendario (posición determinada EXCLUSIVAMENTE por fecha_inicio y rango hasta fecha_fin)
  const extractStrictCalendarDate = (
    rawItem: Record<string, unknown>,
    targetKeys: readonly string[]
  ): string | Date | number | undefined => {
    for (const k of targetKeys) {
      if (k in rawItem && rawItem[k] !== undefined && rawItem[k] !== null && rawItem[k] !== '') {
        return rawItem[k] as string | Date | number;
      }
    }
    for (const [key, value] of Object.entries(rawItem)) {
      if (value === undefined || value === null || value === '') continue;
      const normKey = normalizeHeader(key);
      if (targetKeys.includes(normKey)) {
        return value as string | Date | number;
      }
    }
    return undefined;
  };

  const rawCal = Array.isArray(rawData.calendario) ? rawData.calendario : [];
  const events: CalendarEvent[] = rawCal
    .filter((item) => isPayloadItemPublished(item.estado))
    .map((item, idx): CalendarEvent | null => {
      const rawStart = extractStrictCalendarDate(item as Record<string, unknown>, [
        'fecha_inicio',
        'fechainicio',
        'fecha_de_inicio',
      ]);
      const rawEnd = extractStrictCalendarDate(item as Record<string, unknown>, [
        'fecha_fin',
        'fechafin',
        'fecha_de_fin',
      ]);
      const fIni = formatSpanishDate(rawStart);
      const fFinRaw = rawEnd !== undefined ? formatSpanishDate(rawEnd) : '';
      const hIni = item.hora_inicio ? formatSpanishTime(String(item.hora_inicio)) : '';
      const hFin = item.hora_fin ? formatSpanishTime(String(item.hora_fin)) : '';
      const titulo = String(item.titulo || '').trim();
      const descripcion = String(item.descripcion || '').trim();
      const rawCat = String(item.categoria || 'lectivo').trim() || 'lectivo';
      const lugar = item.lugar ? String(item.lugar).trim() || undefined : undefined;

      const parsedStart = parseCalendarDateParts(fIni);
      if (!parsedStart) return null;
      if (!titulo && !descripcion) return null;

      const { day, month, year } = parsedStart;
      const startCode = year * 10000 + (month + 1) * 100 + day;
      const parsedEnd = fFinRaw ? parseCalendarDateParts(fFinRaw) : null;
      const endCode = parsedEnd
        ? parsedEnd.year * 10000 + (parsedEnd.month + 1) * 100 + parsedEnd.day
        : null;
      const fFin = parsedEnd && endCode !== null && endCode >= startCode ? fFinRaw : undefined;

      const catLower = rawCat.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      let type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion' = 'lectivo';
      if (catLower.includes('salida') || catLower.includes('evento') || catLower.includes('excursion') || catLower.includes('visita')) {
        type = 'salida';
      } else if (catLower.includes('festivo') || catLower.includes('no lectivo') || catLower.includes('vacacion')) {
        type = 'festivo';
      } else if (catLower.includes('evaluacion') || catLower.includes('nota') || catLower.includes('trimestre')) {
        type = 'evaluacion';
      }

      let time = '';
      if (hIni && hFin) time = `${hIni} - ${hFin}`;
      else if (hIni) time = `${hIni} h`;
      else if (hFin) time = `Hasta ${hFin} h`;

      let descFinal = descripcion;
      if (fFin && fFin !== fIni) {
        descFinal = descripcion ? `Del ${fIni} al ${fFin}. ${descripcion}` : `Del ${fIni} al ${fFin}.`;
      }

      return {
        id: normalizeSheetId(item.id, `cal-${idx}`),
        fecha_inicio: fIni,
        fecha_fin: fFin,
        hora_inicio: hIni || undefined,
        hora_fin: hFin || undefined,
        titulo,
        descripcion: descFinal,
        categoria: rawCat,
        lugar,
        destacado: parseDestacado(item.destacado),
        estado: 'PUBLICAR' as PublicacionEstado,
        orden: typeof item.orden === 'number' ? item.orden : idx,
        day,
        month,
        year,
        title: titulo,
        description: descFinal,
        type,
        time: time || undefined,
      };
    })
    .filter((ev): ev is CalendarEvent => ev !== null)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  // 5. Horario
  const rawHorario = Array.isArray(rawData.horario) ? rawData.horario : [];
  const scheduleMap: Record<DayOfWeek, ScheduleItem[]> = {
    Lunes: [],
    Martes: [],
    Miércoles: [],
    Jueves: [],
    Viernes: [],
  };

  rawHorario.forEach((item, idx) => {
    const day = normalizeDayOfWeek(item.dia_semana || item.dia || '');
    const asignatura = item.asignatura || item.materia || '';
    if (!day || !asignatura) return;

    const orden = typeof item.orden_sesion === 'number' ? item.orden_sesion : idx;
    const hIni = item.hora_inicio ? formatSpanishTime(item.hora_inicio) : '';
    const hFin = item.hora_fin ? formatSpanishTime(item.hora_fin) : '';
    const timeStr = hIni && hFin ? `${hIni} - ${hFin}` : hIni || 'Horario lectivo';
    const observaciones = item.observaciones || item.aula || 'Aula 1º B';

    scheduleMap[day].push({
      dia_semana: day,
      orden_sesion: orden,
      hora_inicio: hIni,
      hora_fin: hFin,
      asignatura,
      observaciones,
      time: timeStr,
      subject: asignatura,
      loc: observaciones,
      teacher: 'Manuel Herrera',
      color: getSubjectTheme(asignatura),
    });
  });

  const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
  days.forEach((d) => {
    scheduleMap[d].sort((a, b) => (a.orden_sesion ?? 0) - (b.orden_sesion ?? 0) || a.time.localeCompare(b.time));
  });

  // 6. Multimedia
  const rawMedia = Array.isArray(rawData.multimedia) ? rawData.multimedia : [];
  const multimedia: MultimediaItem[] = sortByOrdenDesc(
    rawMedia
      .filter((item) => isPayloadItemPublished(item.estado))
      .map((item, idx) => {
        const rawTipo = String(item.tipo || '').toUpperCase();
        const tipo: 'FOTOGRAFIA' | 'VIDEO' = rawTipo.includes('VID') ? 'VIDEO' : 'FOTOGRAFIA';
        const url_media = item.url_media || '';
        const fecha = formatSpanishDate(item.fecha || '');
        const parsedOrden = parseNumericOrden(item.orden);
        const orden = parsedOrden ?? -1;
        let embedUrl: string | undefined = undefined;
        if (tipo === 'VIDEO' && url_media) {
          embedUrl = sanitizeYoutubeEmbedUrl(url_media);
        }

        return {
          orden: parsedOrden,
          dateStr: fecha,
          item: {
            id: normalizeSheetId(item.id, `media-${idx}`),
            fecha,
            titulo: item.titulo || '',
            descripcion: item.descripcion || '',
            tipo,
            url_media,
            miniatura_url: item.miniatura_url || undefined,
            actividad_relacionada: item.actividad_relacionada || undefined,
            estado: 'PUBLICAR' as PublicacionEstado,
            orden,
            embedUrl,
          },
        };
      })
  );

  // 7. Aprendemos (Vida y aprendizajes de clase: Lengua y Matemáticas)
  const rawAprendemos = Array.isArray(rawData.aprendemos) ? rawData.aprendemos : [];
  const aprendemos: EducationalResource[] = sortByOrdenDesc(
    rawAprendemos
      .filter((item) => isPayloadItemPublished(item.estado))
      .map((item, idx) => {
        const rawCat = String(item.categoria || 'lectura').trim();
        const category = normalizeAprendemosCategory(rawCat);

        const titulo = item.titulo || '';
        const descripcion = item.descripcion || '';
        const tipo = item.tipo_recurso || 'Pauta';
        const parsedOrden = parseNumericOrden(item.orden);
        const orden = parsedOrden ?? -1;

        const { description, tips } = splitAprendemosDescription(descripcion);

        return {
          orden: parsedOrden,
          item: {
            id: normalizeSheetId(item.id, `aprende-${idx}`),
            categoria: rawCat,
            titulo,
            descripcion,
            tipo_recurso: tipo,
            url_recurso: item.url_recurso || undefined,
            imagen_url: item.imagen_url || undefined,
            nivel: item.nivel || '1.º Primaria',
            estado: 'PUBLICAR' as PublicacionEstado,
            orden,
            category,
            title: titulo,
            description,
            level: item.nivel || '1.º Primaria',
            tips,
            externalUrl: item.url_recurso || undefined,
            externalLabel: item.url_recurso ? `Consultar ${tipo}` : undefined,
            badge: tipo,
          },
        };
      })
  );

  // 8. Recursos (Biblioteca para casa - 9.ª Pestaña Oficial)
  const rawRecursos = Array.isArray(rawData.recursos) ? rawData.recursos : [];
  const recursos: HomeLearningResource[] = sortByOrdenDesc(
    rawRecursos
      .filter((item) => isPayloadItemPublished(item.estado))
      .filter((item) => {
        const asig = String(item.asignatura || '').toLowerCase();
        return (
          !asig.includes('social') &&
          !asig.includes('natural') &&
          !asig.includes('ingles') &&
          !asig.includes('science') &&
          !asig.includes('english')
        );
      })
      .map((item, idx) => {
        const rawCat = String(item.categoria || '').toLowerCase();
        const tipo = item.tipo_recurso || 'Recurso didáctico';
        let categoria: HomeResourceCategory = 'lengua_lectura';

        if (rawCat.includes('mat') || rawCat.includes('calc')) {
          categoria = 'matematicas';
        } else if (rawCat.includes('lengua') || rawCat.includes('lect') || rawCat.includes('escri') || rawCat.includes('cuento')) {
          categoria = 'lengua_lectura';
        } else if (rawCat.includes('familia') || rawCat.includes('orienta') || rawCat.includes('pauta')) {
          categoria = 'familias';
        } else if (rawCat.includes('ficha') || rawCat.includes('pdf') || tipo.toLowerCase().includes('ficha') || tipo.toLowerCase().includes('pdf')) {
          categoria = 'fichas';
        } else {
          categoria = 'lengua_lectura';
        }

        const destacado = parseDestacado(item.destacado);
        const parsedOrden = parseNumericOrden(item.orden);
        const orden = parsedOrden ?? -1;

        return {
          orden: parsedOrden,
          item: {
            id: normalizeSheetId(item.id, `rec-${idx}`),
            categoria,
            titulo: item.titulo || '',
            descripcion: item.descripcion || '',
            tipo_recurso: tipo,
            url_recurso: item.url_recurso || undefined,
            imagen_url: item.imagen_url || undefined,
            asignatura: categoria === 'matematicas' ? 'Matemáticas' : categoria === 'familias' ? 'Apoyo Familiar' : 'Lengua Castellana',
            nivel: item.nivel || '1.º Primaria',
            estado: 'PUBLICAR' as PublicacionEstado,
            orden,
            destacado,
            destacado_casa: destacado,
            tiempo_estimado: tipo.toLowerCase().includes('juego') ? '10 - 15 min' : '5 - 10 min',
          },
        };
      })
  );

  return {
    isPendingConfig: false,
    config: parsedConfig,
    posts,
    avisos,
    events,
    schedule: Object.values(scheduleMap).some((arr) => arr.length > 0) ? scheduleMap : null,
    multimedia,
    aprendemos,
    recursos,
    source: 'apps-script',
    updatedAt: new Date().toISOString(),
  };
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface SyncDependencies {
  isConfigured?: () => boolean;
  isOnline?: () => boolean;
  storage?: StorageLike | null;
  fetchJsonp?: (baseUrl: string, params: Record<string, string>, timeoutMs: number) => Promise<unknown>;
  fetchDirect?: (url: string, timeoutMs: number) => Promise<unknown>;
  now?: () => number;
}

function getDefaultStorage(): StorageLike | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== 'undefined') {
      return localStorage;
    }
  } catch {
    // Almacenamiento no disponible
  }
  return null;
}

export function hasAnySyncData(result: Partial<SyncResult> | null | undefined): boolean {
  if (!result || typeof result !== 'object') return false;
  const hasConfig = Boolean(result.config && Object.keys(result.config).length > 0);
  const hasSchedule = Boolean(
    result.schedule && Object.values(result.schedule).some((arr) => Array.isArray(arr) && arr.length > 0)
  );
  return (
    hasConfig ||
    hasSchedule ||
    (Array.isArray(result.posts) && result.posts.length > 0) ||
    (Array.isArray(result.avisos) && result.avisos.length > 0) ||
    (Array.isArray(result.events) && result.events.length > 0) ||
    (Array.isArray(result.multimedia) && result.multimedia.length > 0) ||
    (Array.isArray(result.aprendemos) && result.aprendemos.length > 0) ||
    (Array.isArray(result.recursos) && result.recursos.length > 0)
  );
}

/**
 * Lee y normaliza de forma segura la última sincronización válida guardada en `diario_sync_cache_v3`.
 */
export function readCachedSyncResult(storage: StorageLike | null = getDefaultStorage()): SyncResult | null {
  if (!storage) return null;
  try {
    const raw = storage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return null;
    const parsedRaw = JSON.parse(raw) as Partial<SyncResult>;
    if (!parsedRaw || typeof parsedRaw !== 'object') return null;

    const normalized: SyncResult = sortSyncResultPublications({
      isPendingConfig: false,
      config: parsedRaw.config && typeof parsedRaw.config === 'object' ? parsedRaw.config : {},
      posts: Array.isArray(parsedRaw.posts) ? parsedRaw.posts : [],
      avisos: Array.isArray(parsedRaw.avisos) ? parsedRaw.avisos : [],
      events: Array.isArray(parsedRaw.events) ? parsedRaw.events : [],
      schedule: parsedRaw.schedule && typeof parsedRaw.schedule === 'object' ? parsedRaw.schedule : null,
      multimedia: Array.isArray(parsedRaw.multimedia) ? parsedRaw.multimedia : [],
      aprendemos: Array.isArray(parsedRaw.aprendemos) ? parsedRaw.aprendemos : [],
      recursos: Array.isArray(parsedRaw.recursos) ? parsedRaw.recursos : [],
      source: 'cache',
      updatedAt: typeof parsedRaw.updatedAt === 'string' ? parsedRaw.updatedAt : new Date().toISOString(),
    });

    if (!hasAnySyncData(normalized)) {
      return null;
    }

    return normalized;
  } catch {
    return null;
  }
}

/**
 * Recuperación síncrona para hidratación inmediata al abrir la aplicación/PWA.
 * Respeta estrictamente la regla de privacidad cuando VITE_APPS_SCRIPT_URL no está configurada.
 */
export function loadCachedSyncData(): SyncResult | null {
  if (!isAppsScriptConfigured()) {
    return null;
  }
  return readCachedSyncResult();
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return Boolean(val && typeof val === 'object' && !Array.isArray(val));
}

/**
 * Protege los datos válidos cacheados frente a respuestas completamente vacías o incompletas
 * (secciones omitidas o con tipo inesperado en la respuesta del servidor).
 */
export function mergeWithValidCache(
  parsed: SyncResult,
  rawData: Record<string, unknown>,
  cached: SyncResult | null
): { result: SyncResult; shouldPersist: boolean; rejectedEmpty: boolean } {
  if (!cached || !hasAnySyncData(cached)) {
    return {
      result: parsed,
      shouldPersist: hasAnySyncData(parsed),
      rejectedEmpty: false,
    };
  }

  // Nunca sustituir un caché válido completo por una respuesta totalmente vacía
  if (!hasAnySyncData(parsed)) {
    return {
      result: {
        ...cached,
        source: 'cache',
        fromFallback: true,
        errorMessage: 'Respuesta vacía del servidor; se conservan los últimos datos válidos.',
      },
      shouldPersist: false,
      rejectedEmpty: true,
    };
  }

  const hasRawConfig = isPlainObject(rawData.config) && Object.keys(parsed.config).length > 0;
  const hasRawDia = Array.isArray(rawData.dia_a_dia);
  const hasRawAvisos = Array.isArray(rawData.avisos);
  const hasRawCal = Array.isArray(rawData.calendario);
  const hasRawHorario = Array.isArray(rawData.horario);
  const hasRawMedia = Array.isArray(rawData.multimedia);
  const hasRawAprendemos = Array.isArray(rawData.aprendemos);
  const hasRawRecursos = Array.isArray(rawData.recursos);

  const merged: SyncResult = {
    isPendingConfig: false,
    config: hasRawConfig ? { ...cached.config, ...parsed.config } : cached.config,
    posts: hasRawDia ? parsed.posts : cached.posts,
    avisos: hasRawAvisos ? parsed.avisos : cached.avisos,
    events: normalizeCalendarEvents(hasRawCal ? parsed.events : cached.events),
    schedule: hasRawHorario ? (parsed.schedule ?? cached.schedule) : cached.schedule,
    multimedia: hasRawMedia ? parsed.multimedia : cached.multimedia,
    aprendemos: hasRawAprendemos ? parsed.aprendemos : cached.aprendemos,
    recursos: hasRawRecursos ? parsed.recursos : cached.recursos,
    source: 'apps-script',
    updatedAt: parsed.updatedAt,
  };

  return {
    result: merged,
    shouldPersist: true,
    rejectedEmpty: false,
  };
}

let activeSyncPromise: Promise<SyncResult> | null = null;
let activeSyncIsForced = false;

export async function executeSyncWithDeps(
  _forceRefresh = false,
  deps: SyncDependencies = {}
): Promise<SyncResult> {
  const checkConfigured = deps.isConfigured ?? isAppsScriptConfigured;
  const checkOnline =
    deps.isOnline ??
    (() => (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true));
  const storage = deps.storage !== undefined ? deps.storage : getDefaultStorage();
  const runJsonp = deps.fetchJsonp ?? fetchViaJsonp;
  const runFetch = deps.fetchDirect ?? fetchViaFetch;
  const getNow = deps.now ?? (() => Date.now());

  // 1. Si Apps Script NO está configurado, no intentar acceder a Google Sheets directamente
  if (!checkConfigured()) {
    return {
      isPendingConfig: true,
      config: {},
      posts: [],
      avisos: [],
      events: [],
      schedule: null,
      multimedia: [],
      aprendemos: [],
      recursos: [],
      source: 'pending-config',
      updatedAt: new Date().toISOString(),
    };
  }

  const cached = readCachedSyncResult(storage);

  // 2. Si no hay conexión, devolver inmediatamente el último caché válido o error sin bloquear 18s
  if (!checkOnline()) {
    if (cached) {
      return {
        ...cached,
        source: 'cache',
        fromFallback: true,
        errorMessage: 'Sin conexión a Internet',
      };
    }
    return {
      isPendingConfig: false,
      config: {},
      posts: [],
      avisos: [],
      events: [],
      schedule: null,
      multimedia: [],
      aprendemos: [],
      recursos: [],
      source: 'error',
      updatedAt: new Date().toISOString(),
      errorMessage: 'Sin conexión a Internet',
    };
  }

  // 3. Apps Script está configurado y hay red: consultar siempre con timestamp anti-caché
  try {
    const cacheBuster = String(getNow());
    let rawResponse: unknown = null;
    const isValidPayload = (candidate: unknown): candidate is { success: true; data: Record<string, unknown> } => {
      const obj = candidate as { success?: boolean; data?: unknown } | null;
      return Boolean(obj && obj.success === true && isPlainObject(obj.data));
    };

    try {
      rawResponse = await runJsonp(
        APPS_SCRIPT_WEBAPP_URL,
        { action: 'all', t: cacheBuster },
        10000
      );
      if (!isValidPayload(rawResponse)) {
        throw new Error('Respuesta JSONP incompleta');
      }
    } catch {
      rawResponse = await runFetch(
        `${APPS_SCRIPT_WEBAPP_URL}?action=all&t=${cacheBuster}`,
        8000
      );
    }

    if (!isValidPayload(rawResponse)) {
      const errObj = rawResponse as { error?: string } | null;
      throw new Error(errObj?.error || 'Respuesta no válida de Google Apps Script');
    }
    const res = rawResponse;

    const parsed = parseAppsScriptPayload(res.data);
    const { result, shouldPersist } = mergeWithValidCache(parsed, res.data, cached);

    if (shouldPersist && storage) {
      try {
        storage.setItem(CACHE_STORAGE_KEY, JSON.stringify(result));
      } catch {
        // Ignorar fallo de cuota en almacenamiento local
      }
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Error de red al sincronizar con Google Apps Script';

    if (cached) {
      return {
        ...cached,
        source: 'cache',
        fromFallback: true,
        errorMessage,
      };
    }

    return {
      isPendingConfig: false,
      config: {},
      posts: [],
      avisos: [],
      events: [],
      schedule: null,
      multimedia: [],
      aprendemos: [],
      recursos: [],
      source: 'error',
      updatedAt: new Date().toISOString(),
      errorMessage,
    };
  }
}

/**
 * Sincronización Estricta mediante Google Apps Script
 *
 * REGLA DE PRIVACIDAD:
 * Si VITE_APPS_SCRIPT_URL no está configurada, NO realiza peticiones externas.
 * Devuelve un resultado explícito con `isPendingConfig: true` para que la UI muestre
 * el aviso de configuración pendiente, sin exponer Google Sheets ni inventar datos.
 */
export async function syncAllData(forceRefresh = false): Promise<SyncResult> {
  if (!isAppsScriptConfigured()) {
    return executeSyncWithDeps(forceRefresh);
  }

  // Evitar peticiones duplicadas simultáneas del mismo nivel
  if (activeSyncPromise && (!forceRefresh || activeSyncIsForced)) {
    return activeSyncPromise;
  }

  const currentPromise = executeSyncWithDeps(forceRefresh).finally(() => {
    if (activeSyncPromise === currentPromise) {
      activeSyncPromise = null;
      activeSyncIsForced = false;
    }
  });

  activeSyncPromise = currentPromise;
  activeSyncIsForced = forceRefresh;
  return currentPromise;
}
