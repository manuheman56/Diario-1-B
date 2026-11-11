/**
 * ============================================================================
 * EL DIARIO DEL AULA — 1.º B | C.E.I.P. Dr. Fleming
 * Intermediario Seguro de Solo Lectura en Google Apps Script
 * ============================================================================
 * Versión de diagnóstico seguro: v5-diag-2026-11-11
 * Tutor: Manuel Herrera
 * ID Hoja de Cálculo: 1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1
 *
 * ARQUITECTURA DE PRIVACIDAD Y SEGURIDAD:
 * - La hoja de cálculo es 100% PRIVADA para el tutor.
 * - Las familias NUNCA acceden a Google Sheets ni necesitan cuenta de Google.
 * - Este script se ejecuta con los permisos del PROPIETARIO ("Execute as: Me").
 * - Quién tiene acceso: "Cualquier persona" ("Anyone, even anonymous").
 * - ESTRICTAMENTE DE SOLO LECTURA: Se bloquea cualquier petición POST o mutación.
 * - Lista CERRADA de 8 pestañas autorizadas (rechaza cualquier otra hoja).
 * - Búsqueda tolerante de pestañas y alias: Resuelve DIA_A_DIA, DÍA A DÍA, Diario, etc.
 * - Detección automática de fila de cabeceras: Soporta hojas con fila 1 vacía o título.
 * - Diagnóstico seguro integrado (?action=diag): Reporta nombres reales de pestañas,
 *   cabeceras y conteos SIN exponer datos personales ni contenido de filas.
 * - Limitación ESTRICTA de columnas devueltas: Solo las cabeceras oficiales.
 * - Filtro ESTRICTO de estado: Solo se devuelven filas con estado "PUBLICAR" / "PUBLICADO".
 * - "BORRADOR" y "ARCHIVADO" nunca salen del servidor de Google.
 * - CONFIGURACION filtra una lista cerrada de claves públicas (sin drive_folder_url).
 * - HORARIO devuelve exclusivamente: dia_semana, orden_sesion, hora_inicio, hora_fin, asignatura y observaciones.
 * - Fechas y horas formateadas en zona horaria escolar 'Europe/Madrid'.
 * - Salida en JSON o JSONP con escape de caracteres especiales y validación de callback.
 * ============================================================================
 */

// Versión del script para verificar en producción que el despliegue está actualizado
var SCRIPT_VERSION = 'v5-diag-2026-11-11';

// Identificador oficial de la hoja de cálculo del aula
var SPREADSHEET_ID = '1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1';

// Zona horaria oficial del centro educativo
var TIMEZONE = 'Europe/Madrid';

// Lista cerrada de 8 pestañas permitidas para consulta pública
var ALLOWED_TABS = [
  'CONFIGURACION',
  'DIA_A_DIA',
  'AVISOS',
  'CALENDARIO',
  'HORARIO',
  'MULTIMEDIA',
  'APRENDEMOS',
  'RECURSOS'
];

// Alias y nombres comunes de pestañas físicas en Google Sheets
var TAB_ALIASES = {
  DIA_A_DIA: [
    'dia_a_dia',
    'dia a dia',
    'diario',
    'diario_de_aula',
    'diario de aula',
    'noticias',
    'publicaciones',
    'dia_a_dia_1b',
    'dia_a_dia_1_b',
    'dia a dia 1b',
    'dia a dia 1º b',
    'dia a dia 1.º b',
    'dia'
  ],
  CONFIGURACION: [
    'configuracion',
    'config',
    'ajustes',
    'datos_generales'
  ],
  AVISOS: [
    'avisos',
    'notificaciones',
    'circulares',
    'aviso'
  ],
  CALENDARIO: [
    'calendario',
    'eventos',
    'agenda'
  ],
  HORARIO: [
    'horario',
    'sesiones',
    'tiempo'
  ],
  MULTIMEDIA: [
    'multimedia',
    'fotos',
    'videos',
    'fotografias'
  ],
  APRENDEMOS: [
    'aprendemos',
    'en_clase',
    'actividades_aula'
  ],
  RECURSOS: [
    'recursos',
    'biblioteca',
    'materiales'
  ]
};

// Lista cerrada de claves públicas autorizadas de CONFIGURACION (sin drive_folder_url)
var ALLOWED_CONFIG_KEYS = [
  'nombre',
  'titulo_app',
  'grupo',
  'clase',
  'colegio',
  'centro',
  'tutor',
  'curso_escolar',
  'mensaje_bienvenida',
  'zona_horaria',
  'idioma',
  'youtube_url'
];

// Cabeceras oficiales estrictas para cada pestaña del proyecto
var OFFICIAL_COLUMNS = {
  DIA_A_DIA: [
    'id', 'fecha', 'titulo', 'contenido', 'categoria',
    'imagen_url', 'enlace_url', 'destacado', 'estado', 'orden'
  ],
  AVISOS: [
    'id', 'fecha_publicacion', 'fecha_limite', 'titulo', 'mensaje',
    'tipo', 'prioridad', 'enlace_url', 'destacado', 'estado', 'orden'
  ],
  CALENDARIO: [
    'id', 'fecha_inicio', 'fecha_fin', 'hora_inicio', 'hora_fin',
    'titulo', 'descripcion', 'categoria', 'lugar', 'destacado', 'estado', 'orden'
  ],
  HORARIO: [
    'dia_semana', 'orden_sesion', 'hora_inicio', 'hora_fin',
    'asignatura', 'observaciones'
  ],
  MULTIMEDIA: [
    'id', 'fecha', 'titulo', 'descripcion', 'tipo',
    'url_media', 'miniatura_url', 'actividad_relacionada', 'estado', 'orden'
  ],
  APRENDEMOS: [
    'id', 'categoria', 'titulo', 'descripcion', 'tipo_recurso',
    'url_recurso', 'imagen_url', 'nivel', 'estado', 'orden'
  ],
  RECURSOS: [
    'id', 'categoria', 'titulo', 'descripcion', 'tipo_recurso',
    'url_recurso', 'imagen_url', 'asignatura', 'nivel', 'estado', 'orden', 'destacado'
  ]
};

// Alias tolerantes para mapear variaciones de cabecera a su nombre oficial
var COLUMN_ALIASES = {
  id: ['id', 'identificacion', 'identificador'],
  fecha: ['fecha', 'date'],
  fecha_publicacion: ['fecha_publicacion', 'fecha_pub', 'fecha'],
  fecha_limite: ['fecha_limite', 'limite'],
  fecha_inicio: ['fecha_inicio', 'inicio'],
  fecha_fin: ['fecha_fin', 'fin'],
  hora_inicio: ['hora_inicio', 'inicio_hora', 'h_inicio'],
  hora_fin: ['hora_fin', 'fin_hora', 'h_fin'],
  titulo: ['titulo', 'title', 'nombre', 'evento'],
  contenido: ['contenido', 'texto', 'content'],
  mensaje: ['mensaje', 'contenido', 'texto'],
  descripcion: ['descripcion', 'desc', 'detalle'],
  categoria: ['categoria', 'category', 'tipo'],
  tipo: ['tipo', 'type'],
  tipo_recurso: ['tipo_recurso', 'tipo', 'formato'],
  prioridad: ['prioridad', 'priority'],
  imagen_url: ['imagen_url', 'imagen', 'foto', 'foto_url', 'image_url'],
  enlace_url: ['enlace_url', 'enlace', 'url', 'link'],
  url_recurso: ['url_recurso', 'enlace_url', 'enlace', 'url', 'link'],
  url_media: ['url_media', 'url', 'media_url', 'enlace_media', 'video_url', 'foto_url'],
  miniatura_url: ['miniatura_url', 'miniatura', 'thumbnail', 'thumb_url'],
  actividad_relacionada: ['actividad_relacionada', 'actividad', 'relacionada'],
  asignatura: ['asignatura', 'materia', 'subject'],
  nivel: ['nivel', 'curso', 'level'],
  lugar: ['lugar', 'ubicacion', 'aula'],
  observaciones: ['observaciones', 'observacion', 'aula', 'obs', 'notas'],
  dia_semana: ['dia_semana', 'dia', 'day'],
  orden_sesion: ['orden_sesion', 'orden', 'sesion'],
  destacado: ['destacado', 'importante', 'highlight'],
  estado: ['estado', 'status'],
  orden: ['orden', 'order', 'posicion']
};

/**
 * Punto de entrada HTTP GET
 */
function doGet(e) {
  try {
    e = e || { parameter: {} };
    var action = cleanString(e.parameter.action).toLowerCase();
    var sheetParam = cleanString(e.parameter.sheet || e.parameter.collection).toUpperCase();
    var callback = cleanString(e.parameter.callback);

    // 1. OPERACIÓN: ping (comprueba disponibilidad y versión desplegada)
    if (action === 'ping') {
      return createResponse({
        success: true,
        status: 'ok',
        version: SCRIPT_VERSION,
        app: 'El Diario del Aula - 1.º B',
        timestamp: new Date().toISOString()
      }, callback);
    }

    var ss = getSpreadsheet();
    if (!ss) {
      return createResponse({
        success: false,
        version: SCRIPT_VERSION,
        error: 'No se pudo acceder a la hoja de cálculo del aula.'
      }, callback);
    }

    // 2. OPERACIÓN: diag (diagnóstico seguro de estructura y DIA_A_DIA sin exponer datos personales)
    if (action === 'diag' || action === 'diagnostico') {
      return createResponse({
        success: true,
        status: 'ok',
        action: 'diag',
        version: SCRIPT_VERSION,
        timestamp: new Date().toISOString(),
        diag: getDiagnosticInfo(ss)
      }, callback);
    }

    // 3. OPERACIÓN: get (consulta de una colección individual permitida)
    if (action === 'get' || sheetParam) {
      if (!sheetParam) {
        return createResponse({
          success: false,
          version: SCRIPT_VERSION,
          error: 'Parámetro de colección no especificado.'
        }, callback);
      }

      var matchedTab = findAllowedTab(sheetParam);
      if (!matchedTab) {
        return createResponse({
          success: false,
          version: SCRIPT_VERSION,
          error: 'Colección no autorizada.'
        }, callback);
      }

      var singleData = readAuthorizedTab(ss, matchedTab);
      return createResponse({
        success: true,
        version: SCRIPT_VERSION,
        collection: matchedTab,
        timestamp: new Date().toISOString(),
        data: singleData
      }, callback);
    }

    // 4. OPERACIÓN: all (por defecto: devuelve todas las 8 colecciones autorizadas + diagnóstico de verificación)
    var allData = {
      config: readConfigTab(ss),
      dia_a_dia: readStandardTab(ss, 'DIA_A_DIA'),
      avisos: readStandardTab(ss, 'AVISOS'),
      calendario: readStandardTab(ss, 'CALENDARIO'),
      horario: readHorarioTab(ss),
      multimedia: readStandardTab(ss, 'MULTIMEDIA'),
      aprendemos: readStandardTab(ss, 'APRENDEMOS'),
      recursos: readStandardTab(ss, 'RECURSOS')
    };

    return createResponse({
      success: true,
      version: SCRIPT_VERSION,
      timestamp: new Date().toISOString(),
      diag: getDiagnosticInfo(ss),
      data: allData
    }, callback);

  } catch (err) {
    return createResponse({
      success: false,
      version: SCRIPT_VERSION,
      error: 'Error interno en el servicio escolar: ' + String(err && err.message ? err.message : err)
    }, callback);
  }
}

/**
 * Bloqueo explícito de operaciones de escritura (POST)
 */
function doPost(e) {
  return createResponse({
    success: false,
    version: SCRIPT_VERSION,
    error: 'Operación no permitida. Este servicio es estrictamente de solo lectura.'
  }, '');
}

/**
 * Obtiene la hoja de cálculo:
 * 1. Prioriza getActiveSpreadsheet() si el script está vinculado como contenedor (Extensiones > Apps Script).
 * 2. Si es independiente, recurre a openById(SPREADSHEET_ID).
 */
function getSpreadsheet() {
  var ss = null;
  try {
    if (typeof SpreadsheetApp.getActiveSpreadsheet === 'function') {
      ss = SpreadsheetApp.getActiveSpreadsheet();
      if (ss) return ss;
    }
  } catch (e1) {}

  try {
    ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (ss) return ss;
  } catch (e2) {}

  return null;
}

/**
 * Genera un diagnóstico estructural seguro:
 * - Informa de los nombres físicos reales de las pestañas encontradas
 * - Informa de la fila de cabeceras detectada y los nombres de columnas
 * - Informa del número de filas totales y las que tienen estado PUBLICAR
 * - NO incluye ningún dato personal, títulos de noticias ni contenido sensible
 */
function getDiagnosticInfo(ss) {
  var diag = {
    version: SCRIPT_VERSION,
    spreadsheet_id: SPREADSHEET_ID,
    spreadsheet_name: '',
    spreadsheet_timezone: '',
    sheets_found: [],
    dia_a_dia: {
      found: false,
      matched_sheet_name: null,
      total_rows: 0,
      total_cols: 0,
      header_row: null,
      headers: [],
      estado_col_index: -1,
      id_col_index: -1,
      titulo_col_index: -1,
      total_data_rows: 0,
      unique_estados_found: [],
      count_publicar: 0,
      rows_returned_count: 0
    }
  };

  if (!ss) {
    diag.error = 'No se pudo abrir la hoja de cálculo.';
    return diag;
  }

  try {
    diag.spreadsheet_name = ss.getName();
    diag.spreadsheet_timezone = ss.getSpreadsheetTimeZone();

    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      var s = sheets[i];
      diag.sheets_found.push({
        index: i,
        name: s.getName(),
        rows: s.getLastRow(),
        cols: s.getLastColumn()
      });
    }

    var diaSheet = getSheetTolerant(ss, 'DIA_A_DIA');
    if (diaSheet) {
      diag.dia_a_dia.found = true;
      diag.dia_a_dia.matched_sheet_name = diaSheet.getName();
      diag.dia_a_dia.total_rows = diaSheet.getLastRow();
      diag.dia_a_dia.total_cols = diaSheet.getLastColumn();

      var data = diaSheet.getDataRange().getValues();
      if (data && data.length > 0) {
        var headerRowIdx = findHeaderRowIndex(data, ['estado', 'status', 'id', 'titulo']);
        diag.dia_a_dia.header_row = headerRowIdx + 1; // 1-indexed

        var headers = normalizeHeaders(data[headerRowIdx]);
        diag.dia_a_dia.headers = headers;

        var estadoColIdx = findHeaderIndex(headers, ['estado', 'status']);
        diag.dia_a_dia.estado_col_index = estadoColIdx;
        diag.dia_a_dia.id_col_index = findHeaderIndex(headers, ['id', 'identificacion']);
        diag.dia_a_dia.titulo_col_index = findHeaderIndex(headers, ['titulo', 'title']);

        var estadosMap = {};
        var countPub = 0;
        var countReturned = 0;

        for (var r = headerRowIdx + 1; r < data.length; r++) {
          var row = data[r];
          if (!row || row.length === 0) continue;
          var isEmpty = row.every(function(cell) { return cell === '' || cell === null || cell === undefined; });
          if (isEmpty) continue;

          var estadoVal = estadoColIdx !== -1 ? cleanString(row[estadoColIdx]).toUpperCase() : '';
          estadosMap[estadoVal] = true;
          if (estadoVal === 'PUBLICAR' || estadoVal === 'PUBLICADO') {
            countPub++;
            // Validar si tiene contenido mínimo id o titulo
            var idVal = diag.dia_a_dia.id_col_index !== -1 ? cleanString(row[diag.dia_a_dia.id_col_index]) : '';
            var tituloVal = diag.dia_a_dia.titulo_col_index !== -1 ? cleanString(row[diag.dia_a_dia.titulo_col_index]) : '';
            if (idVal || tituloVal) {
              countReturned++;
            }
          }
        }

        diag.dia_a_dia.total_data_rows = Math.max(0, data.length - (headerRowIdx + 1));
        diag.dia_a_dia.unique_estados_found = Object.keys(estadosMap);
        diag.dia_a_dia.count_publicar = countPub;
        diag.dia_a_dia.rows_returned_count = countReturned;
      }
    }
  } catch (err) {
    diag.error = String(err && err.message ? err.message : err);
  }

  return diag;
}

/**
 * Localiza la hoja en la hoja de cálculo de forma tolerante a:
 * 1. Coincidencia exacta (ej. "DIA_A_DIA")
 * 2. Normalización del nombre (sin tildes, minúsculas, guiones por espacios)
 * 3. Lista de alias habituales (ej. "Diario", "Diario de Aula", "Día a Día 1º B")
 */
function getSheetTolerant(ss, sheetName) {
  if (!ss) return null;

  // 1. Búsqueda exacta directa
  var sheet = ss.getSheetByName(sheetName);
  if (sheet) return sheet;

  // 2. Búsqueda normalizada directa
  var targetNorm = normalizeSheetName(sheetName);
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var cur = sheets[i];
    if (normalizeSheetName(cur.getName()) === targetNorm) {
      return cur;
    }
  }

  // 3. Búsqueda mediante lista de alias de la pestaña
  var aliases = TAB_ALIASES[sheetName] || [];
  for (var a = 0; a < aliases.length; a++) {
    var aliasNorm = normalizeSheetName(aliases[a]);
    for (var j = 0; j < sheets.length; j++) {
      if (normalizeSheetName(sheets[j].getName()) === aliasNorm) {
        return sheets[j];
      }
    }
  }

  return null;
}

/**
 * Normaliza nombres de hojas y pestañas para comparación segura
 */
function normalizeSheetName(str) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
    .toLowerCase()
    .replace(/[\s\-_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Comprueba si un parámetro corresponde a una de las 8 pestañas autorizadas
 */
function findAllowedTab(param) {
  var normParam = normalizeSheetName(param);
  for (var i = 0; i < ALLOWED_TABS.length; i++) {
    var tabKey = ALLOWED_TABS[i];
    if (normalizeSheetName(tabKey) === normParam) {
      return tabKey;
    }
    var aliases = TAB_ALIASES[tabKey] || [];
    for (var a = 0; a < aliases.length; a++) {
      if (normalizeSheetName(aliases[a]) === normParam) {
        return tabKey;
      }
    }
  }
  return null;
}

/**
 * Localiza automáticamente la fila que contiene las cabeceras reales.
 * Examina las primeras 6 filas por si el usuario incluyó títulos o filas vacías al inicio.
 */
function findHeaderRowIndex(data, targetColAliases) {
  var maxScanRows = Math.min(6, data.length);
  for (var r = 0; r < maxScanRows; r++) {
    var candidateHeaders = normalizeHeaders(data[r]);
    for (var a = 0; a < targetColAliases.length; a++) {
      if (candidateHeaders.indexOf(targetColAliases[a]) !== -1) {
        return r;
      }
    }
  }
  return 0;
}

/**
 * Lector de la pestaña CONFIGURACION con lista blanca cerrada de claves públicas.
 * Excluye explícitamente cualquier dato privado o sensible (como drive_folder_url).
 */
function readConfigTab(ss) {
  var sheet = getSheetTolerant(ss, 'CONFIGURACION');
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return {};

  var headerRowIdx = findHeaderRowIndex(data, ['clave', 'key', 'parametro']);
  var config = {};
  for (var i = headerRowIdx + 1; i < data.length; i++) {
    var key = cleanString(data[i][0]).toLowerCase();
    var val = data[i][1];

    // Solo se entregan las claves estrictamente públicas
    if (key && ALLOWED_CONFIG_KEYS.indexOf(key) !== -1) {
      config[key] = (val === null || val === undefined) ? '' : cleanString(val);
    }
  }
  return config;
}

/**
 * Lector de la pestaña HORARIO.
 * Devuelve EXCLUSIVAMENTE las 6 propiedades oficiales solicitadas:
 * dia_semana, orden_sesion, hora_inicio, hora_fin, asignatura y observaciones.
 */
function readHorarioTab(ss) {
  var sheet = getSheetTolerant(ss, 'HORARIO');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headerRowIdx = findHeaderRowIndex(data, ['dia_semana', 'asignatura', 'hora_inicio', 'dia']);
  var headers = normalizeHeaders(data[headerRowIdx]);
  var estadoColIdx = findHeaderIndex(headers, ['estado', 'status']);

  var officialCols = OFFICIAL_COLUMNS.HORARIO;
  var colIndexMap = {};
  for (var c = 0; c < officialCols.length; c++) {
    var colName = officialCols[c];
    var aliases = COLUMN_ALIASES[colName] || [colName];
    colIndexMap[colName] = findHeaderIndex(headers, aliases);
  }

  var rows = [];

  for (var i = headerRowIdx + 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length === 0) continue;
    var isEmpty = row.every(function(cell) { return cell === '' || cell === null || cell === undefined; });
    if (isEmpty) continue;

    // Si la hoja tuviese columna estado, solo admitir PUBLICAR
    if (estadoColIdx !== -1) {
      var estadoVal = cleanString(row[estadoColIdx]).toUpperCase();
      if (estadoVal && estadoVal !== 'PUBLICAR' && estadoVal !== 'PUBLICADO') {
        continue;
      }
    }

    // Construir el objeto estrictamente con las 6 columnas oficiales
    var item = {};
    for (var j = 0; j < officialCols.length; j++) {
      var officialKey = officialCols[j];
      var idx = colIndexMap[officialKey];
      if (idx !== -1 && idx < row.length) {
        item[officialKey] = formatCellValue(row[idx]);
      } else {
        item[officialKey] = '';
      }
    }

    // Validar que tenga día de semana y asignatura válidos
    if (item.dia_semana && item.asignatura) {
      rows.push(item);
    }
  }

  rows.sort(function(a, b) {
    var ordA = Number(a.orden_sesion) || 0;
    var ordB = Number(b.orden_sesion) || 0;
    return ordA - ordB;
  });

  return rows;
}

/**
 * Lector de pestañas estándar con EXIGENCIA OBLIGATORIA de columna "estado"
 * y filtrado estricto a registros exactamente con valor "PUBLICAR" o "PUBLICADO".
 * Devuelve objetos que contienen ÚNICAMENTE las cabeceras oficiales del proyecto.
 */
function readStandardTab(ss, sheetName) {
  var sheet = getSheetTolerant(ss, sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  // Localizar la fila real de cabeceras (por si existen filas iniciales de título o vacías)
  var headerRowIdx = findHeaderRowIndex(data, ['estado', 'status', 'id', 'titulo']);
  var headers = normalizeHeaders(data[headerRowIdx]);
  var estadoColIdx = findHeaderIndex(headers, ['estado', 'status']);

  // EXIGENCIA DE SEGURIDAD: La columna estado es obligatoria en estas pestañas
  if (estadoColIdx === -1) {
    return [];
  }

  var officialCols = OFFICIAL_COLUMNS[sheetName] || [];
  var colIndexMap = {};
  for (var c = 0; c < officialCols.length; c++) {
    var colName = officialCols[c];
    var aliases = COLUMN_ALIASES[colName] || [colName];
    colIndexMap[colName] = findHeaderIndex(headers, aliases);
  }

  var rows = [];

  for (var i = headerRowIdx + 1; i < data.length; i++) {
    var row = data[i];
    if (!row || row.length === 0) continue;
    var isEmpty = row.every(function(cell) { return cell === '' || cell === null || cell === undefined; });
    if (isEmpty) continue;

    // FILTRO ESTRICTO: Solo registros con estado PUBLICAR o PUBLICADO
    var estadoVal = cleanString(row[estadoColIdx]).toUpperCase();
    if (estadoVal !== 'PUBLICAR' && estadoVal !== 'PUBLICADO') {
      continue; // Excluye BORRADOR, ARCHIVADO o celdas vacías
    }

    // Construir el objeto ÚNICAMENTE con las columnas oficiales
    var item = {};
    for (var j = 0; j < officialCols.length; j++) {
      var officialKey = officialCols[j];
      var idx = colIndexMap[officialKey];
      if (idx !== -1 && idx < row.length) {
        item[officialKey] = formatCellValue(row[idx]);
      } else {
        item[officialKey] = '';
      }
    }

    // Validación de registro con contenido mínimo
    var hasId = item.id && String(item.id).trim().length > 0;
    var hasTitle = item.titulo && String(item.titulo).trim().length > 0;
    if (!hasId && !hasTitle) {
      continue;
    }

    rows.push(item);
  }

  // Ordenar por 'orden' si existe en las columnas oficiales
  rows.sort(function(a, b) {
    var ordA = Number(a.orden) || 0;
    var ordB = Number(b.orden) || 0;
    return ordA - ordB;
  });

  return rows;
}

/**
 * Enruta la lectura de una pestaña autorizada
 */
function readAuthorizedTab(ss, tabName) {
  if (tabName === 'CONFIGURACION') {
    return readConfigTab(ss);
  }
  if (tabName === 'HORARIO') {
    return readHorarioTab(ss);
  }
  return readStandardTab(ss, tabName);
}

/**
 * Normaliza cabeceras (minúsculas, sin tildes, sin caracteres invisibles, con guiones bajos)
 */
function normalizeHeaders(headerRow) {
  var normalized = [];
  for (var i = 0; i < headerRow.length; i++) {
    var raw = cleanString(headerRow[i]);
    raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    raw = raw.replace(/[^\w]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    normalized.push(raw);
  }
  return normalized;
}

/**
 * Localiza índice de cabecera priorizando alias oficiales exactos
 */
function findHeaderIndex(headers, aliases) {
  for (var a = 0; a < aliases.length; a++) {
    var target = aliases[a];
    for (var i = 0; i < headers.length; i++) {
      if (headers[i] === target) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Limpieza de espacios en blanco y caracteres unicode invisibles (BOM, zero-width, non-breaking space)
 */
function cleanString(val) {
  if (val === null || val === undefined) {
    return '';
  }
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, ' ')
    .trim();
}

/**
 * Formateo seguro de valores en celdas (Europe/Madrid)
 */
function formatCellValue(val) {
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    var timeFormatted = Utilities.formatDate(val, TIMEZONE, 'HH:mm:ss');
    if (timeFormatted === '00:00:00') {
      return Utilities.formatDate(val, TIMEZONE, 'dd/MM/yyyy');
    } else {
      return Utilities.formatDate(val, TIMEZONE, 'dd/MM/yyyy HH:mm');
    }
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'number') {
    return val;
  }
  return cleanString(val);
}

/**
 * Escapa caracteres problemáticos para JSONP:
 * - U+2028 (LINE SEPARATOR) y U+2029 (PARAGRAPH SEPARATOR) que causan SyntaxError en JavaScript
 * - Secuencias </script y <!-- para prevenir roturas de contexto HTML/script
 */
function escapeJsonpPayload(jsonString) {
  return jsonString
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--');
}

/**
 * Genera la respuesta HTTP en JSON o JSONP validado y escapado
 */
function createResponse(dataObj, callback) {
  var jsonString = JSON.stringify(dataObj);

  // Validación estricta del identificador de callback JSONP (previene inyección)
  if (callback && isValidCallback(callback)) {
    var safeJson = escapeJsonpPayload(jsonString);
    var output = callback + '(' + safeJson + ');';
    return ContentService.createTextOutput(output)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  // Respuesta JSON estándar
  return ContentService.createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Validador de callback: solo identificadores válidos en JavaScript
 */
function isValidCallback(cb) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(cb);
}
