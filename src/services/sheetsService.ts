import { Notice, PostCategory, DayOfWeek, ScheduleItem, CalendarEvent } from '../types';

/**
 * URLs de sincronización con Google Sheets (publicadas en la web como CSV).
 * Si tu enlace general contiene '/spreadsheets/d/ID/...', la app detecta automáticamente
 * las pestañas 'Calendario' y 'Horario' usando el parámetro sheet=.
 * Si prefieres publicar cada pestaña por separado, puedes pegar el enlace directo abajo:
 */
export const SHEETS_CSV_URL = 'PEGA_AQUÍ_TU_ENLACE_CSV_DE_GOOGLE_SHEETS';
export const SHEETS_CALENDARIO_CSV_URL = 'PEGA_AQUÍ_TU_ENLACE_CSV_CALENDARIO_SI_ES_INDIVIDUAL';
export const SHEETS_HORARIO_CSV_URL = 'PEGA_AQUÍ_TU_ENLACE_CSV_HORARIO_SI_ES_INDIVIDUAL';

/**
 * Helper para obtener la URL de una pestaña específica de Google Sheets
 */
function resolveSheetTabUrl(tabName: 'Calendario' | 'Horario', explicitUrl: string): string | null {
  if (explicitUrl && !explicitUrl.includes('PEGA_AQUÍ') && !explicitUrl.startsWith('[')) {
    return explicitUrl.trim();
  }

  const mainUrl = SHEETS_CSV_URL.trim();
  if (!mainUrl || mainUrl.includes('PEGA_AQUÍ') || mainUrl.startsWith('[')) {
    return null;
  }

  // Extraer el ID del documento de Google Sheets
  const match = mainUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const spreadsheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
  }

  return null;
}

/**
 * Parses CSV text, handling quotes, commas, and newlines properly
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
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \r\n
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
 * Normalizes category string to valid PostCategory
 */
function normalizeCategory(raw: string): PostCategory {
  const lower = (raw || '').toLowerCase().trim();
  if (lower.includes('tarea') || lower.includes('deber')) return 'Tarea';
  if (lower.includes('clase') || lower.includes('actividad')) return 'Actividad';
  if (lower.includes('urgente') || lower.includes('importante')) return 'Urgente';
  // Pruebas y controles se integran directamente como avisos generales informativos
  return 'Aviso';
}

/**
 * Sincronización de Avisos desde Google Sheets (Pestaña 1 o CSV principal)
 */
export async function fetchNoticesFromSheets(customUrl?: string): Promise<Notice[]> {
  const rawUrl = (customUrl && customUrl.trim()) ? customUrl.trim() : SHEETS_CSV_URL;
  let targetUrl = rawUrl;

  if (
    !targetUrl ||
    targetUrl.includes('PEGA_AQUÍ') ||
    targetUrl.includes('Pega aquí') ||
    targetUrl.startsWith('[')
  ) {
    targetUrl = '/assets/aistudio/Avisos_Diario_del_Aula_e401b35e';
  }

  if (
    targetUrl.includes('docs.google.com/spreadsheets/d/') &&
    !targetUrl.includes('output=csv') &&
    !targetUrl.includes('pub?') &&
    !targetUrl.includes('tqx=out:csv')
  ) {
    const match = targetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      targetUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/pub?output=csv`;
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: { Accept: 'text/csv, application/json, text/plain, */*' },
      cache: 'no-cache',
    });

    if (!response.ok) {
      if (targetUrl.includes('e401b35e')) {
        const fallbackRes = await fetch('/assets/aistudio/Avisos_Diario_del_Aula_b20562b7');
        if (fallbackRes.ok) {
          const fallbackText = await fallbackRes.text();
          return parseNoticesFromCSV(fallbackText);
        }
      }
      return [];
    }

    const text = await response.text();
    if (!text || !text.trim()) return [];

    return parseNoticesFromCSV(text);
  } catch {
    return [];
  }
}

function parseNoticesFromCSV(csvText: string): Notice[] {
  const rows = parseCSV(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map((h) =>
    h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  );
  const colDate = headers.findIndex((h) => h.includes('fecha') || h.includes('date'));
  const colCat = headers.findIndex((h) => h.includes('categoria') || h.includes('tipo') || h.includes('tag'));
  const colTitle = headers.findIndex((h) => h.includes('titulo') || h.includes('title') || h.includes('asunto'));
  const colMsg = headers.findIndex((h) => h.includes('mensaje') || h.includes('texto') || h.includes('contenido') || h.includes('desc'));
  const colIcon = headers.findIndex((h) => h.includes('icono') || h.includes('icon'));
  const colUrgente = headers.findIndex((h) => h.includes('urgente') || h.includes('importante'));

  const notices: Notice[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

    const rawTitle = colTitle !== -1 ? row[colTitle] : row[2] || row[0];
    const rawMsg = colMsg !== -1 ? row[colMsg] : row[3] || row[1];
    const rawCat = colCat !== -1 ? row[colCat] : row[1] || 'Aviso';
    const rawDate = colDate !== -1 ? row[colDate] : row[0] || 'Hoy';
    const rawIcon = colIcon !== -1 ? row[colIcon] : undefined;
    const rawUrgente = colUrgente !== -1 ? row[colUrgente] : '';

    if (!rawTitle && !rawMsg) continue;

    const category = normalizeCategory(rawCat);
    const isUrgente =
      category === 'Urgente' ||
      rawUrgente.toUpperCase() === 'SI' ||
      rawUrgente.toUpperCase() === 'SÍ';

    notices.push({
      id: `notice-${i}-${rawTitle.replace(/\s+/g, '_')}`,
      title: rawTitle || 'Aviso de aula',
      tag: category,
      date: rawDate || 'Hoy',
      timestamp: Date.now() - i * 1000,
      content: rawMsg || '',
      author: 'Manuel Herrera',
      completed: false,
      important: isUrgente,
      icon: rawIcon,
      source: 'sheets',
    });
  }

  return notices;
}

/**
 * Helper para asignar color visual en Tailwind según el nombre de la asignatura
 */
function getSubjectTheme(subject: string): string {
  const s = subject.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (s.includes('lengua') || s.includes('lectura') || s.includes('cuento') || s.includes('caligrafia')) {
    return 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900';
  }
  if (s.includes('matematica') || s.includes('calculo') || s.includes('numer')) {
    return 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900';
  }
  if (s.includes('ingles') || s.includes('idioma') || s.includes('english')) {
    return 'border-l-sky-500 bg-sky-50/50 text-sky-900';
  }
  if (s.includes('fisica') || s.includes('deporte') || s.includes('psicomotricidad') || s.includes('gimnasia')) {
    return 'border-l-rose-500 bg-rose-50/50 text-rose-900';
  }
  if (s.includes('musica')) {
    return 'border-l-purple-500 bg-purple-50/50 text-purple-900';
  }
  if (s.includes('natural') || s.includes('social') || s.includes('ciencia') || s.includes('experimento')) {
    return 'border-l-teal-500 bg-teal-50/50 text-teal-900';
  }
  if (s.includes('plastica') || s.includes('arte') || s.includes('dibujo') || s.includes('manualidad')) {
    return 'border-l-amber-500 bg-amber-50/50 text-amber-900';
  }
  if (s.includes('recreo') || s.includes('patio') || s.includes('fruta')) {
    return 'border-l-amber-500 bg-amber-50/50 text-amber-900';
  }
  return 'border-l-slate-400 bg-slate-50/50 text-slate-900';
}

/**
 * Normaliza nombres de días a DayOfWeek
 */
function normalizeDayOfWeek(raw: string): DayOfWeek | null {
  const d = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (d.startsWith('lun')) return 'Lunes';
  if (d.startsWith('mar')) return 'Martes';
  if (d.startsWith('mie') || d === 'x') return 'Miércoles';
  if (d.startsWith('jue')) return 'Jueves';
  if (d.startsWith('vie')) return 'Viernes';
  return null;
}

/**
 * Sincronización en segundo plano de la pestaña 'Horario' desde Google Sheets.
 * Columnas esperadas: hora, dia, asignatura, aula_o_nota
 * CERO localStorage: se procesa directamente en memoria.
 */
export async function fetchScheduleFromSheets(): Promise<Record<DayOfWeek, ScheduleItem[]> | null> {
  const url = resolveSheetTabUrl('Horario', SHEETS_HORARIO_CSV_URL);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/csv, application/json, text/plain, */*' },
      cache: 'no-cache',
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (!text || !text.trim()) return null;

    const rows = parseCSV(text);
    if (rows.length < 2) return null;

    const headers = rows[0].map((h) =>
      h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    const colHora = headers.findIndex((h) => h.includes('hora') || h.includes('time'));
    const colDia = headers.findIndex((h) => h.includes('dia') || h.includes('day'));
    const colAsignatura = headers.findIndex((h) => h.includes('asignatura') || h.includes('materia') || h.includes('clase'));
    const colAula = headers.findIndex((h) => h.includes('aula') || h.includes('nota') || h.includes('lugar') || h.includes('loc'));

    if (colHora === -1 || colDia === -1 || colAsignatura === -1) {
      return null;
    }

    const scheduleMap: Record<DayOfWeek, ScheduleItem[]> = {
      Lunes: [],
      Martes: [],
      Miércoles: [],
      Jueves: [],
      Viernes: [],
    };

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

      const rawHora = row[colHora] || '';
      const rawDia = row[colDia] || '';
      const rawAsignatura = row[colAsignatura] || '';
      const rawAula = colAula !== -1 ? row[colAula] || 'Aula 1ºB' : 'Aula 1ºB';

      const validDay = normalizeDayOfWeek(rawDia);
      if (!validDay || !rawAsignatura) continue;

      scheduleMap[validDay].push({
        time: rawHora,
        subject: rawAsignatura,
        loc: rawAula,
        teacher: 'Manuel Herrera',
        color: getSubjectTheme(rawAsignatura),
      });
    }

    // Ordenar las clases de cada día por hora
    const days: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    let totalItems = 0;
    days.forEach((d) => {
      totalItems += scheduleMap[d].length;
      scheduleMap[d].sort((a, b) => a.time.localeCompare(b.time));
    });

    if (totalItems === 0) return null;
    return scheduleMap;
  } catch {
    return null;
  }
}

/**
 * Normaliza tipos de evento del calendario escolar
 */
function normalizeEventType(raw: string): 'lectivo' | 'salida' | 'festivo' | 'evaluacion' {
  const t = (raw || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  if (t.includes('salida') || t.includes('excursion') || t.includes('visita') || t.includes('taller')) return 'salida';
  if (t.includes('festivo') || t.includes('no lectivo') || t.includes('vacacion') || t.includes('puente')) return 'festivo';
  if (t.includes('evaluacion') || t.includes('nota') || t.includes('boletin') || t.includes('trimestre')) return 'evaluacion';
  return 'lectivo';
}

/**
 * Sincronización en segundo plano de la pestaña 'Calendario' desde Google Sheets.
 * Columnas esperadas: fecha, evento, descripcion, tipo
 * CERO localStorage: se procesa directamente en memoria.
 */
export async function fetchCalendarFromSheets(): Promise<CalendarEvent[] | null> {
  const url = resolveSheetTabUrl('Calendario', SHEETS_CALENDARIO_CSV_URL);
  if (!url) return null;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'text/csv, application/json, text/plain, */*' },
      cache: 'no-cache',
    });

    if (!response.ok) return null;

    const text = await response.text();
    if (!text || !text.trim()) return null;

    const rows = parseCSV(text);
    if (rows.length < 2) return null;

    const headers = rows[0].map((h) =>
      h.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    );
    const colFecha = headers.findIndex((h) => h.includes('fecha') || h.includes('date'));
    const colEvento = headers.findIndex((h) => h.includes('evento') || h.includes('titulo') || h.includes('actividad'));
    const colDesc = headers.findIndex((h) => h.includes('desc') || h.includes('detalle') || h.includes('info'));
    const colTipo = headers.findIndex((h) => h.includes('tipo') || h.includes('categoria'));

    if (colFecha === -1 || colEvento === -1) {
      return null;
    }

    const events: CalendarEvent[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length === 0 || !row.some((cell) => cell.length > 0)) continue;

      const rawFecha = row[colFecha] || '';
      const rawEvento = row[colEvento] || '';
      const rawDesc = colDesc !== -1 ? row[colDesc] || '' : '';
      const rawTipo = colTipo !== -1 ? row[colTipo] || 'lectivo' : 'lectivo';

      if (!rawFecha || !rawEvento) continue;

      // Parsing de fecha: soporta "DD/MM/YYYY", "YYYY-MM-DD", "DD-MM-YYYY"
      let day = 1;
      let month = 10; // Default Noviembre (0-indexed: 10)
      let year = 2026;

      const partsSlash = rawFecha.split('/');
      const partsHyphen = rawFecha.split('-');

      if (partsSlash.length === 3) {
        day = parseInt(partsSlash[0], 10) || 1;
        month = (parseInt(partsSlash[1], 10) || 11) - 1; // 0-indexed
        year = parseInt(partsSlash[2], 10) || 2026;
      } else if (partsHyphen.length === 3) {
        if (partsHyphen[0].length === 4) {
          // YYYY-MM-DD
          year = parseInt(partsHyphen[0], 10) || 2026;
          month = (parseInt(partsHyphen[1], 10) || 11) - 1;
          day = parseInt(partsHyphen[2], 10) || 1;
        } else {
          // DD-MM-YYYY
          day = parseInt(partsHyphen[0], 10) || 1;
          month = (parseInt(partsHyphen[1], 10) || 11) - 1;
          year = parseInt(partsHyphen[2], 10) || 2026;
        }
      }

      events.push({
        id: `event-${i}-${rawEvento.replace(/\s+/g, '_')}`,
        day,
        month,
        year,
        title: rawEvento,
        description: rawDesc,
        type: normalizeEventType(rawTipo),
      });
    }

    if (events.length === 0) return null;
    return events;
  } catch {
    return null;
  }
}
