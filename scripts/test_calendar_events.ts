import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  formatSpanishDate,
  normalizeCalendarEvents,
  parseAppsScriptPayload,
  parseCalendarioRows,
  parseCSV,
  readCachedSyncResult,
  CACHE_STORAGE_KEY,
} from '../src/services/sheetsService';
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
  assert.ok(calCode.includes('visibleDots'), 'Los días con múltiples eventos deben mostrar indicadores múltiples');
  assert.ok(calCode.includes('getMadridDateParts'), 'El calendario debe usar Europe/Madrid para hoy');
  assert.ok(!calCode.includes('isToday && !isSelected ?'), 'Hoy sin eventos no debe mostrar punto de evento');

  const codeGs = fs.readFileSync(path.join(root, 'Code.gs'), 'utf8');
  const scriptCodeGs = fs.readFileSync(path.join(root, 'google-apps-script/Code.gs'), 'utf8');
  assert.equal(codeGs, scriptCodeGs, 'Code.gs no debe haberse modificado');
});

console.log(`\n🎉 Todas las pruebas de calendario superadas: ${passed}/${passed}`);
