import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  parseCSV,
  parseDiaADiaRows,
  parseAvisosRows,
  parseCalendarioRows,
  parseMultimediaRows,
  parseAprendemosRows,
  parseRecursosRows,
  parseAppsScriptPayload,
  parseEstado,
  normalizeAprendemosCategory,
  sortAprendemosItems,
  APRENDEMOS_CATEGORY_LABELS,
} from '../src/services/sheetsService';
import { matchesNormalizedSearch, normalizeSearchText } from '../src/utils/searchUtils';
import { getUpcomingCalendarEvents, toDateCodeFromSpanish } from '../src/utils/eventUtils';
import { mergePostsWithCompleted } from '../src/utils/taskPersistence';
import { CalendarEvent, DiaADiaItem, EducationalResource } from '../src/types';

let passed = 0;
function test(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`PASS: ${name}`);
}

// 1. Estados PUBLICAR / PUBLICADO / BORRADOR / ARCHIVADO
test('1a. parseEstado acepta PUBLICAR y PUBLICADO (con espacios o caracteres invisibles) y oculta BORRADOR/ARCHIVADO', () => {
  assert.equal(parseEstado('PUBLICAR'), 'PUBLICAR');
  assert.equal(parseEstado('PUBLICADO'), 'PUBLICAR');
  assert.equal(parseEstado(' publicado '), 'PUBLICAR');
  assert.equal(parseEstado('\u200BPUBLICADO\u200B'), 'PUBLICAR');
  assert.equal(parseEstado('BORRADOR'), 'BORRADOR');
  assert.equal(parseEstado('ARCHIVADO'), 'ARCHIVADO');
  assert.equal(parseEstado(''), 'BORRADOR');
});

test('1b. parseAppsScriptPayload y parsers CSV muestran PUBLICAR y PUBLICADO y ocultan BORRADOR/ARCHIVADO en las 6 hojas', () => {
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [
      { id: 'd1', fecha: '12/11/2026', titulo: 'Post PUBLICAR', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: 4 },
      { id: 'd2', fecha: '12/11/2026', titulo: 'Post PUBLICADO', contenido: 'c', categoria: 'Tarea', estado: 'PUBLICADO', orden: 3 },
      { id: 'd3', fecha: '12/11/2026', titulo: 'Post BORRADOR', contenido: 'c', categoria: 'General', estado: 'BORRADOR', orden: 2 },
      { id: 'd4', fecha: '12/11/2026', titulo: 'Post ARCHIVADO', contenido: 'c', categoria: 'General', estado: 'ARCHIVADO', orden: 1 },
    ],
    avisos: [
      { id: 'a1', fecha_publicacion: '12/11/2026', titulo: 'Av PUBLICADO', mensaje: 'm', tipo: 'Urgente', prioridad: 'Alta', estado: 'PUBLICADO', orden: 2 },
      { id: 'a2', fecha_publicacion: '12/11/2026', titulo: 'Av ARCHIVADO', mensaje: 'm', tipo: 'General', prioridad: 'Normal', estado: 'ARCHIVADO', orden: 1 },
    ],
    calendario: [
      { id: 'c1', fecha_inicio: '20/11/2026', titulo: 'Cal PUBLICADO', descripcion: 'd', categoria: 'salida', estado: 'PUBLICADO', orden: 1 },
      { id: 'c2', fecha_inicio: '21/11/2026', titulo: 'Cal BORRADOR', descripcion: 'd', categoria: 'salida', estado: 'BORRADOR', orden: 2 },
    ],
    horario: [],
    multimedia: [
      { id: 'm1', fecha: '12/11/2026', titulo: 'Foto PUBLICADO', descripcion: 'd', tipo: 'FOTOGRAFIA', url_media: 'https://f/1.jpg', estado: 'PUBLICADO', orden: 1 },
      { id: 'm2', fecha: '12/11/2026', titulo: 'Foto ARCHIVADO', descripcion: 'd', tipo: 'FOTOGRAFIA', url_media: 'https://f/2.jpg', estado: 'ARCHIVADO', orden: 2 },
    ],
    aprendemos: [
      { id: 'ap1', categoria: 'Cálculo y lógica', titulo: 'Ap PUBLICADO', descripcion: 'Sumas', estado: 'PUBLICADO', orden: 1 },
      { id: 'ap2', categoria: 'Lectura y comprensión', titulo: 'Ap BORRADOR', descripcion: 'Oculto', estado: 'BORRADOR', orden: 2 },
    ],
    recursos: [
      { id: 'r1', categoria: 'matematicas', titulo: 'Rec PUBLICADO', descripcion: 'd', tipo_recurso: 'Juego', asignatura: 'Matemáticas', estado: 'PUBLICADO', orden: 1 },
      { id: 'r2', categoria: 'matematicas', titulo: 'Rec ARCHIVADO', descripcion: 'd', tipo_recurso: 'Juego', asignatura: 'Matemáticas', estado: 'ARCHIVADO', orden: 2 },
    ],
  });

  assert.deepEqual(payload.posts.map((x) => x.id), ['d1', 'd2']);
  assert.deepEqual(payload.avisos.map((x) => x.id), ['a1']);
  assert.deepEqual(payload.events.map((x) => x.id), ['c1']);
  assert.deepEqual(payload.multimedia.map((x) => x.id), ['m1']);
  assert.deepEqual(payload.aprendemos.map((x) => x.id), ['ap1']);
  assert.deepEqual(payload.recursos.map((x) => x.id), ['r1']);

  const csvDia = parseDiaADiaRows(
    parseCSV('id,fecha,titulo,contenido,categoria,estado,orden\nd1,12/11/2026,Ok1,c,General,PUBLICADO,2\nd2,12/11/2026,No1,c,General,BORRADOR,1\nd3,12/11/2026,No2,c,General,ARCHIVADO,3')
  );
  assert.deepEqual(csvDia.map((x) => x.id), ['d1']);

  const csvAv = parseAvisosRows(
    parseCSV('id,fecha_publicacion,titulo,mensaje,estado,orden\na1,12/11/2026,Ok,m,PUBLICADO,1\na2,12/11/2026,No,m,ARCHIVADO,2')
  );
  assert.deepEqual(csvAv.map((x) => x.id), ['a1']);

  const csvCal = parseCalendarioRows(
    parseCSV('id,fecha_inicio,titulo,descripcion,estado,orden\nc1,12/11/2026,Ok,d,PUBLICADO,1\nc2,12/11/2026,No,d,BORRADOR,2')
  );
  assert.deepEqual(csvCal.map((x) => x.id), ['c1']);

  const csvMed = parseMultimediaRows(
    parseCSV('id,fecha,titulo,descripcion,tipo,url_media,estado,orden\nm1,12/11/2026,Ok,d,FOTOGRAFIA,https://a/1.jpg,PUBLICADO,1\nm2,12/11/2026,No,d,FOTOGRAFIA,https://a/2.jpg,ARCHIVADO,2')
  );
  assert.deepEqual(csvMed.map((x) => x.id), ['m1']);

  const csvRec = parseRecursosRows(
    parseCSV('id,categoria,titulo,descripcion,tipo_recurso,asignatura,estado,orden\nr1,matematicas,Ok,d,Juego,Matemáticas,PUBLICADO,1\nr2,matematicas,No,d,Juego,Matemáticas,BORRADOR,2')
  );
  assert.deepEqual(csvRec.map((x) => x.id), ['r1']);
});

// 2. Categorías oficiales de APRENDEMOS
test('2a. normalizeAprendemosCategory asigna correctamente las 4 categorías oficiales de Google Sheets (con tildes)', () => {
  assert.equal(normalizeAprendemosCategory('Lectura y comprensión'), 'lectura');
  assert.equal(normalizeAprendemosCategory('Escritura y trazo'), 'escritura');
  assert.equal(normalizeAprendemosCategory('Cálculo y lógica'), 'calculo');
  assert.equal(normalizeAprendemosCategory('Talleres y dinámicas'), 'talleres');
  assert.equal(normalizeAprendemosCategory('CÁLCULO Y LÓGICA'), 'calculo');
  assert.equal(normalizeAprendemosCategory('talleres y dinamicas'), 'talleres');

  assert.equal(APRENDEMOS_CATEGORY_LABELS.lectura, 'Lectura y comprensión');
  assert.equal(APRENDEMOS_CATEGORY_LABELS.escritura, 'Escritura y trazo');
  assert.equal(APRENDEMOS_CATEGORY_LABELS.calculo, 'Cálculo y lógica');
  assert.equal(APRENDEMOS_CATEGORY_LABELS.talleres, 'Talleres y dinámicas');
});

test('2b. parseAprendemosRows, parseAppsScriptPayload y sortAprendemosItems migran categorías sin romper caché', () => {
  const csvRows = parseAprendemosRows([
    ['id', 'categoria', 'titulo', 'descripcion', 'tipo_recurso', 'nivel', 'estado', 'orden'],
    ['ap-4', 'Talleres y dinámicas', 'Rincón de emociones', 'Dinámica grupal', 'Taller', '1.º B', 'PUBLICADO', '4'],
    ['ap-3', 'Cálculo y lógica', 'Amigos del 10', 'Sumas', 'Actividad', '1.º B', 'PUBLICAR', '3'],
    ['ap-2', 'Escritura y trazo', 'Vocales enlazadas', 'Pauta montessori', 'Pauta', '1.º B', 'PUBLICAR', '2'],
    ['ap-1', 'Lectura y comprensión', 'Cuento semanal', 'Lectura guiada', 'Lectura', '1.º B', 'PUBLICAR', '1'],
  ]);
  assert.deepEqual(
    csvRows.map((x) => x.category),
    ['talleres', 'calculo', 'escritura', 'lectura']
  );

  // Simular item antiguo guardado en diario_sync_cache_v3 con category='matematicas' o 'pautas'
  const cachedLegacy = [
    {
      id: 'legacy-1',
      categoria: 'Cálculo y lógica',
      category: 'matematicas',
      title: 'Sumas',
      description: 'Sumas',
      level: '1.º B',
      tips: [],
      badge: 'Juego',
      orden: 1,
    } as EducationalResource,
    {
      id: 'legacy-2',
      categoria: 'Talleres y dinámicas',
      category: 'pautas',
      title: 'Asamblea',
      description: 'Asamblea',
      level: '1.º B',
      tips: [],
      badge: 'Taller',
      orden: 2,
    } as EducationalResource,
  ];
  const migrated = sortAprendemosItems(cachedLegacy);
  assert.deepEqual(migrated.map((x) => x.category), ['talleres', 'calculo']);
});

// 3. Sistema de búsquedas
test('3. Búsqueda tolerante ignora mayúsculas, tildes, espacios múltiples y restaura todo al limpiar', () => {
  assert.equal(normalizeSearchText('  Cálculo   y   Lógica  '), 'calculo y logica');
  assert.equal(
    matchesNormalizedSearch('  calculo   logica ', ['Amigos del 10', 'Cálculo y lógica']),
    true
  );
  assert.equal(
    matchesNormalizedSearch('ARBOL OTONO', ['Mural de árbol de otoño', 'Actividad plástica']),
    true
  );
  assert.equal(
    matchesNormalizedSearch('pinzas', ['Sumas', ['Utilizar pinzas de colores']]),
    true
  );
  assert.equal(matchesNormalizedSearch('   ', ['Cualquier texto']), true);
  assert.equal(matchesNormalizedSearch('inexistente', ['Cualquier texto']), false);
});

// 4. Próximos eventos del calendario (sin pasados, orden cronológico, multi-día y sin desfase UTC)
test('4. getUpcomingCalendarEvents excluye eventos pasados, mantiene multidia vigentes y ordena del más próximo al más lejano', () => {
  const makeEvent = (
    id: string,
    fechaInicio: string,
    fechaFin?: string,
    orden = 1,
    horaInicio?: string
  ): CalendarEvent => {
    const [d, m, y] = fechaInicio.split('/').map(Number);
    return {
      id,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      hora_inicio: horaInicio,
      titulo: `Evento ${id}`,
      descripcion: `Desc ${id}`,
      day: d,
      month: m - 1,
      year: y,
      title: `Evento ${id}`,
      description: `Desc ${id}`,
      type: 'lectivo',
      orden,
    };
  };

  // Fecha de referencia: 17/11/2026 (hora local)
  const refDate = new Date(2026, 10, 17, 23, 55, 0);

  const input: CalendarEvent[] = [
    makeEvent('pasado-ayer', '16/11/2026', undefined, 1),
    makeEvent('pasado-multidia', '10/11/2026', '15/11/2026', 2),
    makeEvent('lejano-enero', '15/01/2027', undefined, 3),
    makeEvent('hoy', '17/11/2026', undefined, 4),
    makeEvent('multidia-vigente', '14/11/2026', '19/11/2026', 5),
    makeEvent('proximo-diciembre', '06/12/2026', '08/12/2026', 6),
    makeEvent('manana', '18/11/2026', undefined, 7),
  ];

  const upcoming = getUpcomingCalendarEvents(input, refDate);
  assert.deepEqual(
    upcoming.map((e) => e.id),
    ['multidia-vigente', 'hoy', 'manana', 'proximo-diciembre', 'lejano-enero']
  );

  // Verificar que fechas válidas/inválidas de calendario no generan desfases UTC
  assert.equal(toDateCodeFromSpanish('01/01/2027'), 20270101);
  assert.equal(toDateCodeFromSpanish('31/02/2026'), null);
});

// 5. Persistencia de tareas completadas por ID estable y fallback por título
test('5. mergePostsWithCompleted prioriza item.id ante cambios de título y mantiene fallback legacy por title', () => {
  const mkPost = (id: string, title: string, completed = false): DiaADiaItem => ({
    id,
    fecha: '17/11/2026',
    titulo: title,
    contenido: 'Contenido',
    categoria: 'Tarea',
    destacado: false,
    estado: 'PUBLICAR',
    orden: 1,
    title,
    content: 'Contenido',
    tag: 'Tarea',
    date: '17/11/2026',
    timestamp: 1,
    completed,
    author: 'Manuel Herrera',
  });

  // Caso A: el docente cambia el título en Sheets pero conserva id='tarea-1'
  const previous = [mkPost('tarea-1', 'Leer página 5', true), mkPost('tarea-2', 'Traer cartulina', false)];
  const incomingRenamed = [mkPost('tarea-1', 'Leer páginas 5 y 6 en casa', false), mkPost('tarea-2', 'Traer cartulina azul', false)];
  const mergedA = mergePostsWithCompleted(incomingRenamed, previous);
  assert.equal(mergedA[0].completed, true, 'Debe conservar tarea-1 completada aunque cambie el título');
  assert.equal(mergedA[1].completed, false, 'Debe respetar tarea-2 no completada aunque estuviera en caché');

  // Caso B: primera hidratación con storage legacy donde solo coincide el título normalizado
  const memoryStorage = {
    getItem: (key: string) =>
      key === 'diario_posts'
        ? JSON.stringify([{ id: 'legacy-auto-9', title: 'Ficha de sumas', completed: true }])
        : null,
  };
  const mergedB = mergePostsWithCompleted([mkPost('tarea-oficial-1', '  ficha de sumas ', false)], [], memoryStorage);
  assert.equal(mergedB[0].completed, true, 'Debe recuperar estado completado por título en registros legacy');
});

// 6. Verificaciones estructurales en archivos modificados y protegidos
test('6. index.html permite zoom, InstallModal no enlaza ZIP, DiarioTab usa scrollTop de <main>, Code.gs intacto', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf-8');
  assert.ok(!indexHtml.includes('user-scalable=no'), 'index.html no debe bloquear user-scalable');
  assert.ok(!indexHtml.includes('maximum-scale=1.0'), 'index.html no debe fijar maximum-scale=1.0');

  const installModal = fs.readFileSync('src/components/InstallModal.tsx', 'utf-8');
  assert.ok(!installModal.includes('el-diario-del-aula-1b.zip'), 'InstallModal no debe incluir descarga ZIP');

  const diarioTab = fs.readFileSync('src/components/DiarioTab.tsx', 'utf-8');
  assert.ok(diarioTab.includes("target.closest('main')"), 'DiarioTab debe leer scrollTop del contenedor real <main>');
  assert.ok(!diarioTab.includes('if (window.scrollY === 0)'), 'DiarioTab no debe depender solo de window.scrollY');

  const aprendemosTab = fs.readFileSync('src/components/AprendemosTab.tsx', 'utf-8');
  assert.ok(!aprendemosTab.includes("setActiveCategory('juegos')"), 'AprendemosTab no debe usar categoría rota juegos');
  assert.ok(!aprendemosTab.includes("setActiveCategory('matematicas')"), 'AprendemosTab debe usar calculo para Cálculo y lógica');

  const codeGs = fs.readFileSync('Code.gs', 'utf-8');
  const scriptCodeGs = fs.readFileSync('google-apps-script/Code.gs', 'utf-8');
  assert.equal(codeGs, scriptCodeGs, 'Code.gs y google-apps-script/Code.gs deben permanecer idénticos e intactos');
});

console.log(`\nALL FINAL STABILIZATION TESTS PASSED (${passed}/${passed}).`);
