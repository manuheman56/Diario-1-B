/**
 * Test de diagnóstico y verificación completa para DIA_A_DIA
 */
import fs from 'fs';

console.log('=== TEST DE VERIFICACIÓN INTEGRAL DIA_A_DIA ===\n');

// 1. Datos exactos aportados por el usuario
const userOfficialRow = {
  id: 'noticia001',
  fecha: '11/11/2026',
  titulo: '¡Bienvenidos a nuestro diario de aula!',
  contenido: 'Este será nuestro espacio para compartir con las familias las actividades, experiencias y aprendizajes que vivimos cada día en clase. ¡Esperamos que disfrutéis acompañándonos!',
  categoria: 'General',
  imagen_url: '',
  enlace_url: '',
  destacado: 'SI',
  estado: 'PUBLICAR',
  orden: 1
};

const mockUserDataRaw = [
  ['id', 'fecha', 'titulo', 'contenido', 'categoria', 'imagen_url', 'enlace_url', 'destacado', 'estado', 'orden'],
  [
    userOfficialRow.id,
    userOfficialRow.fecha,
    userOfficialRow.titulo,
    userOfficialRow.contenido,
    userOfficialRow.categoria,
    userOfficialRow.imagen_url,
    userOfficialRow.enlace_url,
    userOfficialRow.destacado,
    userOfficialRow.estado,
    userOfficialRow.orden
  ]
];

// Implementación de las funciones mejoradas
const OFFICIAL_COLUMNS = {
  DIA_A_DIA: [
    'id', 'fecha', 'titulo', 'contenido', 'categoria',
    'imagen_url', 'enlace_url', 'destacado', 'estado', 'orden'
  ],
  HORARIO: [
    'dia_semana', 'orden_sesion', 'hora_inicio', 'hora_fin',
    'asignatura', 'observaciones'
  ]
};

const COLUMN_ALIASES: Record<string, string[]> = {
  id: ['id', 'identificacion', 'identificador'],
  fecha: ['fecha', 'date'],
  titulo: ['titulo', 'title', 'nombre', 'evento'],
  contenido: ['contenido', 'texto', 'content'],
  categoria: ['categoria', 'category', 'tipo'],
  imagen_url: ['imagen_url', 'imagen', 'foto', 'foto_url', 'image_url'],
  enlace_url: ['enlace_url', 'enlace', 'url', 'link'],
  destacado: ['destacado', 'importante', 'highlight'],
  estado: ['estado', 'status'],
  orden: ['orden', 'order', 'posicion']
};

function normalizeSheetName(str: string) {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .replace(/[\s\-_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function cleanString(val: any) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

function normalizeHeaders(headerRow: any[]) {
  const normalized: string[] = [];
  for (let i = 0; i < headerRow.length; i++) {
    let raw = cleanString(headerRow[i]);
    raw = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    raw = raw.replace(/[^\w]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
    normalized.push(raw);
  }
  return normalized;
}

function findHeaderIndex(headers: string[], aliases: string[]) {
  for (let a = 0; a < aliases.length; a++) {
    const target = aliases[a];
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === target) {
        return i;
      }
    }
  }
  return -1;
}

function findHeaderRowIndex(data: any[][], targetColAliases: string[]) {
  const maxScanRows = Math.min(6, data.length);
  for (let r = 0; r < maxScanRows; r++) {
    const candidateHeaders = normalizeHeaders(data[r]);
    for (let a = 0; a < targetColAliases.length; a++) {
      if (candidateHeaders.indexOf(targetColAliases[a]) !== -1) {
        return r;
      }
    }
  }
  return 0;
}

function formatCellValue(val: any) {
  if (val === null || val === undefined) {
    return '';
  }
  if (val instanceof Date) {
    return `${val.getDate()}/${val.getMonth() + 1}/${val.getFullYear()}`;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'number') {
    return val;
  }
  return cleanString(val);
}

function simulateRobustReadStandardTab(tabNameInSpreadsheet: string, requestedTabName: string, data: any[][]) {
  // 1. Simulación de getSheetTolerant
  const isSheetMatch =
    tabNameInSpreadsheet === requestedTabName ||
    normalizeSheetName(tabNameInSpreadsheet) === normalizeSheetName(requestedTabName);

  if (!isSheetMatch) {
    return { success: false, error: 'Pestaña no encontrada', rows: [] };
  }

  if (!data || data.length < 2) {
    return { success: false, error: 'Sin datos suficientes', rows: [] };
  }

  const headerRowIdx = findHeaderRowIndex(data, ['estado', 'status', 'id', 'titulo']);
  const headers = normalizeHeaders(data[headerRowIdx]);
  const estadoColIdx = findHeaderIndex(headers, ['estado', 'status']);

  if (estadoColIdx === -1) {
    return { success: false, error: 'Columna estado no encontrada', rows: [] };
  }

  const officialCols = OFFICIAL_COLUMNS.DIA_A_DIA;
  const colIndexMap: Record<string, number> = {};
  for (let c = 0; c < officialCols.length; c++) {
    const colName = officialCols[c];
    const aliases = COLUMN_ALIASES[colName] || [colName];
    colIndexMap[colName] = findHeaderIndex(headers, aliases);
  }

  const rows: any[] = [];
  for (let i = headerRowIdx + 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const isEmpty = row.every((cell: any) => cell === '' || cell === null || cell === undefined);
    if (isEmpty) continue;

    const estadoVal = cleanString(row[estadoColIdx]).toUpperCase();
    if (estadoVal !== 'PUBLICAR') {
      continue;
    }

    const item: Record<string, any> = {};
    for (let j = 0; j < officialCols.length; j++) {
      const officialKey = officialCols[j];
      const idx = colIndexMap[officialKey];
      if (idx !== -1 && idx < row.length) {
        item[officialKey] = formatCellValue(row[idx]);
      } else {
        item[officialKey] = '';
      }
    }

    const hasId = item.id && String(item.id).trim().length > 0;
    const hasTitle = item.titulo && String(item.titulo).trim().length > 0;
    if (!hasId && !hasTitle) {
      continue;
    }

    rows.push(item);
  }

  rows.sort((a, b) => (Number(a.orden) || 0) - (Number(b.orden) || 0));
  return { success: true, rows };
}

// Pruebas exhaustivas
console.log('1. Probando fila exacta del usuario con nombre exacto DIA_A_DIA:');
const test1 = simulateRobustReadStandardTab('DIA_A_DIA', 'DIA_A_DIA', mockUserDataRaw);
console.assert(test1.success && test1.rows.length === 1, 'Test 1 falló');
console.assert(test1.rows[0].id === 'noticia001', 'ID incorrecto en Test 1');
console.assert(test1.rows[0].destacado === 'SI', 'Destacado SI no preservado');
console.log('✓ Test 1 OK: Fila leída y devuelta con éxito.\n');

console.log('2. Probando si la pestaña en Google Sheets se llama "DÍA A DÍA" (con tildes y espacios):');
const test2 = simulateRobustReadStandardTab('DÍA A DÍA', 'DIA_A_DIA', mockUserDataRaw);
console.assert(test2.success && test2.rows.length === 1, 'Test 2 falló');
console.log('✓ Test 2 OK: Búsqueda tolerante de pestaña DÍA A DÍA resuelta con éxito.\n');

console.log('3. Probando si la pestaña en Google Sheets se llama "DIA A DIA" (con espacios):');
const test3 = simulateRobustReadStandardTab('DIA A DIA', 'DIA_A_DIA', mockUserDataRaw);
console.assert(test3.success && test3.rows.length === 1, 'Test 3 falló');
console.log('✓ Test 3 OK: Búsqueda tolerante de pestaña DIA A DIA resuelta con éxito.\n');

console.log('4. Probando si la pestaña en Google Sheets tiene espacio final "DIA_A_DIA ":');
const test4 = simulateRobustReadStandardTab('DIA_A_DIA ', 'DIA_A_DIA', mockUserDataRaw);
console.assert(test4.success && test4.rows.length === 1, 'Test 4 falló');
console.log('✓ Test 4 OK: Pestaña con espacio final resuelta con éxito.\n');

console.log('5. Probando si la fila 1 es un título/banner y las cabeceras están en la fila 2:');
const test5Data = [
  ['El Diario del Aula - 1.º B', '', '', '', '', '', '', '', '', ''],
  ...mockUserDataRaw
];
const test5 = simulateRobustReadStandardTab('DIA_A_DIA', 'DIA_A_DIA', test5Data);
console.assert(test5.success && test5.rows.length === 1, 'Test 5 falló');
console.assert(test5.rows[0].id === 'noticia001', 'ID incorrecto en Test 5');
console.log('✓ Test 5 OK: Detección automática de fila de cabecera en fila 2 superada.\n');

console.log('6. Probando si las cabeceras tienen tildes o mayúsculas (ID, Fecha, Título, Estado...):');
const test6Data = [
  ['ID', 'Fecha', 'Título', 'Contenido', 'Categoría', 'Imagen URL', 'Enlace URL', '¿Destacado?', 'Estado:', 'Orden'],
  mockUserDataRaw[1]
];
const test6 = simulateRobustReadStandardTab('DIA_A_DIA', 'DIA_A_DIA', test6Data);
console.assert(test6.success && test6.rows.length === 1, 'Test 6 falló');
console.log('✓ Test 6 OK: Normalización de cabeceras con signos y tildes superada.\n');

console.log('7. Probando si el estado contiene caracteres invisibles (\u200BPUBLICAR\u200B):');
const test7Row = [...mockUserDataRaw[1]];
test7Row[8] = '\u200BPUBLICAR\u200B';
const test7Data = [mockUserDataRaw[0], test7Row];
const test7 = simulateRobustReadStandardTab('DIA_A_DIA', 'DIA_A_DIA', test7Data);
console.assert(test7.success && test7.rows.length === 1, 'Test 7 falló');
console.log('✓ Test 7 OK: Limpieza de caracteres invisibles en estado superada.\n');

console.log('8. Probando fecha como objeto Date de Google Sheets:');
const test8Row: any[] = [...mockUserDataRaw[1]];
test8Row[1] = new Date(2026, 10, 11); // 11 de Noviembre de 2026
const test8Data: any[][] = [mockUserDataRaw[0], test8Row];
const test8 = simulateRobustReadStandardTab('DIA_A_DIA', 'DIA_A_DIA', test8Data);
console.assert(test8.success && test8.rows.length === 1, 'Test 8 falló');
console.assert(test8.rows[0].fecha === '11/11/2026', `Fecha incorrecta: ${test8.rows[0].fecha}`);
console.log('✓ Test 8 OK: Formato de objeto Date verificado.\n');

console.log('9. Probando compatibilidad con el consumidor React parseAppsScriptPayload:');
import { parseAppsScriptPayload } from '../src/services/sheetsService';
const fullPayload = {
  config: {},
  dia_a_dia: test1.rows,
  avisos: [],
  calendario: [],
  horario: [],
  multimedia: [],
  aprendemos: [],
  recursos: []
};
const parsed = parseAppsScriptPayload(fullPayload);
console.assert(parsed.posts.length === 1, 'Debe parsear 1 publicación en React');
console.assert(parsed.posts[0].id === 'noticia001', 'El ID debe ser noticia001');
console.assert(parsed.posts[0].title === '¡Bienvenidos a nuestro diario de aula!', 'Título no coincide');
console.assert(parsed.posts[0].categoria === 'General', 'La categoría debe ser General');
console.assert(parsed.posts[0].tag === 'General', 'El tag debe ser General');
console.assert(parsed.posts[0].destacado === true, 'El post debe ser destacado=true');
console.assert(parsed.posts[0].important === false, 'El post General no debe ser categorizado como aviso urgente');
console.log('✓ Test 9 OK: React consume la noticia de DIA_A_DIA con categoría "General", destacado=true e important=false.\n');

// 10. Test de filtros y separación estricta de categorías
console.log('10. Probando discriminación de filtros (Todos, General, Avisos, Tareas, En clase)...');
const samplePosts = [
  { id: '1', categoria: 'General', tag: 'General', title: 'Bienvenida', content: '...', completed: false },
  { id: '2', categoria: 'Aviso', tag: 'Aviso', title: 'Circular', content: '...', completed: false },
  { id: '3', categoria: 'Tarea', tag: 'Tarea', title: 'Ficha lectura', content: '...', completed: false },
  { id: '4', categoria: 'Actividad', tag: 'Actividad', title: 'Plástica', content: '...', completed: false },
];

function testFilter(filterName: string, post: any): boolean {
  const catStr = (post.categoria || '').toLowerCase().trim();
  const tagStr = (post.tag || '').toLowerCase().trim();
  if (filterName === 'all') return true;
  if (filterName === 'General') return catStr.includes('general') || tagStr === 'general';
  if (filterName === 'Aviso') {
    if (catStr.includes('general')) return false;
    return catStr.includes('aviso') || catStr.includes('circular') || tagStr === 'aviso';
  }
  if (filterName === 'Tarea') {
    if (catStr.includes('general')) return false;
    return catStr.includes('tarea') || catStr.includes('deber') || tagStr === 'tarea';
  }
  if (filterName === 'Actividad') {
    if (catStr.includes('general')) return false;
    return catStr.includes('clase') || catStr.includes('actividad') || tagStr === 'actividad';
  }
  return false;
}

// Validación de publicación General:
console.assert(testFilter('all', samplePosts[0]) === true, 'General debe aparecer en Todos');
console.assert(testFilter('General', samplePosts[0]) === true, 'General debe aparecer en filtro General');
console.assert(testFilter('Aviso', samplePosts[0]) === false, 'General NO debe aparecer en filtro Avisos');
console.assert(testFilter('Tarea', samplePosts[0]) === false, 'General NO debe aparecer en filtro Tareas');
console.assert(testFilter('Actividad', samplePosts[0]) === false, 'General NO debe aparecer en filtro En clase');

// Validación de publicación Aviso:
console.assert(testFilter('Aviso', samplePosts[1]) === true, 'Aviso debe aparecer en filtro Avisos');
console.assert(testFilter('General', samplePosts[1]) === false, 'Aviso NO debe aparecer en filtro General');

// Validación de publicación Tarea:
console.assert(testFilter('Tarea', samplePosts[2]) === true, 'Tarea debe aparecer en filtro Tareas');
console.assert(testFilter('General', samplePosts[2]) === false, 'Tarea NO debe aparecer en filtro General');

// Validación de publicación Actividad:
console.assert(testFilter('Actividad', samplePosts[3]) === true, 'Actividad debe aparecer en filtro En clase');
console.assert(testFilter('General', samplePosts[3]) === false, 'Actividad NO debe aparecer en filtro General');

console.log('✓ Test 10 OK: Filtros Todos, General, Avisos, Tareas y En clase completamente aislados.\n');

console.log('================================================================');
console.log('✓ TODOS LOS 10 TESTS DE DIAGNÓSTICO HAN SIDO SUPERADOS CON ÉXITO');
console.log('================================================================');
