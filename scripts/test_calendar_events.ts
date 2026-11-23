import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatSpanishDate,
  mergeWithValidCache,
  normalizeCalendarEvents,
  parseAppsScriptPayload,
  parseCalendarioRows,
  parseCSV,
  readCachedSyncResult,
  CACHE_STORAGE_KEY,
} from '../src/services/sheetsService';
import {
  getCalendarDayVisualState,
  getDaysInMonth,
  getMonthLeadingEmptyCells,
} from '../src/components/HorarioCalendarioTab';
import {
  doesEventFallOnDate,
  formatEventDateLabel,
  formatEventTimeRange,
  getCleanEventDescription,
  getEventCategoryLabel,
  getEventStartParts,
  getMadridDateParts,
  getUpcomingCalendarEvents,
  sortEventsForDay,
} from '../src/utils/eventUtils';
import {
  formatNonSchoolDayDateLabel,
  getNonSchoolDayForDate,
  MALAGA_NON_SCHOOL_DAYS_2026_2027,
  NON_SCHOOL_DAY_COLOR,
} from '../src/data/nonSchoolDays';
import { CalendarEvent } from '../src/types';

let passed = 0;
function runTest(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    throw err;
  }
}

runTest('1. Ejemplo obligatorio: «Exposición de Sofía» (introducido 23/11/2026, fecha_inicio 30/11/2026)', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'cal-sofia',
        fecha: '23/11/2026',
        fecha_publicacion: '23/11/2026',
        fecha_creacion: '23/11/2026',
        fecha_inicio: '30/11/2026',
        fecha_fin: '',
        hora_inicio: '',
        hora_fin: '',
        titulo: 'Exposición de Sofía',
        descripcion: 'Sofía realizará una exposición sobre la Navidad.',
        categoria: 'Exposición',
        lugar: '',
        destacado: 'NO',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  assert.equal(payload.events.length, 1);
  const sofia = payload.events[0];

  assert.equal(sofia.fecha_inicio, '30/11/2026');
  assert.equal(sofia.day, 30);
  assert.equal(sofia.month, 10); // Noviembre (0-indexado)
  assert.equal(sofia.year, 2026);
  assert.equal(sofia.title, 'Exposición de Sofía');

  // Debe aparecer marcado el 30 de noviembre, NUNCA el 23 de noviembre
  assert.equal(doesEventFallOnDate(sofia, 30, 10, 2026), true);
  assert.equal(doesEventFallOnDate(sofia, 23, 10, 2026), false);
  assert.equal(doesEventFallOnDate(sofia, 29, 10, 2026), false);
  assert.equal(doesEventFallOnDate(sofia, 1, 11, 2026), false);

  // Ficha detallada: fecha real, descripción completa, categoría y sin campos vacíos
  assert.equal(formatEventDateLabel(sofia), 'Lunes, 30 de noviembre de 2026');
  assert.equal(formatEventTimeRange(sofia), null);
  assert.equal(sofia.lugar, undefined);
  assert.equal(
    getCleanEventDescription(sofia),
    'Sofía realizará una exposición sobre la Navidad.'
  );
  assert.equal(getEventCategoryLabel(sofia), 'Exposición');
});

runTest('2. Respeta zona horaria Europe/Madrid y evita desplazamientos por UTC o formatos con hora', () => {
  // Medianoche del 30/11/2026 en Europe/Madrid (UTC+1) serializada en UTC como 29/11 23:00Z
  assert.equal(formatSpanishDate('2026-11-29T23:00:00.000Z'), '30/11/2026');
  // Medianoche del 15/07/2026 en Europe/Madrid verano (UTC+2) serializada en UTC como 14/07 22:00Z
  assert.equal(formatSpanishDate('2026-07-14T22:00:00.000Z'), '15/07/2026');
  // Formato DD/MM/AAAA HH:mm devuelto por Utilities.formatDate de Apps Script
  assert.equal(formatSpanishDate('30/11/2026 09:30'), '30/11/2026');
  // Fecha ISO pura sin desfase
  assert.equal(formatSpanishDate('2026-11-30'), '30/11/2026');
  // Fecha ISO con offset explícito de Madrid
  assert.equal(formatSpanishDate('2026-11-30T00:00:00+01:00'), '30/11/2026');
  // Objeto Date correspondiente a 30/11/2026 00:00 Europe/Madrid
  const madridMidnight = new Date('2026-11-29T23:00:00.000Z');
  assert.equal(formatSpanishDate(madridMidnight), '30/11/2026');
  assert.deepEqual(getMadridDateParts(madridMidnight), {
    day: 30,
    month: 10,
    year: 2026,
    dayOfWeek: 1, // Lunes
  });

  // Confirmar con el evento de Sofía llegando en formato ISO UTC desde el servidor
  const utcPayload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'cal-sofia-utc',
        fecha_inicio: '2026-11-29T23:00:00.000Z',
        titulo: 'Exposición de Sofía',
        descripcion: 'Sofía realizará una exposición sobre la Navidad.',
        estado: 'PUBLICAR',
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });
  assert.equal(utcPayload.events.length, 1);
  assert.equal(utcPayload.events[0].fecha_inicio, '30/11/2026');
  assert.equal(doesEventFallOnDate(utcPayload.events[0], 30, 10, 2026), true);
  assert.equal(doesEventFallOnDate(utcPayload.events[0], 29, 10, 2026), false);
});

runTest('3. Nunca usa fecha de creación/publicación ni en payload ni en CSV ni en caché antigua', () => {
  // Sin fecha_inicio (solo fecha de publicación): no debe posicionarse en el día de publicación
  const withoutStart = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'cal-no-start',
        fecha: '23/11/2026',
        fecha_publicacion: '23/11/2026',
        titulo: 'Sin fecha de inicio',
        descripcion: 'No debe aparecer el día 23',
        estado: 'PUBLICAR',
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });
  assert.equal(withoutStart.events.length, 0);

  // CSV con fecha_publicacion antes de fecha_inicio: debe leer estrictamente fecha_inicio
  const csvWithPubCol = `id,fecha_publicacion,fecha_inicio,fecha_fin,hora_inicio,hora_fin,titulo,descripcion,categoria,lugar,estado,orden
c-sofia,23/11/2026,30/11/2026,,10:00,11:00,Exposición de Sofía,Sofía realizará una exposición sobre la Navidad.,lectivo,Aula 1.º B,PUBLICAR,1`;
  const csvEvents = parseCalendarioRows(parseCSV(csvWithPubCol));
  assert.equal(csvEvents.length, 1);
  assert.equal(csvEvents[0].fecha_inicio, '30/11/2026');
  assert.equal(csvEvents[0].day, 30);
  assert.equal(doesEventFallOnDate(csvEvents[0], 30, 10, 2026), true);
  assert.equal(doesEventFallOnDate(csvEvents[0], 23, 10, 2026), false);
  assert.equal(formatEventTimeRange(csvEvents[0]), 'De 10:00 a 11:00 h');
  assert.equal(csvEvents[0].lugar, 'Aula 1.º B');

  // Caché local corrupta con day: 23 pero fecha_inicio: '30/11/2026' se corrige automáticamente al leer
  const staleCacheEvent: CalendarEvent = {
    id: 'cal-cached-sofia',
    fecha_inicio: '30/11/2026',
    titulo: 'Exposición de Sofía',
    descripcion: 'Sofía realizará una exposición sobre la Navidad.',
    day: 23,
    month: 10,
    year: 2026,
    title: 'Exposición de Sofía',
    description: 'Sofía realizará una exposición sobre la Navidad.',
    type: 'lectivo',
  };
  const storage = {
    getItem: (k: string) =>
      k === CACHE_STORAGE_KEY ? JSON.stringify({ events: [staleCacheEvent] }) : null,
    setItem: () => {},
  };
  const hydrated = readCachedSyncResult(storage);
  assert.ok(hydrated && hydrated.events.length === 1);
  assert.equal(hydrated.events[0].day, 30);
  assert.equal(hydrated.events[0].month, 10);
  assert.equal(hydrated.events[0].year, 2026);
  assert.deepEqual(getEventStartParts(hydrated.events[0]), { day: 30, month: 10, year: 2026 });
  assert.equal(normalizeCalendarEvents([staleCacheEvent])[0].day, 30);
});

runTest('4. Rango multi-día con fecha_inicio y fecha_fin marca todos los días comprendidos', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'cal-semana-cultural',
        fecha_inicio: '06/12/2026',
        fecha_fin: '08/12/2026',
        titulo: 'Puente de diciembre',
        descripcion: 'Días festivos no lectivos.',
        categoria: 'festivo',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  const ev = payload.events[0];
  assert.equal(doesEventFallOnDate(ev, 5, 11, 2026), false);
  assert.equal(doesEventFallOnDate(ev, 6, 11, 2026), true);
  assert.equal(doesEventFallOnDate(ev, 7, 11, 2026), true);
  assert.equal(doesEventFallOnDate(ev, 8, 11, 2026), true);
  assert.equal(doesEventFallOnDate(ev, 9, 11, 2026), false);
  assert.equal(formatEventDateLabel(ev), 'Del 6 al 8 de diciembre de 2026');
  assert.equal(getCleanEventDescription(ev), 'Días festivos no lectivos.');
});

runTest('5. Múltiples eventos en un mismo día se representan y muestran ordenados correctamente', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'ev-sin-hora',
        fecha_inicio: '30/11/2026',
        titulo: 'Mercadillo solidario',
        descripcion: 'Durante toda la jornada.',
        categoria: 'lectivo',
        estado: 'PUBLICAR',
        orden: 3,
      },
      {
        id: 'ev-tarde',
        fecha_inicio: '30/11/2026',
        hora_inicio: '12:00',
        hora_fin: '13:00',
        titulo: 'Taller de villancicos',
        descripcion: 'Ensayo en el aula de música.',
        categoria: 'salida',
        lugar: 'Aula de Música',
        estado: 'PUBLICAR',
        orden: 2,
      },
      {
        id: 'ev-sofia',
        fecha_inicio: '30/11/2026',
        hora_inicio: '09:30',
        titulo: 'Exposición de Sofía',
        descripcion: 'Sofía realizará una exposición sobre la Navidad.',
        categoria: 'Exposición',
        lugar: 'Aula 1.º B',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  const day30 = sortEventsForDay(
    payload.events.filter((ev) => doesEventFallOnDate(ev, 30, 10, 2026))
  );
  assert.deepEqual(
    day30.map((e) => e.id),
    ['ev-sofia', 'ev-tarde', 'ev-sin-hora']
  );

  // Comprobar próximos eventos desde el 23/11/2026
  const upcoming = getUpcomingCalendarEvents(payload.events, new Date(2026, 10, 23, 12, 0, 0));
  assert.equal(upcoming.length, 3);
  assert.equal(upcoming[0].fecha_inicio, '30/11/2026');
});

runTest('6. Verificación estática de UI del calendario (indicadores múltiples, ficha detallada, sin cambios a Code.gs)', () => {
  const root = process.cwd();
  const calCode = fs.readFileSync(path.join(root, 'src/components/HorarioCalendarioTab.tsx'), 'utf8');
  assert.ok(calCode.includes('role="dialog"'), 'Debe incluir ventana/ficha detallada accesible');
  assert.ok(calCode.includes('formatEventDateLabel'), 'La ficha debe mostrar la fecha real del evento');
  assert.ok(calCode.includes('formatEventTimeRange'), 'La ficha debe mostrar hora solo si existe');
  assert.ok(calCode.includes('sortEventsForDay'), 'Los eventos del día deben ordenarse');
  assert.ok(calCode.includes('getCalendarDayVisualState'), 'El calendario debe aplicar recuadros suaves sin puntos');
  assert.ok(calCode.includes('getMadridDateParts'), 'El calendario debe usar Europe/Madrid para hoy');
  assert.ok(!calCode.includes('isToday && !isSelected ?'), 'Hoy sin eventos no debe mostrar punto de evento');
  assert.ok(!calCode.includes('rounded-full'), 'No deben quedar puntos indicadores circulares en el calendario');

  const codeGs = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
  const scriptCodeGs = fs.readFileSync(path.join(root, 'google-apps-script/Code.gs'), 'utf8');
  assert.equal(codeGs, scriptCodeGs, 'Code.gs no debe haberse modificado');

  const inicioCode = fs.readFileSync(path.join(root, 'src/components/InicioTab.tsx'), 'utf8');
  assert.ok(
    inicioCode.includes('getEventStartParts'),
    'InicioTab debe derivar el día/mes de Próximos acontecimientos desde fecha_inicio mediante getEventStartParts'
  );
});

runTest('7. Formatos adicionales de Google Sheets (serial string, coma+hora, año 2 dígitos, MM/DD/AAAA inequívoco, texto español)', () => {
  // Número de serie de Google Sheets como cadena ("46356" = 30/11/2026) y con decimales
  assert.equal(formatSpanishDate('46356'), '30/11/2026');
  assert.equal(formatSpanishDate('46356.5'), '30/11/2026');
  assert.equal(formatSpanishDate(46356), '30/11/2026');
  // Fecha con coma y hora
  assert.equal(formatSpanishDate('30/11/2026, 09:00'), '30/11/2026');
  assert.equal(formatSpanishDate('30/11/2026, 09:00:00'), '30/11/2026');
  // Año en 2 dígitos con /, - o .
  assert.equal(formatSpanishDate('30/11/26'), '30/11/2026');
  assert.equal(formatSpanishDate('30-11-26'), '30/11/2026');
  assert.equal(formatSpanishDate('30.11.26'), '30/11/2026');
  // Formato US inequívoco (segundo segmento > 12)
  assert.equal(formatSpanishDate('11/30/2026'), '30/11/2026');
  // Texto en español
  assert.equal(formatSpanishDate('30 de noviembre de 2026'), '30/11/2026');
  assert.equal(formatSpanishDate('lunes, 30 nov 2026'), '30/11/2026');
});

runTest('8. Claves con variantes de mayúsculas/espacios/BOM en fecha_inicio y rechazo estricto de fecha de publicación', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'cal-caps',
        fecha: '01/10/2026',
        fecha_publicacion: '01/10/2026',
        ' \uFEFFFecha Inicio ': '14/12/2026, 10:00',
        'Fecha Fin': '16/12/2026',
        titulo: 'Semana de lectura',
        descripcion: 'Lectura compartida con familias.',
        categoria: 'evento',
        estado: 'PUBLICAR',
        orden: 1,
      },
      {
        id: 'cal-only-pub',
        fecha: '01/10/2026',
        fecha_publicacion: '01/10/2026',
        fecha_creacion: '01/10/2026',
        timestamp: '01/10/2026',
        titulo: 'Evento sin fecha_inicio',
        descripcion: 'Debe descartarse porque carece de fecha_inicio',
        estado: 'PUBLICAR',
        orden: 2,
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  assert.equal(payload.events.length, 1);
  const ev = payload.events[0];
  assert.equal(ev.id, 'cal-caps');
  assert.equal(ev.fecha_inicio, '14/12/2026');
  assert.equal(ev.fecha_fin, '16/12/2026');
  assert.equal(ev.day, 14);
  assert.equal(ev.month, 11);
  assert.equal(ev.year, 2026);
  assert.equal(ev.type, 'salida');
  assert.equal(getEventCategoryLabel(ev), 'Evento');
  assert.equal(doesEventFallOnDate(ev, 1, 9, 2026), false);
  assert.equal(doesEventFallOnDate(ev, 14, 11, 2026), true);
  assert.equal(doesEventFallOnDate(ev, 15, 11, 2026), true);
  assert.equal(doesEventFallOnDate(ev, 16, 11, 2026), true);
});

runTest('9. Cuadrícula mensual UTC-mediodía sin desfases horarios y re-normalización al fusionar caché', () => {
  // Noviembre 2026: 30 días, 1 de noviembre de 2026 es domingo -> 6 huecos iniciales (L..S)
  assert.equal(getDaysInMonth(2026, 10), 30);
  assert.equal(getMonthLeadingEmptyCells(2026, 10), 6);
  // Febrero 2028 (bisiesto): 29 días
  assert.equal(getDaysInMonth(2028, 1), 29);

  // mergeWithValidCache debe re-normalizar eventos existentes en caché si tenían day desfasado
  const staleCached = {
    isPendingConfig: false,
    config: {},
    posts: [],
    avisos: [],
    events: [
      {
        id: 'cal-old',
        fecha_inicio: '30/11/2026',
        titulo: 'Exposición de Sofía',
        descripcion: 'Evento existente en caché antigua',
        day: 23,
        month: 10,
        year: 2026,
        title: 'Exposición de Sofía',
        description: 'Evento existente en caché antigua',
        type: 'lectivo' as const,
      },
    ],
    schedule: null,
    multimedia: [],
    aprendemos: [],
    recursos: [],
    source: 'cache' as const,
    updatedAt: '2026-11-23T10:00:00.000Z',
  };

  const liveWithoutCal = {
    ...staleCached,
    events: [],
    posts: [
      {
        id: 'post-1',
        fecha: '23/11/2026',
        titulo: 'Hola',
        contenido: 'Contenido',
        categoria: 'General',
        destacado: false,
        estado: 'PUBLICAR' as const,
        orden: 1,
        title: 'Hola',
        content: 'Contenido',
        tag: 'General' as const,
        date: '23/11/2026',
        timestamp: 1,
        completed: false,
        important: false,
        author: 'Manuel Herrera',
      },
    ],
    source: 'apps-script' as const,
  };

  const merged = mergeWithValidCache(liveWithoutCal, { dia_a_dia: [{}] }, staleCached);
  assert.equal(merged.result.events.length, 1);
  assert.equal(merged.result.events[0].day, 30);
  assert.equal(merged.result.events[0].month, 10);
  assert.equal(merged.result.events[0].year, 2026);
  assert.equal(merged.result.events[0].fecha_inicio, '30/11/2026');
});

runTest('10. Días y periodos no lectivos oficiales 2026/2027 de Málaga capital (fechas exactas y rangos completos)', () => {
  assert.equal(NON_SCHOOL_DAY_COLOR, '#D97757');
  assert.equal(MALAGA_NON_SCHOOL_DAYS_2026_2027.length, 10);

  // Días individuales exactos
  const singleDays: Array<[number, number, number, string, string]> = [
    [12, 9, 2026, 'Fiesta Nacional de España', 'Lunes, 12 de octubre de 2026'],
    [2, 10, 2026, 'Todos los Santos (traslado)', 'Lunes, 2 de noviembre de 2026'],
    [7, 11, 2026, 'Día de la Constitución (traslado)', 'Lunes, 7 de diciembre de 2026'],
    [8, 11, 2026, 'Inmaculada Concepción', 'Martes, 8 de diciembre de 2026'],
    [1, 2, 2027, 'Día de Andalucía (traslado)', 'Lunes, 1 de marzo de 2027'],
    [29, 2, 2027, 'Día no lectivo provincial', 'Lunes, 29 de marzo de 2027'],
    [3, 4, 2027, 'Día no lectivo provincial', 'Lunes, 3 de mayo de 2027'],
  ];

  for (const [d, m, y, expectedName, expectedLabel] of singleDays) {
    const found = getNonSchoolDayForDate(d, m, y);
    assert.ok(found, `Debe marcarse el ${d}/${m + 1}/${y}`);
    assert.equal(found.name, expectedName);
    assert.ok(found.reason.trim().length > 10);
    assert.equal(formatNonSchoolDayDateLabel(found), expectedLabel);
  }

  // Vacaciones de Navidad: TODOS los días del 23/12/2026 al 06/01/2027 (15 días)
  assert.equal(getNonSchoolDayForDate(22, 11, 2026), null);
  for (let d = 23; d <= 31; d++) {
    const found = getNonSchoolDayForDate(d, 11, 2026);
    assert.ok(found, `Navidad debe incluir ${d}/12/2026`);
    assert.equal(found.name, 'Vacaciones de Navidad');
    assert.equal(
      formatNonSchoolDayDateLabel(found),
      'Del 23 de diciembre de 2026 al 6 de enero de 2027'
    );
  }
  for (let d = 1; d <= 6; d++) {
    const found = getNonSchoolDayForDate(d, 0, 2027);
    assert.ok(found, `Navidad debe incluir ${d}/01/2027`);
    assert.equal(found.name, 'Vacaciones de Navidad');
  }
  assert.equal(getNonSchoolDayForDate(7, 0, 2027), null);

  // Semana Blanca: TODOS los días del 22/02/2027 al 26/02/2027 (5 días)
  assert.equal(getNonSchoolDayForDate(21, 1, 2027), null);
  for (let d = 22; d <= 26; d++) {
    const found = getNonSchoolDayForDate(d, 1, 2027);
    assert.ok(found, `Semana Blanca debe incluir ${d}/02/2027`);
    assert.equal(found.name, 'Semana Blanca');
    assert.equal(formatNonSchoolDayDateLabel(found), 'Del 22 al 26 de febrero de 2027');
  }
  assert.equal(getNonSchoolDayForDate(27, 1, 2027), null);

  // Vacaciones de Semana Santa: TODOS los días del 22/03/2027 al 28/03/2027 (7 días)
  assert.equal(getNonSchoolDayForDate(21, 2, 2027), null);
  for (let d = 22; d <= 28; d++) {
    const found = getNonSchoolDayForDate(d, 2, 2027);
    assert.ok(found, `Semana Santa debe incluir ${d}/03/2027`);
    assert.equal(found.name, 'Vacaciones de Semana Santa');
    assert.equal(formatNonSchoolDayDateLabel(found), 'Del 22 al 28 de marzo de 2027');
  }
  // 29/03/2027 es Día no lectivo provincial y 30/03/2027 ya es lectivo
  assert.equal(getNonSchoolDayForDate(29, 2, 2027)?.name, 'Día no lectivo provincial');
  assert.equal(getNonSchoolDayForDate(30, 2, 2027), null);
});

runTest('11. Coexistencia entre días no lectivos y eventos del aula sin alterar fechas ni ocultar indicadores', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [],
    calendario: [
      {
        id: 'ev-coincide',
        fecha_inicio: '02/11/2026',
        hora_inicio: '10:00',
        titulo: 'Actividad familiar especial',
        descripcion: 'Evento que coincide con Todos los Santos (traslado).',
        categoria: 'evento',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  const ev = payload.events[0];
  const nonSchool = getNonSchoolDayForDate(2, 10, 2026);
  assert.ok(nonSchool, '02/11/2026 debe detectarse como día no lectivo');
  assert.equal(nonSchool.name, 'Todos los Santos (traslado)');
  assert.equal(doesEventFallOnDate(ev, 2, 10, 2026), true);
  assert.equal(ev.type, 'salida'); // Conserva categoría Evento (indicador amarillo)
  assert.equal(getEventCategoryLabel(ev), 'Evento');

  // Verificación de los 6 estados visuales definitivos (recuadros suaves, cero puntos)
  const normalDay = getCalendarDayVisualState({
    isSelected: false,
    isToday: false,
    isWeekend: false,
    isNonSchoolOrHoliday: false,
    hasEvents: false,
  });
  assert.equal(normalDay.kind, 'normal');
  assert.ok(!normalDay.className.includes('bg-[#DCEAF5]') && !normalDay.className.includes('bg-[#F9EAE5]'));

  const eventDay = getCalendarDayVisualState({
    isSelected: false,
    isToday: false,
    isWeekend: false,
    isNonSchoolOrHoliday: false,
    hasEvents: true,
  });
  assert.equal(eventDay.kind, 'event');
  assert.ok(eventDay.className.includes('bg-[#DCEAF5]'));
  assert.ok(eventDay.className.includes('border '));

  const holidayDay = getCalendarDayVisualState({
    isSelected: false,
    isToday: false,
    isWeekend: false,
    isNonSchoolOrHoliday: true,
    hasEvents: false,
  });
  assert.equal(holidayDay.kind, 'non_school');
  assert.ok(holidayDay.className.includes('bg-[#F9EAE5]'));
  assert.ok(holidayDay.className.includes('border-[#D97757]'));

  const weekendDay = getCalendarDayVisualState({
    isSelected: false,
    isToday: false,
    isWeekend: true,
    isNonSchoolOrHoliday: false,
    hasEvents: false,
  });
  assert.equal(weekendDay.kind, 'weekend');
  assert.ok(weekendDay.className.includes('bg-[#F1F5F9]/90'));
  assert.ok(!weekendDay.className.includes('border '));

  // Evento + día no lectivo simultáneamente: prevalece el recuadro coral
  const combinedDay = getCalendarDayVisualState({
    isSelected: false,
    isToday: false,
    isWeekend: false,
    isNonSchoolOrHoliday: true,
    hasEvents: true,
  });
  assert.equal(combinedDay.kind, 'non_school');
  assert.ok(combinedDay.className.includes('bg-[#F9EAE5]'));
  assert.ok(combinedDay.className.includes('border-[#D97757]'));

  // Día seleccionado: resaltado propio sin solaparse con recuadros de evento ni coral
  const selectedCombined = getCalendarDayVisualState({
    isSelected: true,
    isToday: false,
    isWeekend: false,
    isNonSchoolOrHoliday: true,
    hasEvents: true,
  });
  assert.equal(selectedCombined.kind, 'selected');
  assert.ok(selectedCombined.className.includes('bg-[#4338CA]'));
  assert.ok(!selectedCombined.className.includes('bg-[#F9EAE5]'));
  assert.ok(!selectedCombined.className.includes('bg-[#DCEAF5]'));

  // Verificación estática del diseño visual e interacción en HorarioCalendarioTab
  const root = process.cwd();
  const calCode = fs.readFileSync(path.join(root, 'src/components/HorarioCalendarioTab.tsx'), 'utf8');
  assert.ok(calCode.includes('bg-[#DCEAF5]'), 'Los días con evento deben usar el recuadro azul suave #DCEAF5');
  assert.ok(calCode.includes('bg-[#F9EAE5]'), 'Los días no lectivos deben usar el recuadro coral suave #F9EAE5');
  assert.ok(calCode.includes('border-[#D97757]'), 'Los días no lectivos deben usar borde fino coral #D97757');
  assert.ok(calCode.includes('getNonSchoolDayForDate'), 'Debe consultar días no lectivos por fecha');
  assert.ok(calCode.includes('formatNonSchoolDayDateLabel'), 'La ficha debe mostrar la fecha o intervalo');
  assert.ok(calCode.includes('selectedNonSchoolDay.reason'), 'La ficha debe mostrar el motivo');
  assert.ok(calCode.includes('selectedNonSchoolDay.name'), 'La ficha debe mostrar el nombre del festivo o periodo');
  assert.ok(calCode.includes("bg-[#F1F5F9]/90 text-[#475569]"), 'Los sábados y domingos deben mostrar un fondo gris suave y legible');
  assert.ok(!calCode.includes('visibleDots') && !calCode.includes('dotStyle'), 'No deben existir puntos indicadores en la cuadrícula');
});

console.log(`\n🎉 Todas las pruebas de calendario superadas: ${passed}/${passed}`);
