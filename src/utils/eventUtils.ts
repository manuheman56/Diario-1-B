import { CalendarEvent } from '../types';

/**
 * Convierte una fecha española DD/MM/AAAA a un código numérico local AAAAMMDD
 * sin pasar por Date.UTC para evitar desfases horarios.
 */
export function toDateCodeFromSpanish(dateStr?: string): number | null {
  if (!dateStr) return null;
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const check = new Date(year, month - 1, day);
  if (
    check.getFullYear() !== year ||
    check.getMonth() !== month - 1 ||
    check.getDate() !== day
  ) {
    return null;
  }

  return year * 10000 + month * 100 + day;
}

export function toLocalDateCode(date: Date = new Date()): number {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function getEventDateRangeCodes(ev: CalendarEvent): { startCode: number; endCode: number } {
  const fallbackCode = ev.year * 10000 + (ev.month + 1) * 100 + ev.day;
  const startCode = toDateCodeFromSpanish(ev.fecha_inicio) ?? fallbackCode;
  const parsedEnd = toDateCodeFromSpanish(ev.fecha_fin);
  const endCode = parsedEnd !== null && parsedEnd >= startCode ? parsedEnd : startCode;
  return { startCode, endCode };
}

/**
 * Devuelve exclusivamente eventos vigentes o futuros (fecha de fin >= hoy local),
 * ordenados cronológicamente por fecha de inicio (más próximo primero),
 * sin desfases por UTC y soportando eventos de varios días.
 */
export function getUpcomingCalendarEvents(
  events: CalendarEvent[],
  referenceDate: Date = new Date()
): CalendarEvent[] {
  const todayCode = toLocalDateCode(referenceDate);

  return events
    .map((ev) => ({
      ev,
      ...getEventDateRangeCodes(ev),
    }))
    .filter(({ endCode }) => endCode >= todayCode)
    .sort((a, b) => {
      if (a.startCode !== b.startCode) return a.startCode - b.startCode;
      if (a.endCode !== b.endCode) return a.endCode - b.endCode;
      const timeCmp = (a.ev.hora_inicio || '').localeCompare(b.ev.hora_inicio || '');
      if (timeCmp !== 0) return timeCmp;
      return (a.ev.orden ?? 0) - (b.ev.orden ?? 0);
    })
    .map(({ ev }) => ev);
}
