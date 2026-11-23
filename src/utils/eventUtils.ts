import { CalendarEvent } from '../types';
import { formatSpanishDate, parseCalendarDateParts } from '../services/sheetsService';

export const MADRID_TIMEZONE = 'Europe/Madrid';

const WEEKDAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

const MONTH_NAMES_LOWER_ES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
] as const;

const WEEKDAY_SHORT_TO_INDEX: Record<string, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export interface CalendarDateParts {
  day: number;
  month: number; // 0-indexed (0 = Enero ... 11 = Diciembre)
  year: number;
}

/**
 * Obtiene la fecha actual en la zona horaria oficial Europe/Madrid
 * evitando desplazamientos cuando el dispositivo tiene otro huso horario.
 */
export function getMadridDateParts(
  date: Date = new Date()
): CalendarDateParts & { dayOfWeek: number } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: MADRID_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      weekday: 'short',
    }).formatToParts(date);

    const dayStr = parts.find((p) => p.type === 'day')?.value;
    const monthStr = parts.find((p) => p.type === 'month')?.value;
    const yearStr = parts.find((p) => p.type === 'year')?.value;
    const weekdayStr = parts.find((p) => p.type === 'weekday')?.value?.toLowerCase().slice(0, 3);

    if (dayStr && monthStr && yearStr) {
      const day = parseInt(dayStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const year = parseInt(yearStr, 10);
      const dayOfWeek =
        weekdayStr && weekdayStr in WEEKDAY_SHORT_TO_INDEX
          ? WEEKDAY_SHORT_TO_INDEX[weekdayStr]
          : new Date(Date.UTC(year, month, day, 12, 0, 0)).getUTCDay();
      return { day, month, year, dayOfWeek };
    }
  } catch {
    // Fallback seguro si Intl con timeZone no estuviera disponible
  }

  return {
    day: date.getDate(),
    month: date.getMonth(),
    year: date.getFullYear(),
    dayOfWeek: date.getDay(),
  };
}

/**
 * Convierte cualquier cadena de fecha válida (DD/MM/AAAA, DD/MM/AAAA HH:mm, ISO, etc.)
 * a un código numérico local AAAAMMDD respetando Europe/Madrid sin desplazamientos UTC.
 */
export function toDateCodeFromSpanish(dateStr?: string): number | null {
  if (!dateStr) return null;
  const formatted = formatSpanishDate(dateStr);
  const parts = parseCalendarDateParts(formatted);
  if (!parts) return null;
  return parts.year * 10000 + (parts.month + 1) * 100 + parts.day;
}

export function toLocalDateCode(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function toMadridDateCode(date: Date = new Date()): number {
  const parts = getMadridDateParts(date);
  return parts.year * 10000 + (parts.month + 1) * 100 + parts.day;
}

/**
 * Devuelve la fecha real de inicio de un evento basándose EXCLUSIVAMENTE en `fecha_inicio`.
 * Solo utiliza day/month/year como respaldo cuando el objeto no incluye `fecha_inicio`.
 */
export function getEventStartParts(ev: CalendarEvent): CalendarDateParts | null {
  if (ev.fecha_inicio) {
    const formatted = formatSpanishDate(ev.fecha_inicio);
    const parsed = parseCalendarDateParts(formatted);
    if (parsed) return parsed;
    return null;
  }

  if (
    typeof ev.day === 'number' &&
    typeof ev.month === 'number' &&
    typeof ev.year === 'number' &&
    ev.month >= 0 &&
    ev.month <= 11 &&
    ev.day >= 1 &&
    ev.day <= 31
  ) {
    return { day: ev.day, month: ev.month, year: ev.year };
  }

  return null;
}

/**
 * Devuelve la fecha real de finalización si existe `fecha_fin` y es >= `fecha_inicio`.
 */
export function getEventEndParts(ev: CalendarEvent): CalendarDateParts | null {
  if (!ev.fecha_fin) return null;
  const start = getEventStartParts(ev);
  if (!start) return null;

  const formatted = formatSpanishDate(ev.fecha_fin);
  const parsed = parseCalendarDateParts(formatted);
  if (!parsed) return null;

  const startCode = start.year * 10000 + (start.month + 1) * 100 + start.day;
  const endCode = parsed.year * 10000 + (parsed.month + 1) * 100 + parsed.day;
  return endCode >= startCode ? parsed : null;
}

function getEventDateRangeCodes(
  ev: CalendarEvent
): { startCode: number; endCode: number } | null {
  const start = getEventStartParts(ev);
  if (!start) return null;

  const startCode = start.year * 10000 + (start.month + 1) * 100 + start.day;
  const end = getEventEndParts(ev);
  const endCode = end
    ? end.year * 10000 + (end.month + 1) * 100 + end.day
    : startCode;

  return { startCode, endCode };
}

/**
 * Comprueba si un evento corresponde a la fecha indicada (día, mes 0-indexado, año),
 * utilizando exclusivamente `fecha_inicio` y el rango hasta `fecha_fin` si existe.
 */
export function doesEventFallOnDate(
  ev: CalendarEvent,
  day: number,
  monthIndex: number,
  year: number
): boolean {
  const range = getEventDateRangeCodes(ev);
  if (!range) return false;

  const targetCode = year * 10000 + (monthIndex + 1) * 100 + day;
  return targetCode >= range.startCode && targetCode <= range.endCode;
}

/**
 * Ordena los eventos de un mismo día de forma clara y predecible:
 * primero los que tienen hora de inicio (cronológicamente), luego por hora de fin, orden y título.
 */
export function sortEventsForDay(dayEvents: CalendarEvent[]): CalendarEvent[] {
  return [...dayEvents].sort((a, b) => {
    const aHasTime = Boolean(a.hora_inicio?.trim());
    const bHasTime = Boolean(b.hora_inicio?.trim());
    if (aHasTime !== bHasTime) return aHasTime ? -1 : 1;

    if (aHasTime && bHasTime) {
      const startCmp = (a.hora_inicio || '').localeCompare(b.hora_inicio || '');
      if (startCmp !== 0) return startCmp;
    }

    const endCmp = (a.hora_fin || '').localeCompare(b.hora_fin || '');
    if (endCmp !== 0) return endCmp;

    const orderDiff = (a.orden ?? 0) - (b.orden ?? 0);
    if (orderDiff !== 0) return orderDiff;

    return (a.title || a.titulo || '').localeCompare(b.title || b.titulo || '', 'es');
  });
}

/**
 * Devuelve exclusivamente eventos vigentes o futuros (fecha de fin >= hoy),
 * ordenados cronológicamente por fecha de inicio (más próximo primero),
 * respetando Europe/Madrid y soportando eventos de varios días.
 */
export function getUpcomingCalendarEvents(
  events: CalendarEvent[],
  referenceDate?: Date
): CalendarEvent[] {
  const todayCode = referenceDate
    ? toLocalDateCode(referenceDate)
    : toMadridDateCode(new Date());

  return events
    .map((ev) => {
      const range = getEventDateRangeCodes(ev);
      return range ? { ev, ...range } : null;
    })
    .filter((entry): entry is { ev: CalendarEvent; startCode: number; endCode: number } =>
      Boolean(entry && entry.endCode >= todayCode)
    )
    .sort((a, b) => {
      if (a.startCode !== b.startCode) return a.startCode - b.startCode;
      if (a.endCode !== b.endCode) return a.endCode - b.endCode;
      const timeCmp = (a.ev.hora_inicio || '').localeCompare(b.ev.hora_inicio || '');
      if (timeCmp !== 0) return timeCmp;
      return (a.ev.orden ?? 0) - (b.ev.orden ?? 0);
    })
    .map(({ ev }) => ev);
}

function getWeekdayNameSpanish(parts: CalendarDateParts): string {
  // Usar mediodía UTC para obtener el día de la semana exacto sin riesgo de salto horario
  const idx = new Date(Date.UTC(parts.year, parts.month, parts.day, 12, 0, 0)).getUTCDay();
  return WEEKDAY_NAMES_ES[idx] ?? '';
}

/**
 * Formatea la fecha real del evento para su ficha de detalle (nunca la fecha de publicación).
 */
export function formatEventDateLabel(ev: CalendarEvent): string {
  const start = getEventStartParts(ev);
  if (!start) return '';

  const end = getEventEndParts(ev);
  const startMonthName = MONTH_NAMES_LOWER_ES[start.month] ?? '';

  if (
    end &&
    (end.day !== start.day || end.month !== start.month || end.year !== start.year)
  ) {
    const endMonthName = MONTH_NAMES_LOWER_ES[end.month] ?? '';
    if (start.year === end.year && start.month === end.month) {
      return `Del ${start.day} al ${end.day} de ${startMonthName} de ${start.year}`;
    }
    if (start.year === end.year) {
      return `Del ${start.day} de ${startMonthName} al ${end.day} de ${endMonthName} de ${start.year}`;
    }
    return `Del ${start.day} de ${startMonthName} de ${start.year} al ${end.day} de ${endMonthName} de ${end.year}`;
  }

  const weekday = getWeekdayNameSpanish(start);
  return `${weekday}, ${start.day} de ${startMonthName} de ${start.year}`;
}

/**
 * Formatea la hora de inicio y finalización solo cuando existen datos reales.
 */
export function formatEventTimeRange(ev: CalendarEvent): string | null {
  const hIni = ev.hora_inicio?.trim() || '';
  const hFin = ev.hora_fin?.trim() || '';

  if (hIni && hFin) return `De ${hIni} a ${hFin} h`;
  if (hIni) return `Inicio: ${hIni} h`;
  if (hFin) return `Finalización: ${hFin} h`;

  const fallback = ev.time?.trim();
  return fallback || null;
}

/**
 * Devuelve la descripción completa sin duplicar el prefijo automático "Del DD/MM/AAAA al DD/MM/AAAA."
 * cuando la fecha ya se presenta de forma dedicada.
 */
export function getCleanEventDescription(ev: CalendarEvent): string {
  const raw = (ev.description || ev.descripcion || '').trim();
  if (!raw) return '';
  if (ev.fecha_inicio && ev.fecha_fin && ev.fecha_fin !== ev.fecha_inicio) {
    const prefix = `Del ${ev.fecha_inicio} al ${ev.fecha_fin}.`;
    if (raw.startsWith(prefix)) {
      return raw.slice(prefix.length).trim();
    }
  }
  return raw;
}

/**
 * Devuelve la etiqueta legible de categoría del evento sin exponer valores técnicos vacíos.
 */
export function getEventCategoryLabel(ev: CalendarEvent): string {
  const raw = (ev.categoria || '').trim();
  if (raw) {
    const normalized = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    if (normalized === 'lectivo') return 'Lectivo';
    if (normalized === 'salida' || normalized === 'evento') return 'Evento';
    if (normalized === 'festivo') return 'Festivo';
    if (normalized === 'evaluacion') return 'Evaluación';
    if (normalized === 'reunion') return 'Reunión';
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }

  switch (ev.type) {
    case 'festivo':
      return 'Festivo';
    case 'evaluacion':
      return 'Evaluación';
    case 'salida':
      return 'Evento';
    case 'lectivo':
    default:
      return 'Lectivo';
  }
}
