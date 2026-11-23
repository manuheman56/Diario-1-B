import { parseCalendarDateParts } from '../services/sheetsService';

export const NON_SCHOOL_DAY_COLOR = '#D97757';

export type NonSchoolDayKind = 'festivo' | 'vacaciones' | 'no_lectivo_provincial';

export interface NonSchoolDayEntry {
  id: string;
  name: string;
  reason: string;
  startDate: string; // DD/MM/AAAA
  endDate?: string; // DD/MM/AAAA (inclusiva)
  kind: NonSchoolDayKind;
}

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

/**
 * Días y periodos no lectivos oficiales del curso escolar 2026/2027
 * para Educación Primaria en Málaga capital.
 * Referencia: Delegación Territorial de Desarrollo Educativo de Málaga.
 */
export const MALAGA_NON_SCHOOL_DAYS_2026_2027: readonly NonSchoolDayEntry[] = [
  {
    id: 'nl-2026-10-12',
    name: 'Fiesta Nacional de España',
    reason: 'Festivo nacional incluido en el calendario escolar oficial 2026/2027 de Málaga capital.',
    startDate: '12/10/2026',
    kind: 'festivo',
  },
  {
    id: 'nl-2026-11-02',
    name: 'Todos los Santos (traslado)',
    reason: 'Festivo nacional trasladado al lunes según el calendario escolar oficial 2026/2027 de Málaga capital.',
    startDate: '02/11/2026',
    kind: 'festivo',
  },
  {
    id: 'nl-2026-12-07',
    name: 'Día de la Constitución (traslado)',
    reason: 'Festivo nacional trasladado al lunes según el calendario escolar oficial 2026/2027 de Málaga capital.',
    startDate: '07/12/2026',
    kind: 'festivo',
  },
  {
    id: 'nl-2026-12-08',
    name: 'Inmaculada Concepción',
    reason: 'Festivo nacional incluido en el calendario escolar oficial 2026/2027 de Málaga capital.',
    startDate: '08/12/2026',
    kind: 'festivo',
  },
  {
    id: 'nl-2026-12-23-navidad',
    name: 'Vacaciones de Navidad',
    reason: 'Periodo vacacional de Navidad del curso 2026/2027 (Delegación Territorial de Desarrollo Educativo de Málaga).',
    startDate: '23/12/2026',
    endDate: '06/01/2027',
    kind: 'vacaciones',
  },
  {
    id: 'nl-2027-02-22-semana-blanca',
    name: 'Semana Blanca',
    reason: 'Periodo no lectivo de Semana Blanca del curso 2026/2027 en la provincia de Málaga (Delegación Territorial de Desarrollo Educativo de Málaga).',
    startDate: '22/02/2027',
    endDate: '26/02/2027',
    kind: 'vacaciones',
  },
  {
    id: 'nl-2027-03-01',
    name: 'Día de Andalucía (traslado)',
    reason: 'Festivo autonómico de Andalucía trasladado al lunes según el calendario escolar oficial 2026/2027 de Málaga capital.',
    startDate: '01/03/2027',
    kind: 'festivo',
  },
  {
    id: 'nl-2027-03-22-semana-santa',
    name: 'Vacaciones de Semana Santa',
    reason: 'Periodo vacacional de Semana Santa del curso 2026/2027 (Delegación Territorial de Desarrollo Educativo de Málaga).',
    startDate: '22/03/2027',
    endDate: '28/03/2027',
    kind: 'vacaciones',
  },
  {
    id: 'nl-2027-03-29',
    name: 'Día no lectivo provincial',
    reason: 'Día no lectivo provincial fijado por la Delegación Territorial de Desarrollo Educativo de Málaga para el curso 2026/2027.',
    startDate: '29/03/2027',
    kind: 'no_lectivo_provincial',
  },
  {
    id: 'nl-2027-05-03',
    name: 'Día no lectivo provincial',
    reason: 'Día no lectivo provincial fijado por la Delegación Territorial de Desarrollo Educativo de Málaga para el curso 2026/2027.',
    startDate: '03/05/2027',
    kind: 'no_lectivo_provincial',
  },
] as const;

interface ParsedNonSchoolRange {
  entry: NonSchoolDayEntry;
  startCode: number;
  endCode: number;
}

const PARSED_NON_SCHOOL_RANGES: readonly ParsedNonSchoolRange[] =
  MALAGA_NON_SCHOOL_DAYS_2026_2027.map((entry) => {
    const start = parseCalendarDateParts(entry.startDate);
    const end = entry.endDate ? parseCalendarDateParts(entry.endDate) : start;
    if (!start || !end) {
      throw new Error(`Fecha inválida en día no lectivo: ${entry.id}`);
    }
    const startCode = start.year * 10000 + (start.month + 1) * 100 + start.day;
    const endCode = end.year * 10000 + (end.month + 1) * 100 + end.day;
    return { entry, startCode, endCode };
  });

/**
 * Comprueba si una fecha concreta (día, mes 0-indexado, año) pertenece a un día o periodo no lectivo.
 */
export function isDateInNonSchoolEntry(
  entry: NonSchoolDayEntry,
  day: number,
  monthIndex: number,
  year: number
): boolean {
  const start = parseCalendarDateParts(entry.startDate);
  if (!start) return false;
  const end = entry.endDate ? parseCalendarDateParts(entry.endDate) : start;
  if (!end) return false;

  const targetCode = year * 10000 + (monthIndex + 1) * 100 + day;
  const startCode = start.year * 10000 + (start.month + 1) * 100 + start.day;
  const endCode = end.year * 10000 + (end.month + 1) * 100 + end.day;
  return targetCode >= startCode && targetCode <= endCode;
}

/**
 * Devuelve la ficha del día o periodo no lectivo correspondiente a la fecha indicada, o null si es lectivo.
 */
export function getNonSchoolDayForDate(
  day: number,
  monthIndex: number,
  year: number
): NonSchoolDayEntry | null {
  const targetCode = year * 10000 + (monthIndex + 1) * 100 + day;
  for (const item of PARSED_NON_SCHOOL_RANGES) {
    if (targetCode >= item.startCode && targetCode <= item.endCode) {
      return item.entry;
    }
  }
  return null;
}

/**
 * Formatea en español legible la fecha o intervalo de fechas de un día/periodo no lectivo
 * usando mediodía UTC para evitar cualquier desfase de huso horario.
 */
export function formatNonSchoolDayDateLabel(entry: NonSchoolDayEntry): string {
  const start = parseCalendarDateParts(entry.startDate);
  if (!start) return entry.startDate;

  const startMonthName = MONTH_NAMES_LOWER_ES[start.month] ?? '';
  const end = entry.endDate ? parseCalendarDateParts(entry.endDate) : null;

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

  const weekdayIdx = new Date(Date.UTC(start.year, start.month, start.day, 12, 0, 0)).getUTCDay();
  const weekday = WEEKDAY_NAMES_ES[weekdayIdx] ?? '';
  return `${weekday}, ${start.day} de ${startMonthName} de ${start.year}`;
}

export function getNonSchoolDayKindLabel(kind: NonSchoolDayKind): string {
  switch (kind) {
    case 'vacaciones':
      return 'Periodo no lectivo';
    case 'no_lectivo_provincial':
      return 'No lectivo provincial';
    case 'festivo':
    default:
      return 'Festivo oficial';
  }
}
