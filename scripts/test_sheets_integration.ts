import {
  parseCSV,
  parseDiaADiaRows,
  parseAvisosRows,
  parseCalendarioRows,
  parseHorarioRows,
  parseMultimediaRows,
  parseAprendemosRows,
  parseRecursosRows,
  parseAppsScriptPayload,
  parseConfigObject,
  formatSpanishDate,
  formatSpanishTime,
  sanitizeYoutubeEmbedUrl,
  syncAllData,
  SHEETS_DOCUMENT_ID,
} from '../src/services/sheetsService';

console.log('=== TEST DE INTEGRACIÓN PRIVADA CON GOOGLE APPS SCRIPT — EL DIARIO DEL AULA 1.º B ===\n');

// 1. Verificación de documento oficial
console.log('1. Verificando Document ID oficial...');
console.assert(SHEETS_DOCUMENT_ID === '1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1', 'ID incorrecto');
console.log('✓ ID oficial verificado: 1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1.\n');

// 2. Comprobación de comportamiento ante variable no configurada (CERO acceso directo a Sheets, CERO datos ficticios)
console.log('2. Verificando comportamiento de privacidad cuando VITE_APPS_SCRIPT_URL no está configurada...');
async function testPendingConfig() {
  const result = await syncAllData();
  console.assert(result.isPendingConfig === true, 'Debe marcar isPendingConfig: true cuando no hay URL');
  console.assert(result.source === 'pending-config', 'Debe marcar source: pending-config');
  console.assert(result.posts.length === 0, 'No debe cargar posts ficticios');
  console.assert(result.avisos.length === 0, 'No debe cargar avisos ficticios');
  console.assert(result.recursos.length === 0, 'No debe cargar recursos ficticios');
  console.log('✓ Privacidad garantizada: Cero acceso directo a Sheets y cero datos ficticios.\n');
}

// 3. Comprobación de formato de fechas en zona horaria Europe/Madrid
console.log('3. Verificando interpretación de fechas y horas (Europe/Madrid)...');
console.assert(formatSpanishDate('2026-11-18') === '18/11/2026', 'Fallo al parsear AAAA-MM-DD');
console.assert(formatSpanishDate('18/11/2026') === '18/11/2026', 'Fallo al parsear DD/MM/AAAA');
console.assert(formatSpanishDate('04-11-2026') === '04/11/2026', 'Fallo al parsear DD-MM-AAAA');
console.assert(formatSpanishTime('9:00') === '09:00', 'Fallo al formatear 9:00 a 09:00');
console.assert(formatSpanishTime('14:30') === '14:30', 'Fallo al formatear 14:30');
console.log('✓ Fechas en formato DD/MM/AAAA y horas en formato HH:MM verificadas.\n');

// 4. Comprobación estricta de regla PUBLICAR (exclusión de BORRADOR y ARCHIVADO) en DIA_A_DIA
console.log('4. Verificando regla PUBLICAR vs BORRADOR / ARCHIVADO en DIA_A_DIA...');
const sampleDiaADiaCSV = `identificación,fecha,título,contenido,categoria,imagen_url,enlace_url,destacado,estado,orden
1,10/11/2026,Actividad Publicada,Se publica correctamente,Actividad,,https://enlace.com,SI,PUBLICAR,1
2,11/11/2026,Borrador Oculto,Este borrador no debe aparecer,Tarea,,,NO,BORRADOR,2
3,12/11/2026,Archivado Oculto,Este registro archivado no debe aparecer,Aviso,,,NO,ARCHIVADO,3
4,13/11/2026,Segunda Publicada,Debe aparecer segunda,Tarea,,,NO,PUBLICAR,4`;

const parsedDiaADia = parseDiaADiaRows(parseCSV(sampleDiaADiaCSV));
console.assert(parsedDiaADia.length === 2, `Se esperaban 2 registros publicados, se obtuvieron ${parsedDiaADia.length}`);
console.assert(parsedDiaADia[0].titulo === 'Actividad Publicada', 'El primer registro debe ser Actividad Publicada');
console.assert(parsedDiaADia[0].destacado === true, 'El primer registro debe ser destacado');
console.assert(parsedDiaADia[1].titulo === 'Segunda Publicada', 'El segundo registro debe ser Segunda Publicada');
console.assert(parsedDiaADia.every((p) => p.estado === 'PUBLICAR'), 'Todos los registros visibles deben tener estado PUBLICAR');
console.log('✓ Filtrado estricto de PUBLICAR validado en DIA_A_DIA.\n');

// 5. Comprobación de AVISOS con prioridad y fecha_limite
console.log('5. Verificando pestaña AVISOS con prioridad y fecha límite...');
const sampleAvisosCSV = `id,fecha_publicacion,fecha_limite,titulo,mensaje,tipo,prioridad,enlace_url,destacado,estado,orden
av-1,09/11/2026,12/11/2026,Aviso Urgente,Traer abrigo,Urgente,Alta,https://colegio.es,SI,PUBLICAR,1
av-2,08/11/2026,,Aviso Borrador,No mostrar,General,Normal,,NO,BORRADOR,2
av-3,07/11/2026,,Aviso General,Reunión familias,General,Normal,,NO,PUBLICAR,2`;

const parsedAvisos = parseAvisosRows(parseCSV(sampleAvisosCSV));
console.assert(parsedAvisos.length === 2, `Se esperaban 2 avisos publicados, se obtuvieron ${parsedAvisos.length}`);
console.assert(parsedAvisos[0].important === true, 'El aviso urgente debe marcarse como important=true');
console.assert(parsedAvisos[0].fecha_limite === '12/11/2026', 'Fecha límite no preservada');
console.log('✓ Pestaña AVISOS validada con prioridad, destacado y fecha límite.\n');

// 6. Comprobación de CALENDARIO
console.log('6. Verificando pestaña CALENDARIO...');
const sampleCalendarioCSV = `id,fecha_inicio,fecha_fin,hora_inicio,hora_fin,titulo,descripcion,categoria,lugar,destacado,estado,orden
c-1,18/11/2026,,09:30,13:30,Granja Escuela,Salida formativa de otoño,salida,Granja El Alcornocal,SI,PUBLICAR,1
c-2,06/12/2026,08/12/2026,,,Puente Constitución,Días no lectivos,festivo,,NO,PUBLICAR,2
c-3,15/12/2026,,10:00,12:00,Borrador fiesta,No mostrar,evaluacion,,NO,BORRADOR,3`;

const parsedCalendario = parseCalendarioRows(parseCSV(sampleCalendarioCSV));
console.assert(parsedCalendario.length === 2, `Se esperaban 2 eventos, se obtuvieron ${parsedCalendario.length}`);
console.assert(parsedCalendario[0].type === 'salida', 'Categoría salida no identificada');
console.assert(parsedCalendario[0].time === '09:30 - 13:30', 'Horario de evento no formateado');
console.assert(parsedCalendario[1].description.includes('Del 06/12/2026 al 08/12/2026'), 'Rango de fechas no formateado');
console.log('✓ Pestaña CALENDARIO validada con soporte para fechas individuales y rangos.\n');

// 7. Comprobación de HORARIO
console.log('7. Verificando pestaña HORARIO...');
const sampleHorarioCSV = `dia_semana,orden_sesion,hora_inicio,hora_fin,asignatura,observaciones
Lunes,1,9:00,10:00,Lengua Castellana,Aula 1º B
Lunes,2,10:00,11:00,Matemáticas,Aula 1º B
Martes,1,9:00,10:00,Lengua Castellana,Aula 1º B`;

const parsedHorario = parseHorarioRows(parseCSV(sampleHorarioCSV));
console.assert(parsedHorario !== null, 'Horario nulo');
console.assert(parsedHorario!.Lunes.length === 2, 'Lunes debe tener 2 sesiones');
console.assert(parsedHorario!.Martes.length === 1, 'Martes debe tener 1 sesión');
console.assert(parsedHorario!.Lunes[0].time === '09:00 - 10:00', 'Hora de sesión no formateada');
console.log('✓ Pestaña HORARIO validada con asignación temática y orden de sesiones.\n');

// 8. Comprobación de MULTIMEDIA
console.log('8. Verificando pestaña MULTIMEDIA...');
const sampleMultimediaCSV = `id,fecha,titulo,descripcion,tipo,url_media,miniatura_url,actividad_relacionada,estado,orden
m-1,05/11/2026,Mural de Otoño,Hojas del patio,FOTOGRAFIA,https://fotos.com/1.jpg,https://fotos.com/thumb.jpg,Taller Plástica,PUBLICAR,1
m-2,03/11/2026,Vídeo poema fonológico,Rimas y canciones,VIDEO,https://www.youtube.com/watch?v=dQw4w9WgXcQ,,Lengua,PUBLICAR,2
m-3,01/11/2026,Foto Borrador,Oculta,FOTOGRAFIA,https://fotos.com/borrador.jpg,,,BORRADOR,3`;

const parsedMultimedia = parseMultimediaRows(parseCSV(sampleMultimediaCSV));
console.assert(parsedMultimedia.length === 2, `Se esperaban 2 archivos multimedia, se obtuvieron ${parsedMultimedia.length}`);
console.assert(parsedMultimedia[0].tipo === 'FOTOGRAFIA', 'Tipo FOTOGRAFIA no identificado');
console.assert(parsedMultimedia[1].tipo === 'VIDEO', 'Tipo VIDEO no identificado');
console.assert(parsedMultimedia[1].embedUrl?.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'URL embebida privada no generada');
console.log('✓ Pestaña MULTIMEDIA validada con separación estricta de fotos y vídeos seguros.\n');

// 9. Comprobación de APRENDEMOS
console.log('9. Verificando pestaña APRENDEMOS...');
const sampleAprendemosCSV = `id,categoria,titulo,descripcion,tipo_recurso,url_recurso,imagen_url,nivel,estado,orden
ap-1,lectura,Pautas de lectura,"Leer 10 minutos al día
Felicitar el esfuerzo",Guía,https://leer.es,,1.º Primaria,PUBLICAR,1
ap-2,matematicas,Amigos del 10,Sumas manipulativas con regletas,Juego,,,1.º Primaria,PUBLICAR,2
ap-3,escritura,Borrador trazo,No mostrar,Ficha,,,1.º Primaria,BORRADOR,3`;

const parsedAprendemos = parseAprendemosRows(parseCSV(sampleAprendemosCSV));
console.assert(parsedAprendemos.length === 2, `Se esperaban 2 recursos publicados, se obtuvieron ${parsedAprendemos.length}`);
console.assert(parsedAprendemos[0].tips.length === 2, 'Pautas pedagógicas divididas por salto de línea no detectadas');
console.assert(parsedAprendemos[0].category === 'lectura', 'Categoría lectura no asignada');
console.assert(parsedAprendemos[1].category === 'matematicas', 'Categoría matemáticas no asignada');
console.log('✓ Pestaña APRENDEMOS validada con pautas pedagógicas para el hogar.\n');

// 10. Comprobación de RECURSOS (Biblioteca Educativa con exclusividad curricular)
console.log('10. Verificando pestaña RECURSOS (exclusivamente Lengua, Matemáticas y Apoyo Familiar)...');
const sampleRecursosCSV = `id,categoria,titulo,descripcion,tipo_recurso,url_recurso,imagen_url,asignatura,nivel,estado,orden,destacado
rec-1,matematicas,Dominó de sumas hasta 10,Material manipulativo para casa,Ficha PDF,https://recursos.es/domino.pdf,,Matemáticas,1.º Primaria,PUBLICAR,1,SI
rec-2,lengua_lectura,Cuentos rimados de otoño,Lecturas cortas con preguntas,Ficha PDF,https://recursos.es/cuento.pdf,,Lengua Castellana,1.º Primaria,PUBLICAR,2,NO
rec-3,familias,Rutina diaria de lectura,Pautas sencillas de acompañamiento,Orientación,,,Apoyo Familiar,Familias,PUBLICAR,3,SI
rec-4,ciencias,Ficha plantas carnívoras,No es de tutoría de Manuel Herrera,Ficha PDF,https://ciencias.es/plantas.pdf,,Ciencias Naturales,1.º Primaria,PUBLICAR,4,NO
rec-5,matematicas,Borrador matemáticas,Oculto en borrador,Juego,,,Matemáticas,1.º Primaria,BORRADOR,5,NO`;

const parsedRecursos = parseRecursosRows(parseCSV(sampleRecursosCSV));
console.assert(parsedRecursos.length === 3, `Se esperaban 3 recursos (filtrando ciencias y borrador), se obtuvieron ${parsedRecursos.length}`);
console.assert(parsedRecursos[0].categoria === 'matematicas', 'Primer recurso debe ser matemáticas');
console.assert(parsedRecursos[0].destacado === true, 'Primer recurso debe ser destacado');
console.assert(parsedRecursos[1].categoria === 'lengua_lectura', 'Segundo recurso debe ser lengua_lectura');
console.assert(parsedRecursos[2].categoria === 'familias', 'Tercer recurso debe ser familias');
console.assert(parsedRecursos.every((r) => r.estado === 'PUBLICAR'), 'Todos los recursos deben ser PUBLICAR');
console.assert(!parsedRecursos.some((r) => r.titulo.includes('plantas carnívoras')), 'Ciencias Naturales debe ser filtrado');
console.log('✓ Pestaña RECURSOS validada con exclusividad curricular y filtro PUBLICAR.\n');

// 11. Comprobación de parseAppsScriptPayload (Recepción consolidada de Apps Script)
console.log('11. Verificando procesado consolidado del payload de Google Apps Script...');
const mockAppsScriptData = {
  config: { nombre: '1.º de Primaria B', colegio: 'C.E.I.P. Dr. Fleming', tutor: 'Manuel Herrera', clave_privada_admin: 'NO_EXPONER' },
  dia_a_dia: [{ id: 'd1', fecha: '10/11/2026', titulo: 'Actividad Real', contenido: 'Contenido real', categoria: 'Actividad', estado: 'PUBLICAR', orden: 1 }],
  avisos: [{ id: 'a1', fecha_publicacion: '10/11/2026', titulo: 'Aviso Real', mensaje: 'Mensaje real', tipo: 'General', prioridad: 'Normal', estado: 'PUBLICAR', orden: 1 }],
  calendario: [],
  horario: [],
  multimedia: [],
  aprendemos: [],
  recursos: [],
};
const parsedPayload = parseAppsScriptPayload(mockAppsScriptData);
console.assert(parsedPayload.posts.length === 1, 'Debe parsear 1 post del payload');
console.assert(parsedPayload.avisos.length === 1, 'Debe parsear 1 aviso del payload');
console.assert(parsedPayload.config.classTitle === '1.º de Primaria B', 'Debe parsear configuración');
console.log('✓ Procesamiento de carga consolidada de Google Apps Script validado.\n');

// 12. Verificación de lista blanca de claves públicas en CONFIGURACION
console.log('12. Verificando lista blanca de claves públicas en CONFIGURACION...');
const configWithAdminLeaks = {
  nombre: '1.º de Primaria B',
  colegio: 'C.E.I.P. Dr. Fleming',
  admin_pass: 'secreto123',
  token_privado: 'token_secreto_no_filtrar',
  tutor: 'Manuel Herrera',
};
const safeConfig = parseConfigObject(configWithAdminLeaks);
console.assert(safeConfig.classTitle === '1.º de Primaria B', 'Nombre de aula debe preservarse');
console.assert(safeConfig.teacherName === 'Manuel Herrera', 'Nombre de tutor debe preservarse');
console.assert(!('admin_pass' in safeConfig), 'admin_pass no debe existir en config');
console.assert(!('token_privado' in safeConfig), 'token_privado no debe existir en config');
console.log('✓ Filtrado estricto de claves públicas en CONFIGURACION validado.\n');

// 13. Verificación de respuesta vacía (vacía la colección en vez de lanzar error o mantener datos ficticios)
console.log('13. Verificando gestión correcta de respuesta vacía...');
const emptyAppsScriptData = {
  config: {},
  dia_a_dia: [],
  avisos: [],
  calendario: [],
  horario: [],
  multimedia: [],
  aprendemos: [],
  recursos: [],
};
const emptyPayload = parseAppsScriptPayload(emptyAppsScriptData);
console.assert(emptyPayload.posts.length === 0, 'Posts debe quedar vacío');
console.assert(emptyPayload.avisos.length === 0, 'Avisos debe quedar vacío');
console.assert(emptyPayload.recursos.length === 0, 'Recursos debe quedar vacío');
console.log('✓ Vaciado de colecciones ante respuesta vacía validado.\n');

// 14. Verificación de restricciones oficiales y sincronización de Code.gs
console.log('14. Verificando restricciones oficiales de Code.gs...');
import fs from 'fs';
const codeGs = fs.readFileSync('Code.gs', 'utf-8');
const scriptCodeGs = fs.readFileSync('google-apps-script/Code.gs', 'utf-8');

console.assert(codeGs === scriptCodeGs, 'Code.gs y google-apps-script/Code.gs deben ser idénticos');
console.assert(codeGs.includes("var SPREADSHEET_ID = '1NHMMUseFC_FNCXne-PcUt0rgQAv9HFP1';"), 'ID oficial ausente en Code.gs');
console.assert(!codeGs.includes("'drive_folder_url'"), 'drive_folder_url debe estar eliminado de ALLOWED_CONFIG_KEYS');

// Validar columnas de HORARIO
const horarioMatch = codeGs.match(/HORARIO:\s*\[([\s\S]*?)\]/);
console.assert(Boolean(horarioMatch && horarioMatch[1]), 'Cabeceras de HORARIO ausentes');
const horarioCols = (horarioMatch ? horarioMatch[1] : '').replace(/['"\s]/g, '').split(',');
const expectedHorarioCols = ['dia_semana', 'orden_sesion', 'hora_inicio', 'hora_fin', 'asignatura', 'observaciones'];
console.assert(
  JSON.stringify(horarioCols) === JSON.stringify(expectedHorarioCols),
  `HORARIO debe contener exactamente las 6 columnas oficiales. Obtenido: ${JSON.stringify(horarioCols)}`
);

// Validar función de escape JSONP
console.assert(codeGs.includes('escapeJsonpPayload'), 'Función escapeJsonpPayload ausente');
console.assert(codeGs.includes('\\u2028') && codeGs.includes('\\u2029'), 'Escape de U+2028 y U+2029 ausente');
console.assert(codeGs.includes('<\\/script'), 'Escape de script tag ausente');
console.log('✓ Restricciones oficiales de Code.gs y sincronización verificadas.\n');

testPendingConfig().then(() => {
  console.log('================================================================');
  console.log('✓ TODAS LAS 14 PRUEBAS DE INTEGRACIÓN HAN SIDO SUPERADAS');
  console.log('================================================================');
});
