/**
 * ============================================================================
 * EL DIARIO DEL AULA — 1.º B | C.E.I.P. Dr. Fleming
 * Intermediario Seguro de Solo Lectura en Google Apps Script
 * ============================================================================
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
 * - Limitación ESTRICTA de columnas devueltas: Solo las cabeceras oficiales.
 * - Filtro ESTRICTO de estado: Solo se devuelven filas con estado exactamente "PUBLICAR".
 * - "BORRADOR" y "ARCHIVADO" nunca salen del servidor de Google.
 * - CONFIGURACION filtra una lista cerrada de claves públicas (sin drive_folder_url).
 * - HORARIO devuelve exclusivamente: dia_semana, orden_sesion, hora_inicio, hora_fin, asignatura y observaciones.
 * - Fechas y horas formateadas en zona horaria escolar 'Europe/Madrid'.
 * - Salida en JSON o JSONP con escape de caracteres especiales y validación de callback.
 * ============================================================================
 */

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
    var action = String(e.parameter.action || '').trim().toLowerCase();
    var sheetParam = String(e.parameter.sheet || e.parameter.collection || '').trim().toUpperCase();
    var callback = String(e.parameter.callback || '').trim();

    // 1. OPERACIÓN: ping (comprueba disponibilidad sin exponer datos)
    if (action === 'ping') {
      return createResponse({
        success: true,
        status: 'ok',
        app: 'El Diario del Aula - 1.º B',
        timestamp: new Date().toISOString()
      }, callback);
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    if (!ss) {
      return createResponse({
        success: false,
        error: 'No se pudo acceder a la hoja de cálculo del aula.'
      }, callback);
    }

    // 2. OPERACIÓN: get (consulta de una colección individual permitida)
    if (action === 'get' || sheetParam) {
      if (!sheetParam) {
        return createResponse({
          success: false,
          error: 'Parámetro de colección no especificado.'
        }, callback);
      }

      // Verificación estricta contra la lista cerrada de 8 pestañas
      if (ALLOWED_TABS.indexOf(sheetParam) === -1) {
        return createResponse({
          success: false,
          error: 'Colección no autorizada.'
        }, callback);
      }

      var singleData = readAuthorizedTab(ss, sheetParam);
      return createResponse({
        success: true,
        collection: sheetParam,
        timestamp: new Date().toISOString(),
        data: singleData
      }, callback);
    }

    // 3. OPERACIÓN: all (por defecto: devuelve todas las colecciones autorizadas)
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
      timestamp: new Date().toISOString(),
      data: allData
    }, callback);

  } catch (err) {
    return createResponse({
      success: false,
      error: 'Error interno en el servicio escolar.'
    }, callback);
  }
}

/**
 * Bloqueo explícito de operaciones de escritura (POST)
 */
function doPost(e) {
  return createResponse({
    success: false,
    error: 'Operación no permitida. Este servicio es estrictamente de solo lectura.'
  }, '');
}

/**
 * Lector de la pestaña CONFIGURACION con lista blanca cerrada de claves públicas.
 * Excluye explícitamente cualquier dato privado o sensible (como drive_folder_url).
 */
function readConfigTab(ss) {
  var sheet = ss.getSheetByName('CONFIGURACION');
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return {};

  var config = {};
  for (var i = 1; i < data.length; i++) {
    var key = String(data[i][0] || '').trim().toLowerCase();
    var val = data[i][1];

    // Solo se entregan las claves estrictamente públicas
    if (key && ALLOWED_CONFIG_KEYS.indexOf(key) !== -1) {
      config[key] = (val === null || val === undefined) ? '' : String(val).trim();
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
  var sheet = ss.getSheetByName('HORARIO');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headers = normalizeHeaders(data[0]);
  var estadoColIdx = findHeaderIndex(headers, ['estado', 'status']);

  var officialCols = OFFICIAL_COLUMNS.HORARIO;
  var colIndexMap = {};
  for (var c = 0; c < officialCols.length; c++) {
    var colName = officialCols[c];
    var aliases = COLUMN_ALIASES[colName] || [colName];
    colIndexMap[colName] = findHeaderIndex(headers, aliases);
  }

  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isEmpty = row.every(function(cell) { return cell === '' || cell === null; });
    if (isEmpty) continue;

    // Si la hoja tuviese columna estado, solo admitir PUBLICAR
    if (estadoColIdx !== -1) {
      var estadoVal = String(row[estadoColIdx] || '').trim().toUpperCase();
      if (estadoVal && estadoVal !== 'PUBLICAR') {
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
 * y filtrado estricto a registros exactamente con valor "PUBLICAR".
 * Devuelve objetos que contienen ÚNICAMENTE las cabeceras oficiales del proyecto.
 */
function readStandardTab(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  if (!data || data.length < 2) return [];

  var headers = normalizeHeaders(data[0]);
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

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var isEmpty = row.every(function(cell) { return cell === '' || cell === null; });
    if (isEmpty) continue;

    // FILTRO ESTRICTO: Solo registros con estado exactamente igual a "PUBLICAR"
    var estadoVal = String(row[estadoColIdx] || '').trim().toUpperCase();
    if (estadoVal !== 'PUBLICAR') {
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
 * Normaliza cabeceras (minúsculas, sin tildes, con guiones bajos)
 */
function normalizeHeaders(headerRow) {
  var normalized = [];
  for (var i = 0; i < headerRow.length; i++) {
    var raw = String(headerRow[i] || '').trim().toLowerCase();
    raw = raw.replace(/[áàäâ]/g, 'a')
             .replace(/[éèëê]/g, 'e')
             .replace(/[íìïî]/g, 'i')
             .replace(/[óòöô]/g, 'o')
             .replace(/[úùüû]/g, 'u')
             .replace(/[ñ]/g, 'n')
             .replace(/[\s\-_]+/g, '_');
    normalized.push(raw);
  }
  return normalized;
}

/**
 * Localiza índice de cabecera por lista de alias
 */
function findHeaderIndex(headers, aliases) {
  for (var i = 0; i < headers.length; i++) {
    for (var a = 0; a < aliases.length; a++) {
      if (headers[i] === aliases[a]) {
        return i;
      }
    }
  }
  return -1;
}

/**
 * Formateo seguro de valores en celdas (Europe/Madrid)
 */
function formatCellValue(val) {
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    var hours = val.getHours();
    var mins = val.getMinutes();
    var secs = val.getSeconds();
    if (hours === 0 && mins === 0 && secs === 0) {
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
  return String(val).trim();
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
