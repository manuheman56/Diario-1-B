import assert from 'node:assert/strict';
import {
  CACHE_STORAGE_KEY,
  executeSyncWithDeps,
  readCachedSyncResult,
  mergeWithValidCache,
  parseAppsScriptPayload,
  hasAnySyncData,
  StorageLike,
} from '../src/services/sheetsService';

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & { dump: () => Record<string, string> } {
  const map = new Map<string, string>(Object.entries(initial));
  return {
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    dump: () => Object.fromEntries(map.entries()),
  };
}

function buildFullServerData(suffix = 'v1') {
  return {
    config: {
      nombre: `1.º B (${suffix})`,
      colegio: 'CEIP Dr. Fleming',
      tutor: 'El profe Manolo',
      curso_escolar: '2026/27',
    },
    dia_a_dia: [
      {
        id: `dia-1-${suffix}`,
        fecha: '15/11/2026',
        titulo: `Lectura ${suffix}`,
        contenido: 'Trabajamos lectura compartida',
        categoria: 'General',
        estado: 'PUBLICAR',
        orden: 2,
      },
      {
        id: `dia-0-${suffix}`,
        fecha: '10/11/2026',
        titulo: `Inicio ${suffix}`,
        contenido: 'Bienvenida',
        categoria: 'Tarea',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    avisos: [
      {
        id: `av-${suffix}`,
        fecha_publicacion: '15/11/2026',
        titulo: `Circular ${suffix}`,
        mensaje: 'Traer autorización firmada',
        tipo: 'Urgente',
        prioridad: 'Alta',
        estado: 'PUBLICAR',
        orden: 5,
      },
    ],
    calendario: [
      {
        id: `cal-${suffix}`,
        fecha_inicio: '25/11/2026',
        titulo: `Visita museo ${suffix}`,
        descripcion: 'Salida educativa',
        categoria: 'salida',
        estado: 'PUBLICAR',
        orden: 1,
      },
    ],
    horario: [
      {
        dia_semana: 'Lunes',
        orden_sesion: 1,
        hora_inicio: '09:00',
        hora_fin: '10:00',
        asignatura: `Lengua Castellana ${suffix}`,
        observaciones: 'Aula 1º B',
      },
    ],
    multimedia: [
      {
        id: `med-${suffix}`,
        fecha: '14/11/2026',
        titulo: `Foto ${suffix}`,
        descripcion: 'Taller de otoño',
        tipo: 'FOTOGRAFIA',
        url_media: 'https://example.com/foto.jpg',
        estado: 'PUBLICAR',
        orden: 3,
      },
    ],
    aprendemos: [
      {
        id: `apr-${suffix}`,
        categoria: 'lectura',
        titulo: `Sílabas ${suffix}`,
        descripcion: 'Practicamos sílabas trabadas.\n• Leer diez minutos al día.',
        tipo_recurso: 'Contenido de clase',
        estado: 'PUBLICAR',
        orden: 4,
      },
    ],
    recursos: [
      {
        id: `rec-${suffix}`,
        categoria: 'matematicas',
        titulo: `Sumas ${suffix}`,
        descripcion: 'Ficha interactiva',
        tipo_recurso: 'Juego',
        asignatura: 'Matemáticas',
        estado: 'PUBLICAR',
        orden: 6,
      },
    ],
  };
}

let passed = 0;
function test(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passed += 1;
      console.log(`PASS: ${name}`);
    });
}

async function runTests() {
  await test('1. Primera apertura con conexión carga las 8 fuentes/secciones y persiste en diario_sync_cache_v3', async () => {
    const storage = createMemoryStorage();
    const serverData = buildFullServerData('inicial');
    let jsonpParams: Record<string, string> = {};

    const res = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      now: () => 1700000001000,
      fetchJsonp: async (_url, params) => {
        jsonpParams = params;
        return { success: true, data: serverData };
      },
      fetchDirect: async () => {
        throw new Error('No debería llamarse si JSONP funciona');
      },
    });

    assert.equal(jsonpParams.action, 'all');
    assert.equal(jsonpParams.t, '1700000001000', 'Debe incluir cache-buster incluso en carga inicial');
    assert.equal(res.source, 'apps-script');
    assert.equal(res.isPendingConfig, false);
    assert.equal(res.config.classTitle, '1.º B (inicial)');
    assert.equal(res.posts.length, 2);
    assert.equal(res.avisos.length, 1);
    assert.equal(res.events.length, 1);
    assert.equal(res.schedule?.Lunes.length, 1);
    assert.equal(res.multimedia.length, 1);
    assert.equal(res.aprendemos.length, 1);
    assert.equal(res.recursos.length, 1);
    assert.ok(storage.getItem(CACHE_STORAGE_KEY), 'Debe guardar diario_sync_cache_v3');
  });

  await test('2. Apertura posterior recupera síncronamente TODAS las secciones desde diario_sync_cache_v3 y luego actualiza en vivo', async () => {
    const storage = createMemoryStorage();
    const v1 = buildFullServerData('v1');
    await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: v1 }),
    });

    // Lectura síncrona inmediata al abrir la app/PWA
    const instant = readCachedSyncResult(storage);
    assert.ok(instant);
    assert.equal(instant.source, 'cache');
    assert.equal(instant.posts[0].id, 'dia-1-v1');
    assert.equal(instant.avisos[0].id, 'av-v1');
    assert.equal(instant.events[0].id, 'cal-v1');
    assert.equal(instant.schedule?.Lunes[0].asignatura, 'Lengua Castellana v1');
    assert.equal(instant.multimedia[0].id, 'med-v1');
    assert.equal(instant.aprendemos[0].id, 'apr-v1');
    assert.equal(instant.recursos[0].id, 'rec-v1');

    // Sincronización en segundo plano actualiza con v2
    const v2 = buildFullServerData('v2');
    const updated = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: v2 }),
    });
    assert.equal(updated.source, 'apps-script');
    assert.equal(updated.posts[0].id, 'dia-1-v2');
    assert.equal(updated.avisos[0].id, 'av-v2');
    assert.equal(updated.recursos[0].id, 'rec-v2');
  });

  await test('3. Apertura sin conexión con caché disponible devuelve inmediatamente caché válido sin esperar red', async () => {
    const storage = createMemoryStorage();
    await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: buildFullServerData('offline-ok') }),
    });

    let networkCalled = false;
    const res = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => false,
      storage,
      fetchJsonp: async () => {
        networkCalled = true;
        return null;
      },
      fetchDirect: async () => {
        networkCalled = true;
        return null;
      },
    });

    assert.equal(networkCalled, false, 'No debe bloquear con red cuando navigator.onLine === false');
    assert.equal(res.source, 'cache');
    assert.equal(res.fromFallback, true);
    assert.equal(res.posts.length, 2);
    assert.equal(res.avisos.length, 1);
    assert.equal(res.schedule?.Lunes.length, 1);
    assert.equal(res.multimedia.length, 1);
    assert.equal(res.aprendemos.length, 1);
    assert.equal(res.recursos.length, 1);
  });

  await test('4. Apertura sin conexión y sin caché devuelve estado de error explícito sin inventar datos', async () => {
    const storage = createMemoryStorage();
    const res = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => false,
      storage,
    });

    assert.equal(res.source, 'error');
    assert.ok(res.errorMessage);
    assert.equal(hasAnySyncData(res), false);
  });

  await test('5. Error temporal de Apps Script (timeout o {success:false}) conserva datos válidos sin sobrescribir caché con arrays vacíos', async () => {
    const storage = createMemoryStorage();
    await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: buildFullServerData('estable') }),
    });

    // 5a: JSONP devuelve { success: false } y fetch también falla
    const errRes = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: false, error: 'Quota exceeded' }),
      fetchDirect: async () => {
        throw new Error('HTTP 503');
      },
    });

    assert.equal(errRes.source, 'cache');
    assert.equal(errRes.fromFallback, true);
    assert.equal(errRes.posts[0].id, 'dia-1-estable');
    assert.equal(errRes.avisos[0].id, 'av-estable');

    const persisted = readCachedSyncResult(storage);
    assert.ok(persisted);
    assert.equal(persisted.posts[0].id, 'dia-1-estable');

    // 5b: JSONP devuelve payload inválido pero fetchDirect logra recuperarse
    const recoveredViaFetch = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: false }),
      fetchDirect: async () => ({ success: true, data: buildFullServerData('via-fetch') }),
    });

    assert.equal(recoveredViaFetch.source, 'apps-script');
    assert.equal(recoveredViaFetch.posts[0].id, 'dia-1-via-fetch');
  });

  await test('6. Respuestas completamente vacías o incompletas NO borran secciones válidas cacheadas', async () => {
    const storage = createMemoryStorage();
    await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: buildFullServerData('base') }),
    });

    // 6a: Respuesta totalmente vacía `{ success: true, data: { dia_a_dia: [], ... } }`
    const emptyServerRes = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({
        success: true,
        data: {
          config: {},
          dia_a_dia: [],
          avisos: [],
          calendario: [],
          horario: [],
          multimedia: [],
          aprendemos: [],
          recursos: [],
        },
      }),
    });

    assert.equal(emptyServerRes.source, 'cache');
    assert.equal(emptyServerRes.fromFallback, true);
    assert.equal(emptyServerRes.posts[0].id, 'dia-1-base');
    assert.equal(emptyServerRes.avisos[0].id, 'av-base');

    // 6b: Respuesta parcial: llega `dia_a_dia` nuevo pero faltan las claves de otras secciones
    const cachedBefore = readCachedSyncResult(storage)!;
    const partialRaw = {
      dia_a_dia: [
        {
          id: 'dia-nuevo',
          fecha: '17/11/2026',
          titulo: 'Nueva entrada',
          contenido: 'Contenido nuevo',
          categoria: 'General',
          estado: 'PUBLICAR',
          orden: 99,
        },
      ],
    };
    const parsedPartial = parseAppsScriptPayload(partialRaw);
    const merged = mergeWithValidCache(parsedPartial, partialRaw, cachedBefore);

    assert.equal(merged.shouldPersist, true);
    assert.equal(merged.result.posts[0].id, 'dia-nuevo');
    assert.equal(merged.result.avisos[0].id, 'av-base', 'Debe conservar avisos del caché ante respuesta incompleta');
    assert.equal(merged.result.schedule?.Lunes.length, 1, 'Debe conservar horario del caché');
    assert.equal(merged.result.multimedia[0].id, 'med-base', 'Debe conservar multimedia del caché');
    assert.equal(merged.result.aprendemos[0].id, 'apr-base', 'Debe conservar aprendemos del caché');
    assert.equal(merged.result.recursos[0].id, 'rec-base', 'Debe conservar recursos del caché');
  });

  await test('7. Recuperación limpia tras error inicial sin caché previo', async () => {
    const storage = createMemoryStorage();

    // Primer intento falla
    const firstAttempt = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => {
        throw new Error('Timeout cold start');
      },
      fetchDirect: async () => {
        throw new Error('Timeout cold start');
      },
    });
    assert.equal(firstAttempt.source, 'error');
    assert.equal(readCachedSyncResult(storage), null);

    // Segundo intento (recuperación automática o manual) obtiene datos reales
    const secondAttempt = await executeSyncWithDeps(false, {
      isConfigured: () => true,
      isOnline: () => true,
      storage,
      fetchJsonp: async () => ({ success: true, data: buildFullServerData('recuperado') }),
    });
    assert.equal(secondAttempt.source, 'apps-script');
    assert.equal(secondAttempt.posts[0].id, 'dia-1-recuperado');
    assert.ok(readCachedSyncResult(storage), 'Debe quedar guardado en caché tras recuperarse');
  });

  console.log(`\nALL INITIAL SYNC & CACHE TESTS PASSED (${passed}/7).`);
}

runTests().catch((err) => {
  console.error('TEST FAILURE:', err);
  process.exit(1);
});
