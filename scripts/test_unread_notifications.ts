import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  computeUnreadSummary,
  createDefaultReadStatusState,
  getFirstUnreadSection,
  getPublicationKey,
  loadReadStatusState,
  markPublicationAsRead,
  READ_STATUS_STORAGE_KEY,
  reconcileReadStatus,
  saveReadStatusState,
  SectionsContentSnapshot,
  StorageAdapter,
} from '../src/utils/readStatusService';
import { parseAppsScriptPayload } from '../src/services/sheetsService';
import {
  AvisoItem,
  CalendarEvent,
  DiaADiaItem,
  EducationalResource,
  HomeLearningResource,
  MultimediaItem,
} from '../src/types';

function createMemoryStorage(): StorageAdapter & { clear: () => void } {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    clear: () => map.clear(),
  };
}

function createFailingStorage(): StorageAdapter {
  return {
    getItem: () => {
      throw new Error('localStorage unavailable');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
}

function makeDiario(id: string, titulo: string, estado: DiaADiaItem['estado'] = 'PUBLICAR'): DiaADiaItem {
  return {
    id,
    fecha: '10/05/2026',
    titulo,
    contenido: `Contenido de ${titulo}`,
    categoria: 'General',
    destacado: false,
    estado,
    orden: 1,
    title: titulo,
    content: `Contenido de ${titulo}`,
    tag: 'General',
    date: '10/05/2026',
    timestamp: Date.now(),
    author: 'Manuel Herrera',
  };
}

function makeAviso(id: string, titulo: string, estado: AvisoItem['estado'] = 'PUBLICAR'): AvisoItem {
  return {
    id,
    fecha_publicacion: '10/05/2026',
    titulo,
    mensaje: `Mensaje de ${titulo}`,
    tipo: 'Aviso',
    prioridad: 'Normal',
    destacado: false,
    estado,
    orden: 1,
    author: 'Manuel Herrera',
    important: false,
  };
}

function makeEvento(id: string, titulo: string, estado: CalendarEvent['estado'] = 'PUBLICAR'): CalendarEvent {
  return {
    id,
    fecha_inicio: '20/05/2026',
    titulo,
    descripcion: `Descripción de ${titulo}`,
    categoria: 'salida',
    estado,
    day: 20,
    month: 4,
    year: 2026,
    title: titulo,
    description: `Descripción de ${titulo}`,
    type: 'salida',
  };
}

function makeMedia(id: string, titulo: string, estado: MultimediaItem['estado'] = 'PUBLICAR'): MultimediaItem {
  return {
    id,
    fecha: '11/05/2026',
    titulo,
    descripcion: `Fotos de ${titulo}`,
    tipo: 'FOTOGRAFIA',
    url_media: 'https://drive.google.com/example',
    estado,
    orden: 1,
  };
}

function makeAprendemos(id: string, titulo: string, estado: EducationalResource['estado'] = 'PUBLICAR'): EducationalResource {
  return {
    id,
    categoria: 'lectura',
    titulo,
    descripcion: `Trabajamos ${titulo}`,
    estado,
    category: 'lectura',
    title: titulo,
    description: `Trabajamos ${titulo}`,
    level: '1.º Primaria',
    tips: ['Leer 10 minutos al día'],
    badge: 'Contenido de clase',
  };
}

function makeRecurso(id: string, titulo: string, estado: HomeLearningResource['estado'] = 'PUBLICAR'): HomeLearningResource {
  return {
    id,
    categoria: 'matematicas',
    titulo,
    descripcion: `Recurso de ${titulo}`,
    tipo_recurso: 'Juego interactivo',
    url_recurso: 'https://example.org/juego',
    nivel: '1.º Primaria',
    estado,
    orden: 1,
  };
}

function createInitialSnapshot(): SectionsContentSnapshot {
  return {
    diario: [makeDiario('noticia001', 'Bienvenida al trimestre')],
    avisos: [makeAviso('aviso001', 'Reunión general de familias')],
    calendario: [makeEvento('cal001', 'Visita a la biblioteca')],
    multimedia: [makeMedia('media001', 'Taller de primavera')],
    aprendemos: [makeAprendemos('apr001', 'Sumas con llevadas')],
    recursos: [makeRecurso('rec001', 'Amigos del 10')],
  };
}

let passed = 0;
function runTest(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`✅ [PASS] ${name}`);
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    throw err;
  }
}

runTest('1. Primera visita: espera a carga completa (no inicializa en vacío) y evita avalancha histórica', () => {
  const storage = createMemoryStorage();
  let state = loadReadStatusState(storage);
  assert.equal(state.initialized, false);

  const emptySnapshot: SectionsContentSnapshot = {
    diario: [],
    avisos: [],
    calendario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  };

  // Mientras los datos no están listos, NO debe inicializar
  const beforeLoad = reconcileReadStatus(state, emptySnapshot, {
    isDataReady: false,
    hasConfirmedLiveSync: false,
  });
  assert.equal(beforeLoad.changed, false);
  assert.equal(beforeLoad.nextState.initialized, false);

  // Con caché vacía sin live sync confirmado, tampoco inicializa
  const emptyUnconfirmed = reconcileReadStatus(state, emptySnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: false,
  });
  assert.equal(emptyUnconfirmed.changed, false);
  assert.equal(emptyUnconfirmed.nextState.initialized, false);

  // Cuando las 6 secciones llegan cargadas por primera vez, establece referencia inicial con 0 novedades
  const initialSnapshot = createInitialSnapshot();
  const initialized = reconcileReadStatus(state, initialSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  assert.equal(initialized.changed, true);
  assert.equal(initialized.nextState.initialized, true);
  assert.equal(initialized.nextState.readIds.length, 6);
  saveReadStatusState(initialized.nextState, storage);

  const summary = computeUnreadSummary(initialized.nextState, initialSnapshot);
  assert.equal(summary.totalUnread, 0);
  assert.deepEqual(summary.counts, {
    diario: 0,
    avisos: 0,
    calendario: 0,
    multimedia: 0,
    aprendemos: 0,
    recursos: 0,
  });
});

runTest('2. Detección automática de una nueva publicación tras la referencia inicial', () => {
  const initialSnapshot = createInitialSnapshot();
  const { nextState: baseline } = reconcileReadStatus(
    createDefaultReadStatusState(),
    initialSnapshot,
    { isDataReady: true, hasConfirmedLiveSync: true }
  );

  const updatedSnapshot: SectionsContentSnapshot = {
    ...initialSnapshot,
    avisos: [
      makeAviso('aviso002', 'Excursión al jardín botánico'),
      ...initialSnapshot.avisos,
    ],
  };

  const { nextState, changed } = reconcileReadStatus(baseline, updatedSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  assert.equal(changed, true);

  const summary = computeUnreadSummary(nextState, updatedSnapshot);
  assert.equal(summary.totalUnread, 1);
  assert.equal(summary.counts.avisos, 1);
  assert.equal(summary.counts.diario, 0);
  assert.equal(summary.unreadKeys.has('avisos:id:aviso002'), true);
  assert.equal(summary.unreadKeys.has('avisos:id:aviso001'), false);
  assert.equal(getFirstUnreadSection(summary.counts), 'avisos');
});

runTest('3 y 4. Detección simultánea en las 6 secciones con contadores independientes', () => {
  const initialSnapshot = createInitialSnapshot();
  const { nextState: baseline } = reconcileReadStatus(
    createDefaultReadStatusState(),
    initialSnapshot,
    { isDataReady: true, hasConfirmedLiveSync: true }
  );

  const updatedSnapshot: SectionsContentSnapshot = {
    diario: [
      makeDiario('noticia002', 'Taller de cuentos'),
      makeDiario('noticia003', 'Huerto escolar'),
      ...initialSnapshot.diario,
    ],
    avisos: [makeAviso('aviso002', 'Circular comedor'), ...initialSnapshot.avisos],
    calendario: [makeEvento('cal002', 'Fiesta fin de curso'), ...initialSnapshot.calendario],
    multimedia: [makeMedia('media002', 'Álbum de teatro'), ...initialSnapshot.multimedia],
    aprendemos: [makeAprendemos('apr002', 'Lectura comprensiva'), ...initialSnapshot.aprendemos],
    recursos: [makeRecurso('rec002', 'Ficha de caligrafía'), ...initialSnapshot.recursos],
  };

  const { nextState } = reconcileReadStatus(baseline, updatedSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });

  const summary = computeUnreadSummary(nextState, updatedSnapshot);
  assert.equal(summary.totalUnread, 7);
  assert.deepEqual(summary.counts, {
    diario: 2,
    avisos: 1,
    calendario: 1,
    multimedia: 1,
    aprendemos: 1,
    recursos: 1,
  });
});

runTest('5, 6 y 7. Marcado individual como leído actualiza etiqueta NUEVO, contador de sección y global', () => {
  const initialSnapshot = createInitialSnapshot();
  const { nextState: baseline } = reconcileReadStatus(
    createDefaultReadStatusState(),
    initialSnapshot,
    { isDataReady: true, hasConfirmedLiveSync: true }
  );

  const snapshotWith2New: SectionsContentSnapshot = {
    ...initialSnapshot,
    diario: [
      makeDiario('noticia002', 'Crónica lunes'),
      makeDiario('noticia003', 'Crónica martes'),
      ...initialSnapshot.diario,
    ],
  };

  const { nextState: detected } = reconcileReadStatus(baseline, snapshotWith2New, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });

  const keyA = getPublicationKey('diario', snapshotWith2New.diario[0]);
  const keyB = getPublicationKey('diario', snapshotWith2New.diario[1]);

  // Leer solo la publicación A: B debe seguir como NUEVO
  const { nextState: afterReadA, changed } = markPublicationAsRead(detected, keyA);
  assert.equal(changed, true);

  const summaryAfterA = computeUnreadSummary(afterReadA, snapshotWith2New);
  assert.equal(summaryAfterA.unreadKeys.has(keyA), false);
  assert.equal(summaryAfterA.unreadKeys.has(keyB), true);
  assert.equal(summaryAfterA.counts.diario, 1);
  assert.equal(summaryAfterA.totalUnread, 1);

  // Leer también la publicación B: contador pasa a 0
  const { nextState: afterReadB } = markPublicationAsRead(afterReadA, keyB);
  const summaryAfterB = computeUnreadSummary(afterReadB, snapshotWith2New);
  assert.equal(summaryAfterB.counts.diario, 0);
  assert.equal(summaryAfterB.totalUnread, 0);
});

runTest('8 y 9. Persistencia tras cierre/reapertura e independencia total entre dispositivos', () => {
  const deviceAStorage = createMemoryStorage();
  const deviceBStorage = createMemoryStorage();

  const initialSnapshot = createInitialSnapshot();

  // Ambos dispositivos arrancan inicialmente con el historial existente
  const baseA = reconcileReadStatus(loadReadStatusState(deviceAStorage), initialSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(baseA, deviceAStorage);

  const baseB = reconcileReadStatus(loadReadStatusState(deviceBStorage), initialSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(baseB, deviceBStorage);

  // Llega una publicación nueva
  const nextSnapshot: SectionsContentSnapshot = {
    ...initialSnapshot,
    recursos: [makeRecurso('rec002', 'Juego de sumas'), ...initialSnapshot.recursos],
  };

  const stateA = reconcileReadStatus(loadReadStatusState(deviceAStorage), nextSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(stateA, deviceAStorage);

  const stateB = reconcileReadStatus(loadReadStatusState(deviceBStorage), nextSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(stateB, deviceBStorage);

  // Dispositivo A lee la publicación y "cierra y reabre" la aplicación
  const newKey = getPublicationKey('recursos', nextSnapshot.recursos[0]);
  const readA = markPublicationAsRead(stateA, newKey).nextState;
  saveReadStatusState(readA, deviceAStorage);

  const reloadedA = loadReadStatusState(deviceAStorage);
  const reloadedB = loadReadStatusState(deviceBStorage);

  assert.equal(computeUnreadSummary(reloadedA, nextSnapshot).totalUnread, 0);
  assert.equal(computeUnreadSummary(reloadedB, nextSnapshot).totalUnread, 1);
  assert.equal(computeUnreadSummary(reloadedB, nextSnapshot).unreadKeys.has(newKey), true);
});

runTest('10. Excluye BORRADOR y ARCHIVADO, y detecta novedad cuando pasa a PUBLICAR o PUBLICADO', () => {
  const initialSnapshot = createInitialSnapshot();
  const { nextState: baseline } = reconcileReadStatus(
    createDefaultReadStatusState(),
    initialSnapshot,
    { isDataReady: true, hasConfirmedLiveSync: true }
  );

  const withDraftAndArchived: SectionsContentSnapshot = {
    ...initialSnapshot,
    avisos: [
      makeAviso('aviso-borrador', 'Borrador secreto', 'BORRADOR'),
      makeAviso('aviso-archivado', 'Antiguo archivado', 'ARCHIVADO'),
      ...initialSnapshot.avisos,
    ],
  };

  const { nextState: afterDraft } = reconcileReadStatus(baseline, withDraftAndArchived, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  assert.equal(computeUnreadSummary(afterDraft, withDraftAndArchived).totalUnread, 0);

  // Ahora ese borrador pasa a estado PUBLICADO (compatible con parseAppsScriptPayload)
  const payload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [],
    avisos: [
      {
        id: 'aviso-borrador',
        fecha_publicacion: '12/05/2026',
        titulo: 'Ahora publicado',
        mensaje: 'Texto visible',
        tipo: 'General',
        prioridad: 'Normal',
        estado: 'PUBLICADO',
        orden: 5,
      },
      {
        id: 'aviso-oculto',
        fecha_publicacion: '12/05/2026',
        titulo: 'Sigue en borrador',
        mensaje: 'No visible',
        tipo: 'General',
        prioridad: 'Normal',
        estado: 'BORRADOR',
        orden: 6,
      },
    ],
    calendario: [],
    horario: [],
    multimedia: [],
    aprendemos: [],
    recursos: [],
  });

  const publishedSnapshot: SectionsContentSnapshot = {
    ...initialSnapshot,
    avisos: [...payload.avisos, ...initialSnapshot.avisos],
  };

  const { nextState: afterPublish } = reconcileReadStatus(afterDraft, publishedSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  const summary = computeUnreadSummary(afterPublish, publishedSnapshot);
  assert.equal(summary.totalUnread, 1);
  assert.equal(summary.unreadKeys.has('avisos:id:aviso-borrador'), true);
  assert.equal(summary.unreadKeys.has('avisos:id:aviso-oculto'), false);
});

runTest('11. Ausencia de duplicados al recargar repetidamente y estabilidad ante edición de texto existente', () => {
  const initialSnapshot = createInitialSnapshot();
  const { nextState: baseline } = reconcileReadStatus(
    createDefaultReadStatusState(),
    initialSnapshot,
    { isDataReady: true, hasConfirmedLiveSync: true }
  );

  // Editar el título/contenido de una publicación existente manteniendo su ID real no genera NUEVO
  const editedSnapshot: SectionsContentSnapshot = {
    ...initialSnapshot,
    diario: [makeDiario('noticia001', 'Bienvenida al trimestre (texto corregido)')],
  };

  const refresh1 = reconcileReadStatus(baseline, editedSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  const refresh2 = reconcileReadStatus(refresh1.nextState, editedSnapshot, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });

  assert.equal(refresh1.changed, false);
  assert.equal(refresh2.changed, false);
  assert.equal(computeUnreadSummary(refresh2.nextState, editedSnapshot).totalUnread, 0);
  assert.equal(
    new Set(refresh2.nextState.knownIds).size,
    refresh2.nextState.knownIds.length
  );
});

runTest('12. Prioriza IDs reales de Google Sheets y usa huella determinista solo cuando falta ID real', () => {
  const realKey = getPublicationKey('diario', makeDiario('noticia001', 'Título A'));
  assert.equal(realKey, 'diario:id:noticia001');

  // Si sheetsService sintetiza `dia-0` porque faltaba la columna ID, usa huella determinista estable
  const withoutIdAtPos0 = getPublicationKey('diario', makeDiario('dia-0', 'Excursión sin ID'));
  const sameMovedToPos3 = getPublicationKey('diario', makeDiario('dia-3', 'Excursión sin ID'));
  const emptyId = getPublicationKey('diario', makeDiario('', 'Excursión sin ID'));

  assert.equal(withoutIdAtPos0.startsWith('diario:fp:'), true);
  assert.equal(withoutIdAtPos0, sameMovedToPos3);
  assert.equal(withoutIdAtPos0, emptyId);
});

runTest('13. Resiliencia cuando localStorage falla o se borra el almacenamiento del navegador', () => {
  const failing = createFailingStorage();
  const loaded = loadReadStatusState(failing);
  assert.equal(loaded.initialized, false);
  assert.equal(saveReadStatusState(loaded, failing), false);

  // Si el usuario borra localStorage, la próxima carga re-establece referencia limpia sin falsos positivos
  const storage = createMemoryStorage();
  const snap = createInitialSnapshot();
  const init1 = reconcileReadStatus(loadReadStatusState(storage), snap, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(init1, storage);
  assert.ok(storage.getItem(READ_STATUS_STORAGE_KEY));

  storage.clear();
  const afterClear = loadReadStatusState(storage);
  assert.equal(afterClear.initialized, false);
  const reInit = reconcileReadStatus(afterClear, snap, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  assert.equal(reInit.initialized, true);
  assert.equal(computeUnreadSummary(reInit, snap).totalUnread, 0);
});

runTest('14. Verificación estática de integración, exclusión de Horario y conservación de Fase 1 y elementos protegidos', () => {
  const root = process.cwd();
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

  // Integración de NewBadge y marcado explícito en las 6 secciones publicables
  for (const rel of [
    'src/components/DiarioTab.tsx',
    'src/components/AvisosTab.tsx',
    'src/components/HorarioCalendarioTab.tsx',
    'src/components/MultimediaTab.tsx',
    'src/components/AprendemosTab.tsx',
    'src/components/RecursosTab.tsx',
  ]) {
    const code = read(rel);
    assert.equal(code.includes('NewBadge'), true, `${rel} debe mostrar NewBadge`);
    assert.equal(code.includes('onMarkAsRead'), true, `${rel} debe soportar marcado individual`);
    assert.equal(code.includes('dangerouslySetInnerHTML'), false, `${rel} no debe usar HTML inseguro`);
  }

  // Conservación de Fase 1 y elementos protegidos
  assert.equal(read('src/components/AvisosTab.tsx').includes('<FormattedText'), true);
  assert.equal(read('src/components/DiarioTab.tsx').includes('<FormattedText'), true);
  assert.equal(read('src/components/DiarioTab.tsx').includes("target.closest('main')"), true);
  assert.equal(read('src/components/AprendemosTab.tsx').includes('normalizeAprendemosTips'), true);
  assert.equal(read('src/components/InicioTab.tsx').includes('/portada-aula-1b.png'), true);
  assert.equal(read('src/components/InicioTab.tsx').includes('/pwa-192x192.png'), true);
  assert.equal(
    read('src/components/MultimediaTab.tsx').includes('https://www.youtube.com/@Hormiguitasde1oB'),
    true
  );
  assert.equal(
    read('src/components/MultimediaTab.tsx').includes('1WZvH8J46ub2uFwT34S2pE2XLWbHzUlNl'),
    true
  );
  assert.equal(
    read('src/components/MultimediaTab.tsx').includes('1goiI0L52EvoTcYfyu_MYAUlAdTMDcbLy'),
    true
  );
  assert.equal(
    read('src/components/MultimediaTab.tsx').includes('1rO4wE-kdI4m1PiJQw51x3X-MU0kiJZ0a'),
    true
  );

  // Horario no recibe contador en BottomNav/Header/Inicio, pero sí reenvía props al subcomponente por si se cambia a subvista Calendario
  const appCode = read('src/App.tsx');
  assert.equal(appCode.includes('NovedadesBanner'), true);
  assert.equal(appCode.includes('useUnreadContent'), true);
  assert.equal(read('src/components/BottomNav.tsx').includes('unreadCounts'), true);
  assert.equal(read('src/components/Header.tsx').includes('unreadCounts'), true);
});

runTest('15. Flujo completo RECURSOS con 4 recomendaciones nuevas (IDs numéricos, texto y sin URL): lectura individual, banner a 0, persistencia, recarga Sheets y 5.ª novedad', () => {
  const storage = createMemoryStorage();
  const basePayload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [{ id: 'dia-base-1', fecha: '01/05/2026', titulo: 'Inicio de mes', contenido: 'Hola', categoria: 'General', estado: 'PUBLICAR', orden: 1 }],
    avisos: [{ id: 'av-base-1', fecha_publicacion: '01/05/2026', titulo: 'Aviso base', mensaje: 'Info', tipo: 'Aviso', prioridad: 'Normal', estado: 'PUBLICAR', orden: 1 }],
    calendario: [{ id: 'cal-base-1', fecha_inicio: '15/05/2026', titulo: 'Evento base', descripcion: 'Desc', categoria: 'Evento', estado: 'PUBLICAR', orden: 1 }],
    horario: [],
    multimedia: [{ id: 'med-base-1', fecha: '02/05/2026', titulo: 'Foto base', descripcion: 'Desc', tipo: 'FOTOGRAFIA', url_media: 'https://example.org/f1', estado: 'PUBLICAR', orden: 1 }],
    aprendemos: [{ id: 'apr-base-1', categoria: 'lectura', titulo: 'Lectura base', descripcion: 'Desc', estado: 'PUBLICAR', orden: 1 }],
    recursos: [{ id: 'rec-base-1', categoria: 'lengua_lectura', titulo: 'Recurso previo', descripcion: 'Previo', tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 1 }],
  });

  const toSnapshot = (p: ReturnType<typeof parseAppsScriptPayload>): SectionsContentSnapshot => ({
    diario: p.posts,
    avisos: p.avisos,
    calendario: p.events,
    multimedia: p.multimedia,
    aprendemos: p.aprendemos,
    recursos: p.recursos,
  });

  // Paso 1: Primera instalación (referencia inicial sin falsas novedades)
  const snap0 = toSnapshot(basePayload);
  const initRes = reconcileReadStatus(loadReadStatusState(storage), snap0, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  saveReadStatusState(initRes.nextState, storage);
  assert.equal(computeUnreadSummary(initRes.nextState, snap0).totalUnread, 0);

  // Paso 2: Se añaden 4 recomendaciones nuevas en RECURSOS (IDs numéricos 1 y 2, texto y sin ID; con y sin url_recurso)
  const fourNewRecursos = [
    { id: 1, categoria: 'familias', titulo: 'Lectura compartida 10 minutos', descripcion: 'Leer cada tarde en voz alta.', tipo_recurso: 'Orientación', estado: 'PUBLICADO', orden: 5 },
    { id: 2, categoria: 'matematicas', titulo: 'Juegos de cálculo mental', descripcion: 'Sumar hasta 10 con dados.', tipo_recurso: 'Juego', url_recurso: 'https://example.org/calculo', estado: 'PUBLICAR', orden: 4 },
    { id: 'rec-casa-3', categoria: 'familias', titulo: 'Rutina de mochila y agenda', descripcion: 'Preparar la mochila la noche anterior.', tipo_recurso: 'Pauta familiar', estado: 'PUBLICADO', orden: 3 },
    { id: '', categoria: 'lengua_lectura', titulo: 'Cuentos antes de dormir', descripcion: 'Comentar los personajes del cuento.', tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 2 },
  ];

  const payloadWith4 = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [{ id: 'dia-base-1', fecha: '01/05/2026', titulo: 'Inicio de mes', contenido: 'Hola', categoria: 'General', estado: 'PUBLICAR', orden: 1 }],
    avisos: [{ id: 'av-base-1', fecha_publicacion: '01/05/2026', titulo: 'Aviso base', mensaje: 'Info', tipo: 'Aviso', prioridad: 'Normal', estado: 'PUBLICAR', orden: 1 }],
    calendario: [{ id: 'cal-base-1', fecha_inicio: '15/05/2026', titulo: 'Evento base', descripcion: 'Desc', categoria: 'Evento', estado: 'PUBLICAR', orden: 1 }],
    horario: [],
    multimedia: [{ id: 'med-base-1', fecha: '02/05/2026', titulo: 'Foto base', descripcion: 'Desc', tipo: 'FOTOGRAFIA', url_media: 'https://example.org/f1', estado: 'PUBLICAR', orden: 1 }],
    aprendemos: [{ id: 'apr-base-1', categoria: 'lectura', titulo: 'Lectura base', descripcion: 'Desc', estado: 'PUBLICAR', orden: 1 }],
    recursos: [
      ...fourNewRecursos,
      { id: 'rec-base-1', categoria: 'lengua_lectura', titulo: 'Recurso previo', descripcion: 'Previo', tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 1 },
    ],
  });

  // Verificar que los IDs numéricos de Sheets se normalizan a clave real :id:1 y :id:2
  const snap4 = toSnapshot(payloadWith4);
  assert.equal(getPublicationKey('recursos', snap4.recursos[0]), 'recursos:id:1');
  assert.equal(getPublicationKey('recursos', snap4.recursos[1]), 'recursos:id:2');
  assert.equal(getPublicationKey('recursos', snap4.recursos[2]), 'recursos:id:rec-casa-3');
  assert.equal(getPublicationKey('recursos', snap4.recursos[3]).startsWith('recursos:fp:'), true);

  let state = reconcileReadStatus(loadReadStatusState(storage), snap4, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  saveReadStatusState(state, storage);

  let summary = computeUnreadSummary(state, snap4);
  assert.equal(summary.totalUnread, 4);
  assert.equal(summary.counts.recursos, 4);

  // Paso 3 y 4: Consultar/abrir cada una de las 4 recomendaciones descuenta 4 -> 3 -> 2 -> 1 -> 0
  const newKeys = snap4.recursos.slice(0, 4).map((r) => getPublicationKey('recursos', r));
  newKeys.forEach((key, idx) => {
    state = markPublicationAsRead(state, key).nextState;
    saveReadStatusState(state, storage);
    summary = computeUnreadSummary(state, snap4);
    assert.equal(summary.unreadKeys.has(key), false, `Clave ${key} debe dejar de estar sin leer`);
    assert.equal(summary.counts.recursos, 3 - idx);
    assert.equal(summary.totalUnread, 3 - idx);
  });

  assert.equal(summary.totalUnread, 0);
  assert.equal(summary.counts.recursos, 0);

  // Paso 5: Cerrar y reabrir la aplicación -> 0 novedades, banner no reaparece
  const reopenedState = loadReadStatusState(storage);
  const reopenedSummary = computeUnreadSummary(reopenedState, snap4);
  assert.equal(reopenedSummary.totalUnread, 0);
  assert.equal(reopenedSummary.counts.recursos, 0);

  // Paso 8: Recargar datos desde Google Sheets -> sin errores, sin regresiones ni duplicados
  const reloadedPayload = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [{ id: 'dia-base-1', fecha: '01/05/2026', titulo: 'Inicio de mes', contenido: 'Hola', categoria: 'General', estado: 'PUBLICAR', orden: 1 }],
    avisos: [{ id: 'av-base-1', fecha_publicacion: '01/05/2026', titulo: 'Aviso base', mensaje: 'Info', tipo: 'Aviso', prioridad: 'Normal', estado: 'PUBLICAR', orden: 1 }],
    calendario: [{ id: 'cal-base-1', fecha_inicio: '15/05/2026', titulo: 'Evento base', descripcion: 'Desc', categoria: 'Evento', estado: 'PUBLICAR', orden: 1 }],
    horario: [],
    multimedia: [{ id: 'med-base-1', fecha: '02/05/2026', titulo: 'Foto base', descripcion: 'Desc', tipo: 'FOTOGRAFIA', url_media: 'https://example.org/f1', estado: 'PUBLICAR', orden: 1 }],
    aprendemos: [{ id: 'apr-base-1', categoria: 'lectura', titulo: 'Lectura base', descripcion: 'Desc', estado: 'PUBLICAR', orden: 1 }],
    recursos: [
      ...fourNewRecursos,
      { id: 'rec-base-1', categoria: 'lengua_lectura', titulo: 'Recurso previo', descripcion: 'Previo', tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 1 },
    ],
  });
  const snapReloaded = toSnapshot(reloadedPayload);
  const afterSheetsReload = reconcileReadStatus(reopenedState, snapReloaded, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  });
  assert.equal(afterSheetsReload.changed, false);
  assert.equal(computeUnreadSummary(afterSheetsReload.nextState, snapReloaded).totalUnread, 0);

  // Paso 6: Añadir una 5.ª recomendación nueva después de leer las 4 -> SOLO la 5.ª es no leída
  const payloadWith5 = parseAppsScriptPayload({
    config: {},
    dia_a_dia: [{ id: 'dia-base-1', fecha: '01/05/2026', titulo: 'Inicio de mes', contenido: 'Hola', categoria: 'General', estado: 'PUBLICAR', orden: 1 }],
    avisos: [{ id: 'av-base-1', fecha_publicacion: '01/05/2026', titulo: 'Aviso base', mensaje: 'Info', tipo: 'Aviso', prioridad: 'Normal', estado: 'PUBLICAR', orden: 1 }],
    calendario: [{ id: 'cal-base-1', fecha_inicio: '15/05/2026', titulo: 'Evento base', descripcion: 'Desc', categoria: 'Evento', estado: 'PUBLICAR', orden: 1 }],
    horario: [],
    multimedia: [{ id: 'med-base-1', fecha: '02/05/2026', titulo: 'Foto base', descripcion: 'Desc', tipo: 'FOTOGRAFIA', url_media: 'https://example.org/f1', estado: 'PUBLICAR', orden: 1 }],
    aprendemos: [{ id: 'apr-base-1', categoria: 'lectura', titulo: 'Lectura base', descripcion: 'Desc', estado: 'PUBLICAR', orden: 1 }],
    recursos: [
      { id: 5, categoria: 'familias', titulo: 'Nueva 5.ª recomendación', descripcion: 'Hábitos de descanso.', tipo_recurso: 'Orientación', estado: 'PUBLICAR', orden: 6 },
      ...fourNewRecursos,
      { id: 'rec-base-1', categoria: 'lengua_lectura', titulo: 'Recurso previo', descripcion: 'Previo', tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 1 },
    ],
  });
  const snap5 = toSnapshot(payloadWith5);
  const stateWith5 = reconcileReadStatus(afterSheetsReload.nextState, snap5, {
    isDataReady: true,
    hasConfirmedLiveSync: true,
  }).nextState;
  const summary5 = computeUnreadSummary(stateWith5, snap5);
  assert.equal(summary5.totalUnread, 1);
  assert.equal(summary5.counts.recursos, 1);
  assert.equal(summary5.unreadKeys.has('recursos:id:5'), true);
  for (const prevKey of newKeys) {
    assert.equal(summary5.unreadKeys.has(prevKey), false);
  }
});

runTest('16. IDs numéricos (incluido 0) y caracteres invisibles Unicode producen claves reales estables', () => {
  assert.equal(getPublicationKey('recursos', { id: 0, titulo: 'Cero' }), 'recursos:id:0');
  assert.equal(getPublicationKey('recursos', { id: 42, titulo: 'Cuarenta y dos' }), 'recursos:id:42');
  assert.equal(getPublicationKey('diario', { id: ' \u200Bnoticia99\uFEFF ', titulo: 'Con espacio' }), 'diario:id:noticia99');
});

runTest('17. Verificación estática de correcciones: guardado síncrono, carga completa, consulta por tarjeta y limpieza de contadores', () => {
  const root = process.cwd();
  const read = (rel: string) => fs.readFileSync(path.join(root, rel), 'utf8');

  // Persistencia síncrona en useUnreadContent y espera a isDataReady
  const hookCode = read('src/hooks/useUnreadContent.ts');
  assert.equal(hookCode.includes('readStateRef'), true);
  assert.equal(hookCode.includes('isDataReady &&\n    readState.initialized'), true);
  assert.equal(hookCode.includes('clearSessionBannerDismissed'), true);

  // App.tsx espera al intento inicial de sincronización antes de marcar isUnreadDataReady
  const appCode = read('src/App.tsx');
  assert.equal(appCode.includes('hasCompletedInitialSyncAttempt'), true);

  // InicioTab usa avisosUnread en la campana superior (sin contador rojo permanente tras leer)
  const inicioCode = read('src/components/InicioTab.tsx');
  assert.equal(inicioCode.includes('{avisosUnread > 0 && ('), true);

  // Todas las secciones consultables abren ficha detallada y marcan como leído al abrir la tarjeta
  for (const [rel, modalId] of [
    ['src/components/RecursosTab.tsx', 'recurso-detail-title'],
    ['src/components/DiarioTab.tsx', 'diario-detail-title'],
    ['src/components/AvisosTab.tsx', 'aviso-detail-title'],
    ['src/components/AprendemosTab.tsx', 'aprendemos-detail-title'],
    ['src/components/MultimediaTab.tsx', 'multimedia-detail-title'],
    ['src/components/HorarioCalendarioTab.tsx', 'event-detail-title'],
  ] as const) {
    const code = read(rel);
    assert.equal(code.includes(modalId), true, `${rel} debe abrir ficha detallada (${modalId})`);
    assert.equal(code.includes('role="dialog"'), true, `${rel} debe exponer diálogo accesible`);
  }
});

console.log(`\n🎉 Todas las pruebas de Fase 2 (novedades y lectura) superadas: ${passed}/${passed}`);
