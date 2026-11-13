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
 * Normaliza el estado de publicación. Solo "PUBLICAR" es visible.
 */
function parseEstado(val: string | undefined): PublicacionEstado {
  const v = (val || '').toUpperCase().trim();
  if (v === 'PUBLICAR') return 'PUBLICAR';
  if (v === 'ARCHIVADO') return 'ARCHIVADO';
  return 'BORRADOR';
}

/**
 * Formatea fechas a DD/MM/AAAA evitando desfases por huso horario UTC
 */
export function formatSpanishDate(rawDate: string): string {
  if (!rawDate) return '';
  const trimmed = rawDate.trim();

  // Si ya viene como "DD/MM/AAAA"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene como formato ISO "AAAA-MM-DD..."
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(trimmed)) {
    const datePart = trimmed.split('T')[0];
    const [y, m, d] = datePart.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene como "DD-MM-AAAA"
  if (/^\d{1,2}-\d{1,2}-\d{4}$/.test(trimmed)) {
    const [d, m, y] = trimmed.split('-');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  return trimmed;
}

/**
 * Extrae día, mes (0-indexado) y año de una fecha DD/MM/AAAA validada.
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

  // Validación real de calendario (ej. bisiestos, meses de 30/31 días) en hora local sin desfase UTC
  const checkDate = new Date(year, month, day);
  if (
    checkDate.getFullYear() !== year ||
    checkDate.getMonth() !== month ||
    checkDate.getDate() !== day
  ) {
    return null;
  }

  return { day, month, year };
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

  const items: DiaADiaItem[] = [];

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
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    if (!titulo && !contenido) continue;

    const postCat = normalizeCategory(categoria);
    const isUrgent = postCat === 'Urgente' || categoria.toLowerCase().includes('urgente');

    items.push({
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
    });
  }

  items.sort((a, b) => a.orden - b.orden);
  return items;
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

  const avisos: AvisoItem[] = [];

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
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    if (!titulo && !mensaje) continue;

    const isImportant =
      destacado ||
      prioridad.toLowerCase().includes('alta') ||
      prioridad.toLowerCase().includes('urgente') ||
      tipo.toLowerCase().includes('urgente');

    avisos.push({
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
    });
  }

  avisos.sort((a, b) => a.orden - b.orden);
  return avisos;
}

export function parseCalendarioRows(rows: string[][]): CalendarEvent[] {
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeHeader);
  const colId = headers.findIndex((h) => h === 'id' || h.includes('identifica'));
  const colFIni = headers.findIndex((h) => h === 'fecha_inicio' || h.includes('inicio') || (h.includes('fecha') && !h.includes('fin')));
  const colFFin = headers.findIndex((h) => h === 'fecha_fin' || h.includes('fin'));
  const colHIni = headers.findIndex((h) => h === 'hora_inicio' || (h.includes('hora') && !h.includes('fin')));
  const colHFin = headers.findIndex((h) => h === 'hora_fin' || (h.includes('hora') && h.includes('fin')));
  const colTitulo = headers.findIndex((h) => h === 'titulo' || h.includes('titulo') || h === 'evento' || h === 'title');
  const colDesc = headers.findIndex((h) => h === 'descripcion' || h.includes('desc') || h.includes('detalle'));
  const colCat = headers.findIndex((h) => h === 'categoria' || h.includes('categoria') || h === 'tipo');
  const colLugar = headers.findIndex((h) => h === 'lugar' || h.includes('lugar') || h.includes('ubicacion'));
  const colDestacado = headers.findIndex((h) => h === 'destacado' || h.includes('destacado'));
  const colEstado = headers.findIndex((h) => h === 'estado' || h.includes('estado'));
  const colOrden = headers.findIndex((h) => h === 'orden' || h.includes('orden'));

  const events: CalendarEvent[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `cal-${i}`;
    const rawFIni = colFIni !== -1 ? row[colFIni] : '';
    const rawFFin = colFFin !== -1 ? row[colFFin] : '';
    const fIni = formatSpanishDate(rawFIni);
    const fFinRaw = formatSpanishDate(rawFFin);
    const hIni = colHIni !== -1 ? formatSpanishTime(row[colHIni]) : '';
    const hFin = colHFin !== -1 ? formatSpanishTime(row[colHFin]) : '';
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const descripcion = colDesc !== -1 ? row[colDesc] || '' : '';
    const rawCat = colCat !== -1 ? row[colCat] || 'lectivo' : 'lectivo';
    const lugar = colLugar !== -1 ? row[colLugar] || undefined : undefined;
    const destacado = colDestacado !== -1 ? parseDestacado(row[colDestacado]) : false;
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    const parsedStart = parseCalendarDateParts(fIni);
    if (!parsedStart) continue;
    if (!titulo && !descripcion) continue;

    const { day, month, year } = parsedStart;
    const parsedEnd = fFinRaw ? parseCalendarDateParts(fFinRaw) : null;
    const fFin = parsedEnd ? fFinRaw : '';

    const catLower = rawCat.toLowerCase();
    let type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion' = 'lectivo';
    if (catLower.includes('salida') || catLower.includes('excursion') || catLower.includes('visita')) {
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
    }

    let descFinal = descripcion;
    if (fFin && fFin !== fIni) {
      descFinal = `Del ${fIni} al ${fFin}. ${descripcion}`;
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

  const items: MultimediaItem[] = [];

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
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    if (!titulo && !url_media) continue;

    let embedUrl: string | undefined = undefined;
    if (tipo === 'VIDEO' && url_media) {
      embedUrl = sanitizeYoutubeEmbedUrl(url_media);
    }

    items.push({
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
    });
  }

  items.sort((a, b) => a.orden - b.orden);
  return items;
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

  const resources: EducationalResource[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawEstado = colEstado !== -1 ? row[colEstado] : 'PUBLICAR';
    const estado = parseEstado(rawEstado);

    if (estado !== 'PUBLICAR') continue;

    const id = colId !== -1 && row[colId] ? row[colId] : `aprende-${i}`;
    const rawCat = (colCat !== -1 ? row[colCat] || 'lectura' : 'lectura').toLowerCase().trim();
    const titulo = colTitulo !== -1 ? row[colTitulo] || '' : '';
    const descripcion = colDesc !== -1 ? row[colDesc] || '' : '';
    const tipo_recurso = colTipoRec !== -1 ? row[colTipoRec] || 'Pauta' : 'Pauta';
    const url_recurso = colUrlRec !== -1 ? row[colUrlRec] || undefined : undefined;
    const imagen_url = colImg !== -1 ? row[colImg] || undefined : undefined;
    const nivel = colNivel !== -1 ? row[colNivel] || '1.º Primaria' : '1.º Primaria';
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;

    if (!titulo && !descripcion) continue;

    let category: 'lengua' | 'matematicas' | 'lectura' | 'escritura' | 'calculo' | 'pautas' = 'lectura';
    if (rawCat.includes('lengua') || rawCat.includes('lect')) category = 'lectura';
    else if (rawCat.includes('escri') || rawCat.includes('trazo') || rawCat.includes('cali')) category = 'escritura';
    else if (rawCat.includes('mat') || rawCat.includes('calc') || rawCat.includes('logica')) category = 'matematicas';
    else if (rawCat.includes('pauta') || rawCat.includes('habito')) category = 'pautas';
    else category = 'lectura';

    const tips: string[] = [];
    if (descripcion.includes('\n')) {
      descripcion.split('\n').forEach((line) => {
        const clean = line.replace(/^[•\-\*]\s*/, '').trim();
        if (clean.length > 0) tips.push(clean);
      });
    } else if (descripcion.includes(';')) {
      descripcion.split(';').forEach((p) => {
        const clean = p.trim();
        if (clean.length > 0) tips.push(clean);
      });
    }

    resources.push({
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
      description: tips.length > 0 ? tips[0] : descripcion,
      level: nivel,
      tips: tips.length > 0 ? tips : [descripcion],
      externalUrl: url_recurso,
      externalLabel: url_recurso ? `Consultar ${tipo_recurso}` : undefined,
      badge: tipo_recurso,
    });
  }

  resources.sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
  return resources;
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

  const items: HomeLearningResource[] = [];

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
    const orden = colOrden !== -1 ? parseFloat(row[colOrden]) || i : i;
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

    items.push({
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
    });
  }

  items.sort((a, b) => a.orden - b.orden);
  return items;
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
  source: 'apps-script' | 'cache' | 'pending-config';
  updatedAt: string;
}

/**
 * Parsea la respuesta integral devuelta por doGet(?action=all) de Google Apps Script
 */
export function parseAppsScriptPayload(rawData: Record<string, unknown>): SyncResult {
  // 1. Config
  const rawConfig = (rawData.config || {}) as Record<string, string>;
  const parsedConfig = parseConfigObject(rawConfig);

  // 2. Dia a dia
  const rawDia = Array.isArray(rawData.dia_a_dia) ? rawData.dia_a_dia : [];
  const posts: DiaADiaItem[] = rawDia
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
    .map((item, idx) => {
      const fecha = formatSpanishDate(item.fecha || '');
      const titulo = item.titulo || '';
      const contenido = item.contenido || '';
      const rawCategoria = item.categoria || '';
      const categoria = rawCategoria.trim() || 'General';
      const postCat = normalizeCategory(categoria);
      const orden = typeof item.orden === 'number' ? item.orden : idx;
      const destacado = parseDestacado(item.destacado);
      const isUrgent = postCat === 'Urgente' || categoria.toLowerCase().includes('urgente');

      return {
        id: item.id || `dia-${idx}`,
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
      };
    })
    .sort((a, b) => a.orden - b.orden);

  // 3. Avisos
  const rawAvisos = Array.isArray(rawData.avisos) ? rawData.avisos : [];
  const avisos: AvisoItem[] = rawAvisos
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
    .map((item, idx) => {
      const fechaPub = formatSpanishDate(item.fecha_publicacion || item.fecha || '');
      const fechaLim = item.fecha_limite ? formatSpanishDate(item.fecha_limite) : undefined;
      const titulo = item.titulo || '';
      const mensaje = item.mensaje || item.contenido || '';
      const tipo = item.tipo || 'Aviso';
      const prioridad = item.prioridad || 'Normal';
      const destacado = parseDestacado(item.destacado);
      const isImportant =
        destacado ||
        prioridad.toLowerCase().includes('alta') ||
        prioridad.toLowerCase().includes('urgente') ||
        tipo.toLowerCase().includes('urgente');

      return {
        id: item.id || `aviso-${idx}`,
        fecha_publicacion: fechaPub || 'Hoy',
        fecha_limite: fechaLim,
        titulo,
        mensaje,
        tipo,
        prioridad,
        enlace_url: item.enlace_url || undefined,
        destacado,
        estado: 'PUBLICAR' as PublicacionEstado,
        orden: typeof item.orden === 'number' ? item.orden : idx,
        author: 'Manuel Herrera',
        important: isImportant,
      };
    })
    .sort((a, b) => a.orden - b.orden);

  // 4. Calendario
  const rawCal = Array.isArray(rawData.calendario) ? rawData.calendario : [];
  const events: CalendarEvent[] = rawCal
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
    .map((item, idx): CalendarEvent | null => {
      const fIni = formatSpanishDate(item.fecha_inicio || item.fecha || '');
      const fFinRaw = item.fecha_fin ? formatSpanishDate(item.fecha_fin) : '';
      const hIni = item.hora_inicio ? formatSpanishTime(item.hora_inicio) : '';
      const hFin = item.hora_fin ? formatSpanishTime(item.hora_fin) : '';
      const titulo = item.titulo || '';
      const descripcion = item.descripcion || '';
      const rawCat = item.categoria || 'lectivo';

      const parsedStart = parseCalendarDateParts(fIni);
      if (!parsedStart) return null;
      if (!titulo && !descripcion) return null;

      const { day, month, year } = parsedStart;
      const parsedEnd = fFinRaw ? parseCalendarDateParts(fFinRaw) : null;
      const fFin = parsedEnd ? fFinRaw : undefined;

      const catLower = rawCat.toLowerCase();
      let type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion' = 'lectivo';
      if (catLower.includes('salida') || catLower.includes('excursion') || catLower.includes('visita')) {
        type = 'salida';
      } else if (catLower.includes('festivo') || catLower.includes('no lectivo') || catLower.includes('vacacion')) {
        type = 'festivo';
      } else if (catLower.includes('evaluacion') || catLower.includes('nota') || catLower.includes('trimestre')) {
        type = 'evaluacion';
      }

      let time = '';
      if (hIni && hFin) time = `${hIni} - ${hFin}`;
      else if (hIni) time = `${hIni} h`;

      let descFinal = descripcion;
      if (fFin && fFin !== fIni) {
        descFinal = `Del ${fIni} al ${fFin}. ${descripcion}`;
      }

      return {
        id: item.id || `cal-${idx}`,
        fecha_inicio: fIni,
        fecha_fin: fFin,
        hora_inicio: hIni || undefined,
        hora_fin: hFin || undefined,
        titulo,
        descripcion: descFinal,
        categoria: rawCat,
        lugar: item.lugar || undefined,
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
  const multimedia: MultimediaItem[] = rawMedia
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
    .map((item, idx) => {
      const rawTipo = String(item.tipo || '').toUpperCase();
      const tipo: 'FOTOGRAFIA' | 'VIDEO' = rawTipo.includes('VID') ? 'VIDEO' : 'FOTOGRAFIA';
      const url_media = item.url_media || '';
      let embedUrl: string | undefined = undefined;
      if (tipo === 'VIDEO' && url_media) {
        embedUrl = sanitizeYoutubeEmbedUrl(url_media);
      }

      return {
        id: item.id || `media-${idx}`,
        fecha: formatSpanishDate(item.fecha || ''),
        titulo: item.titulo || '',
        descripcion: item.descripcion || '',
        tipo,
        url_media,
        miniatura_url: item.miniatura_url || undefined,
        actividad_relacionada: item.actividad_relacionada || undefined,
        estado: 'PUBLICAR' as PublicacionEstado,
        orden: typeof item.orden === 'number' ? item.orden : idx,
        embedUrl,
      };
    })
    .sort((a, b) => a.orden - b.orden);

  // 7. Aprendemos (Vida y aprendizajes de clase: Lengua y Matemáticas)
  const rawAprendemos = Array.isArray(rawData.aprendemos) ? rawData.aprendemos : [];
  const aprendemos: EducationalResource[] = rawAprendemos
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
    .map((item, idx) => {
      const rawCat = String(item.categoria || 'lectura').toLowerCase();
      let category: 'lengua' | 'matematicas' | 'lectura' | 'escritura' | 'calculo' | 'pautas' = 'lectura';
      if (rawCat.includes('lengua') || rawCat.includes('lect')) category = 'lectura';
      else if (rawCat.includes('escri') || rawCat.includes('trazo') || rawCat.includes('cali')) category = 'escritura';
      else if (rawCat.includes('mat') || rawCat.includes('calc')) category = 'matematicas';
      else if (rawCat.includes('pauta')) category = 'pautas';

      const titulo = item.titulo || '';
      const descripcion = item.descripcion || '';
      const tipo = item.tipo_recurso || 'Pauta';

      const tips: string[] = [];
      if (descripcion.includes('\n')) {
        descripcion.split('\n').forEach((line: string) => {
          const clean = line.replace(/^[•\-\*]\s*/, '').trim();
          if (clean.length > 0) tips.push(clean);
        });
      }

      return {
        id: item.id || `aprende-${idx}`,
        categoria: rawCat,
        titulo,
        descripcion,
        tipo_recurso: tipo,
        url_recurso: item.url_recurso || undefined,
        imagen_url: item.imagen_url || undefined,
        nivel: item.nivel || '1.º Primaria',
        estado: 'PUBLICAR' as PublicacionEstado,
        orden: typeof item.orden === 'number' ? item.orden : idx,
        category,
        title: titulo,
        description: tips.length > 0 ? tips[0] : descripcion,
        level: item.nivel || '1.º Primaria',
        tips: tips.length > 0 ? tips : [descripcion],
        externalUrl: item.url_recurso || undefined,
        externalLabel: item.url_recurso ? `Consultar ${tipo}` : undefined,
        badge: tipo,
      };
    })
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  // 8. Recursos (Biblioteca para casa - 9.ª Pestaña Oficial)
  const rawRecursos = Array.isArray(rawData.recursos) ? rawData.recursos : [];
  const recursos: HomeLearningResource[] = rawRecursos
    .filter((item) => (item.estado || 'PUBLICAR').toUpperCase() === 'PUBLICAR')
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

      return {
        id: item.id || `rec-${idx}`,
        categoria,
        titulo: item.titulo || '',
        descripcion: item.descripcion || '',
        tipo_recurso: tipo,
        url_recurso: item.url_recurso || undefined,
        imagen_url: item.imagen_url || undefined,
        asignatura: categoria === 'matematicas' ? 'Matemáticas' : categoria === 'familias' ? 'Apoyo Familiar' : 'Lengua Castellana',
        nivel: item.nivel || '1.º Primaria',
        estado: 'PUBLICAR' as PublicacionEstado,
        orden: typeof item.orden === 'number' ? item.orden : idx,
        destacado,
        destacado_casa: destacado,
        tiempo_estimado: tipo.toLowerCase().includes('juego') ? '10 - 15 min' : '5 - 10 min',
      };
    })
    .sort((a, b) => a.orden - b.orden);

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

/**
 * Sincronización Estricta mediante Google Apps Script
 *
 * REGLA DE PRIVACIDAD:
 * Si VITE_APPS_SCRIPT_URL no está configurada, NO realiza peticiones externas.
 * Devuelve un resultado explícito con `isPendingConfig: true` para que la UI muestre
 * el aviso de configuración pendiente, sin exponer Google Sheets ni inventar datos.
 */
export async function syncAllData(forceRefresh = false): Promise<SyncResult> {
  // 1. Si Apps Script NO está configurado, no intentar acceder a Google Sheets directamente
  if (!isAppsScriptConfigured()) {
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

  // 2. Apps Script está configurado: consultar el intermediario de lectura segura
  try {
    let rawResponse: unknown = null;

    try {
      rawResponse = await fetchViaJsonp<{ success: boolean; data: Record<string, unknown> }>(
        APPS_SCRIPT_WEBAPP_URL,
        { action: 'all', t: forceRefresh ? String(Date.now()) : '' },
        10000
      );
    } catch {
      rawResponse = await fetchViaFetch<{ success: boolean; data: Record<string, unknown> }>(
        `${APPS_SCRIPT_WEBAPP_URL}?action=all&t=${Date.now()}`,
        8000
      );
    }

    const res = rawResponse as { success?: boolean; data?: Record<string, unknown> };
    if (res && res.success && res.data) {
      const parsed = parseAppsScriptPayload(res.data);
      try {
        localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(parsed));
      } catch {
        // Fallback ignorar
      }
      return parsed;
    }
  } catch {
    // Si falla la red, intentar recuperar la última sincronización válida en caché
    try {
      const cached = localStorage.getItem(CACHE_STORAGE_KEY);
      if (cached) {
        const parsedCache = JSON.parse(cached) as SyncResult;
        parsedCache.source = 'cache';
        return parsedCache;
      }
    } catch {
      // Ignorar fallo de caché
    }
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
    source: 'pending-config',
    updatedAt: new Date().toISOString(),
  };
}
