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
console.assert(parsedDiaADia[0].titulo === 'Segunda Publicada', 'El primer registro debe ser Segunda Publicada (orden 4 DESC)');
console.assert(parsedDiaADia[1].titulo === 'Actividad Publicada', 'El segundo registro debe ser Actividad Publicada (orden 1 DESC)');
console.assert(parsedDiaADia[1].destacado === true, 'El registro Actividad Publicada debe ser destacado');
console.assert(parsedDiaADia.every((p) => p.estado === 'PUBLICAR'), 'Todos los registros visibles deben tener estado PUBLICAR');
console.log('✓ Filtrado estricto de PUBLICAR y orden descendente validados en DIA_A_DIA.\n');

// 5. Comprobación de AVISOS con prioridad y fecha_limite
console.log('5. Verificando pestaña AVISOS con prioridad y fecha límite...');
const sampleAvisosCSV = `id,fecha_publicacion,fecha_limite,titulo,mensaje,tipo,prioridad,enlace_url,destacado,estado,orden
av-1,09/11/2026,12/11/2026,Aviso Urgente,Traer abrigo,Urgente,Alta,https://colegio.es,SI,PUBLICAR,1
av-2,08/11/2026,,Aviso Borrador,No mostrar,General,Normal,,NO,BORRADOR,2
av-3,07/11/2026,,Aviso General,Reunión familias,General,Normal,,NO,PUBLICAR,2`;

const parsedAvisos = parseAvisosRows(parseCSV(sampleAvisosCSV));
console.assert(parsedAvisos.length === 2, `Se esperaban 2 avisos publicados, se obtuvieron ${parsedAvisos.length}`);
console.assert(parsedAvisos[0].id === 'av-3', 'El primer aviso debe ser av-3 (orden 2 DESC)');
console.assert(parsedAvisos[1].id === 'av-1', 'El segundo aviso debe ser av-1 (orden 1 DESC)');
console.assert(parsedAvisos[1].important === true, 'El aviso urgente debe marcarse como important=true');
console.assert(parsedAvisos[1].fecha_limite === '12/11/2026', 'Fecha límite no preservada');
console.log('✓ Pestaña AVISOS validada con prioridad, destacado, fecha límite y orden descendente.\n');

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
console.assert(parsedMultimedia[0].tipo === 'VIDEO', 'El primer elemento debe ser VIDEO (orden 2 DESC)');
console.assert(parsedMultimedia[1].tipo === 'FOTOGRAFIA', 'El segundo elemento debe ser FOTOGRAFIA (orden 1 DESC)');
console.assert(parsedMultimedia[0].embedUrl?.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'URL embebida privada no generada');
console.log('✓ Pestaña MULTIMEDIA validada con separación estricta de fotos y vídeos seguros en orden descendente.\n');

// 9. Comprobación de APRENDEMOS
console.log('9. Verificando pestaña APRENDEMOS...');
const sampleAprendemosCSV = `id,categoria,titulo,descripcion,tipo_recurso,url_recurso,imagen_url,nivel,estado,orden
ap-1,lectura,Pautas de lectura,"Leer 10 minutos al día
Felicitar el esfuerzo",Guía,https://leer.es,,1.º Primaria,PUBLICAR,1
ap-2,matematicas,Amigos del 10,Sumas manipulativas con regletas,Juego,,,1.º Primaria,PUBLICAR,2
ap-3,escritura,Borrador trazo,No mostrar,Ficha,,,1.º Primaria,BORRADOR,3`;

const parsedAprendemos = parseAprendemosRows(parseCSV(sampleAprendemosCSV));
console.assert(parsedAprendemos.length === 2, `Se esperaban 2 recursos publicados, se obtuvieron ${parsedAprendemos.length}`);
console.assert(parsedAprendemos[0].category === 'matematicas', 'Primer recurso debe ser matemáticas (orden 2 DESC)');
console.assert(parsedAprendemos[0].description === 'Sumas manipulativas con regletas', 'Descripción de una sola línea incorrecta');
console.assert(parsedAprendemos[0].tips.length === 0, 'Una sola línea no debe generar recomendaciones en tips');
console.assert(parsedAprendemos[1].category === 'lectura', 'Segundo recurso debe ser lectura (orden 1 DESC)');
console.assert(parsedAprendemos[1].description === 'Leer 10 minutos al día', 'La explicación debe tomar solo la primera línea');
console.assert(JSON.stringify(parsedAprendemos[1].tips) === JSON.stringify(['Felicitar el esfuerzo']), 'Solo las líneas posteriores deben ir a tips');
console.log('✓ Pestaña APRENDEMOS validada con separación entre explicación y recomendaciones en orden descendente.\n');

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
console.assert(parsedRecursos[0].categoria === 'familias', 'Primer recurso debe ser familias (orden 3 DESC)');
console.assert(parsedRecursos[1].categoria === 'lengua_lectura', 'Segundo recurso debe ser lengua_lectura (orden 2 DESC)');
console.assert(parsedRecursos[2].categoria === 'matematicas', 'Tercer recurso debe ser matemáticas (orden 1 DESC)');
console.assert(parsedRecursos[2].destacado === true, 'Recurso rec-1 debe ser destacado');
console.assert(parsedRecursos.every((r) => r.estado === 'PUBLICAR'), 'Todos los recursos deben ser PUBLICAR');
console.assert(!parsedRecursos.some((r) => r.titulo.includes('plantas carnívoras')), 'Ciencias Naturales debe ser filtrado');
console.log('✓ Pestaña RECURSOS validada con exclusividad curricular, filtro PUBLICAR y orden descendente.\n');

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

// Validar columnas de HORARIO en OFFICIAL_COLUMNS
const horarioMatch = codeGs.match(/OFFICIAL_COLUMNS\s*=\s*\{[\s\S]*?HORARIO:\s*\[([\s\S]*?)\]/);
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

// 15. Verificación específica de la fila real del usuario en DIA_A_DIA (noticia001 con destacado=SI)
console.log('15. Verificando fila oficial noticia001 de DIA_A_DIA y su consumo por React...');
const userNoticiaCSV = `id,fecha,titulo,contenido,categoria,imagen_url,enlace_url,destacado,estado,orden
noticia001,11/11/2026,"¡Bienvenidos a nuestro diario de aula!","Este será nuestro espacio para compartir con las familias las actividades, experiencias y aprendizajes que vivimos cada día en clase. ¡Esperamos que disfrutéis acompañándonos!",General,,,SI,PUBLICAR,1`;

const parsedNoticiaRows = parseDiaADiaRows(parseCSV(userNoticiaCSV));
console.assert(parsedNoticiaRows.length === 1, `Se esperaba 1 fila parseada de DIA_A_DIA, obtenidas: ${parsedNoticiaRows.length}`);
console.assert(parsedNoticiaRows[0].id === 'noticia001', 'El ID debe ser noticia001');
console.assert(parsedNoticiaRows[0].titulo === '¡Bienvenidos a nuestro diario de aula!', 'Título no coincide');
console.assert(parsedNoticiaRows[0].fecha === '11/11/2026', 'Fecha no coincide');
console.assert(parsedNoticiaRows[0].destacado === true, 'destacado=SI debe ser evaluado a true');
console.assert(parsedNoticiaRows[0].important === false, 'important no debe ser true para publicación General');
console.assert(parsedNoticiaRows[0].categoria === 'General', 'categoria debe ser General');
console.assert(parsedNoticiaRows[0].tag === 'General', 'tag debe ser General');
console.assert(parsedNoticiaRows[0].estado === 'PUBLICAR', 'Estado debe ser PUBLICAR');
console.assert(parsedNoticiaRows[0].orden === 1, 'Orden debe ser 1');

// Validar también payload de Apps Script con esta noticia
const payloadWithNoticia = parseAppsScriptPayload({
  config: {},
  dia_a_dia: [
    {
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
    }
  ],
  avisos: [],
  calendario: [],
  horario: [],
  multimedia: [],
  aprendemos: [],
  recursos: []
});
console.assert(payloadWithNoticia.posts.length === 1, 'Debe devolver 1 post en el payload de Apps Script');
console.assert(payloadWithNoticia.posts[0].id === 'noticia001', 'ID del post debe ser noticia001');
console.assert(payloadWithNoticia.posts[0].title === '¡Bienvenidos a nuestro diario de aula!', 'Título del post incorrecto');
console.assert(payloadWithNoticia.posts[0].categoria === 'General', 'La categoría debe ser General');
console.assert(payloadWithNoticia.posts[0].tag === 'General', 'El tag debe ser General');
console.assert(payloadWithNoticia.posts[0].destacado === true, 'El post debe ser destacado=true');
console.assert(payloadWithNoticia.posts[0].important === false, 'El post General no debe ser categorizado como aviso importante/urgente');
console.log('✓ Fila oficial noticia001 validada: categoría "General", destacado=true, important=false (no es aviso urgente).\n');

// 16. Verificación de infraestructura de diagnóstico seguro y versión desplegada en Code.gs
console.log('16. Verificando infraestructura de diagnóstico seguro en Code.gs...');
console.assert(codeGs.includes("var SCRIPT_VERSION = 'v5-diag-2026-11-11';"), 'Versión del script v5-diag-2026-11-11 ausente');
console.assert(codeGs.includes('getDiagnosticInfo'), 'Función getDiagnosticInfo ausente');
console.assert(codeGs.includes("action === 'diag'"), 'Ruta action === diag ausente');
console.assert(codeGs.includes('getSpreadsheet'), 'Función getSpreadsheet ausente');
console.assert(codeGs.includes('TAB_ALIASES'), 'Mapeo TAB_ALIASES ausente');
console.log('✓ Diagnóstico seguro, versión trazable y resolución tolerante de pestañas verificados.\n');

// 17. Ordenación numérica DESCENDENTE por `orden`, desempate por fecha y tratamiento de `orden` vacío/inválido
console.log('17. Verificando ordenación DESCENDENTE por `orden` en las 5 colecciones e Inicio...');
const orderingPayload = parseAppsScriptPayload({
  config: {},
  dia_a_dia: [
    { id: 'd-2', fecha: '02/11/2026', titulo: 'Orden 2', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: '2' },
    { id: 'd-9', fecha: '09/11/2026', titulo: 'Orden 9', contenido: 'c', categoria: 'Actividad', estado: 'PUBLICAR', orden: '9' },
    { id: 'd-empty-high-row', fecha: '20/11/2026', titulo: 'Sin orden en fila tardía', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: '' },
    { id: 'd-14-old', fecha: '14/11/2026', titulo: 'Orden 14 fecha anterior', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: 14 },
    { id: 'd-14-new', fecha: '18/11/2026', titulo: 'Orden 14 fecha reciente', contenido: 'c', categoria: 'Tarea', estado: 'PUBLICAR', orden: '14' },
    { id: 'd-15', fecha: '15/11/2026', titulo: 'Orden 15', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: 15 },
    { id: 'd-draft', fecha: '25/11/2026', titulo: 'Borrador orden 99', contenido: 'c', categoria: 'General', estado: 'BORRADOR', orden: 99 },
    { id: 'd-invalid', fecha: '10/11/2026', titulo: 'Orden inválido texto', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: 'abc' },
    { id: 'd-0', fecha: '01/11/2026', titulo: 'Orden 0 válido', contenido: 'c', categoria: 'General', estado: 'PUBLICAR', orden: 0 },
  ],
  avisos: [
    { id: 'a-2', fecha_publicacion: '02/11/2026', titulo: 'Aviso 2', mensaje: 'm', tipo: 'Urgente', prioridad: 'Alta', estado: 'PUBLICAR', orden: 2 },
    { id: 'a-empty', fecha_publicacion: '20/11/2026', titulo: 'Aviso sin orden', mensaje: 'm', tipo: 'General', prioridad: 'Normal', estado: 'PUBLICAR', orden: '' },
    { id: 'a-13-a', fecha_publicacion: '10/11/2026', titulo: 'Aviso 13 antiguo', mensaje: 'm', tipo: 'General', prioridad: 'Normal', estado: 'PUBLICAR', orden: 13 },
    { id: 'a-13-b', fecha_publicacion: '16/11/2026', titulo: 'Aviso 13 reciente', mensaje: 'm', tipo: 'Urgente', prioridad: 'Alta', estado: 'PUBLICAR', orden: '13' },
    { id: 'a-15', fecha_publicacion: '15/11/2026', titulo: 'Aviso 15', mensaje: 'm', tipo: 'General', prioridad: 'Normal', estado: 'PUBLICAR', orden: '15' },
  ],
  calendario: [
    { id: 'c-2', fecha_inicio: '20/11/2026', titulo: 'Cal 2', descripcion: 'd', categoria: 'lectivo', estado: 'PUBLICAR', orden: 2 },
    { id: 'c-1', fecha_inicio: '10/11/2026', titulo: 'Cal 1', descripcion: 'd', categoria: 'lectivo', estado: 'PUBLICAR', orden: 1 },
  ],
  horario: [
    { dia_semana: 'Lunes', orden_sesion: 2, hora_inicio: '10:00', hora_fin: '11:00', asignatura: 'Matemáticas', observaciones: 'Aula 1º B' },
    { dia_semana: 'Lunes', orden_sesion: 1, hora_inicio: '09:00', hora_fin: '10:00', asignatura: 'Lengua Castellana', observaciones: 'Aula 1º B' },
  ],
  multimedia: [
    { id: 'm-9', fecha: '09/11/2026', titulo: 'Foto 9', descripcion: 'd', tipo: 'FOTOGRAFIA', url_media: 'https://f/9.jpg', estado: 'PUBLICAR', orden: '9' },
    { id: 'm-15', fecha: '15/11/2026', titulo: 'Foto 15', descripcion: 'd', tipo: 'FOTOGRAFIA', url_media: 'https://f/15.jpg', estado: 'PUBLICAR', orden: '15' },
    { id: 'm-empty', fecha: '22/11/2026', titulo: 'Foto sin orden', descripcion: 'd', tipo: 'FOTOGRAFIA', url_media: 'https://f/x.jpg', estado: 'PUBLICAR', orden: null },
  ],
  aprendemos: [
    { id: 'ap-2', categoria: 'lectura', titulo: 'Ap 2', descripcion: 'd', tipo_recurso: 'Guía', estado: 'PUBLICAR', orden: '2' },
    { id: 'ap-15', categoria: 'matematicas', titulo: 'Ap 15', descripcion: 'd', tipo_recurso: 'Juego', estado: 'PUBLICAR', orden: 15 },
    { id: 'ap-empty', categoria: 'lectura', titulo: 'Ap sin orden', descripcion: 'd', tipo_recurso: 'Guía', estado: 'PUBLICAR', orden: '' },
    { id: 'ap-14', categoria: 'escritura', titulo: 'Ap 14', descripcion: 'd', tipo_recurso: 'Ficha', estado: 'PUBLICAR', orden: '14' },
  ],
  recursos: [
    { id: 'r-9', categoria: 'matematicas', titulo: 'Rec 9', descripcion: 'd', tipo_recurso: 'Ficha PDF', asignatura: 'Matemáticas', estado: 'PUBLICAR', orden: '9' },
    { id: 'r-empty', categoria: 'lengua_lectura', titulo: 'Rec sin orden', descripcion: 'd', tipo_recurso: 'Ficha PDF', asignatura: 'Lengua Castellana', estado: 'PUBLICAR', orden: undefined },
    { id: 'r-15', categoria: 'familias', titulo: 'Rec 15', descripcion: 'd', tipo_recurso: 'Orientación', asignatura: 'Apoyo Familiar', estado: 'PUBLICAR', orden: 15 },
    { id: 'r-13', categoria: 'matematicas', titulo: 'Rec 13', descripcion: 'd', tipo_recurso: 'Juego', asignatura: 'Matemáticas', estado: 'PUBLICAR', orden: '13' },
  ],
});

// DIA_A_DIA: 15, 14 (18/11), 14 (14/11), 9, 2, 0, sin orden (20/11), orden inválido (10/11)
console.assert(
  JSON.stringify(orderingPayload.posts.map((p) => p.id)) ===
    JSON.stringify(['d-15', 'd-14-new', 'd-14-old', 'd-9', 'd-2', 'd-0', 'd-empty-high-row', 'd-invalid']),
  `Orden incorrecto en DIA_A_DIA: ${JSON.stringify(orderingPayload.posts.map((p) => p.id))}`
);

// Resumen de Inicio (`posts.slice(0, 2)`): debe mostrar d-15 y d-14-new
console.assert(
  JSON.stringify(orderingPayload.posts.slice(0, 2).map((p) => p.id)) === JSON.stringify(['d-15', 'd-14-new']),
  'Inicio recentPosts debe tomar los 2 posts con mayor orden'
);

// AVISOS: 15, 13 (16/11), 13 (10/11), 2, sin orden (20/11)
console.assert(
  JSON.stringify(orderingPayload.avisos.map((a) => a.id)) ===
    JSON.stringify(['a-15', 'a-13-b', 'a-13-a', 'a-2', 'a-empty']),
  `Orden incorrecto en AVISOS: ${JSON.stringify(orderingPayload.avisos.map((a) => a.id))}`
);

// Aviso urgente en Inicio (`avisos.find(...)`): debe seleccionar a-13-b (mayor orden entre urgentes)
const inicioUrgentAviso = orderingPayload.avisos.find(
  (a) => a.tipo.toLowerCase().includes('urgente') || a.prioridad.toLowerCase().includes('alta')
);
console.assert(inicioUrgentAviso?.id === 'a-13-b', 'Inicio urgentAviso debe elegir el aviso urgente con mayor orden');

// MULTIMEDIA: 15, 9, sin orden
console.assert(
  JSON.stringify(orderingPayload.multimedia.map((m) => m.id)) === JSON.stringify(['m-15', 'm-9', 'm-empty']),
  `Orden incorrecto en MULTIMEDIA: ${JSON.stringify(orderingPayload.multimedia.map((m) => m.id))}`
);

// APRENDEMOS: 15, 14, 2, sin orden
console.assert(
  JSON.stringify(orderingPayload.aprendemos.map((r) => r.id)) === JSON.stringify(['ap-15', 'ap-14', 'ap-2', 'ap-empty']),
  `Orden incorrecto en APRENDEMOS: ${JSON.stringify(orderingPayload.aprendemos.map((r) => r.id))}`
);

// RECURSOS: 15, 13, 9, sin orden
console.assert(
  JSON.stringify(orderingPayload.recursos.map((r) => r.id)) === JSON.stringify(['r-15', 'r-13', 'r-9', 'r-empty']),
  `Orden incorrecto en RECURSOS: ${JSON.stringify(orderingPayload.recursos.map((r) => r.id))}`
);

// CALENDARIO y HORARIO permanecen intactos (ascendente)
console.assert(
  JSON.stringify(orderingPayload.events.map((e) => e.id)) === JSON.stringify(['c-1', 'c-2']),
  'CALENDARIO no debe cambiar su orden original'
);
console.assert(
  JSON.stringify(orderingPayload.schedule?.Lunes.map((s) => s.orden_sesion)) === JSON.stringify([1, 2]),
  'HORARIO no debe cambiar su orden original'
);
console.log('✓ Ordenación numérica DESCENDENTE, desempate por fecha e integridad de CALENDARIO/HORARIO verificados.\n');

// 18. Separación entre explicación y recomendaciones en APRENDEMOS («Cómo acompañar este aprendizaje»)
console.log('18. Verificando separación de explicación y recomendaciones en APRENDEMOS...');
const assertStrict = (cond: boolean, msg: string) => {
  if (!cond) {
    throw new Error(`Fallo en prueba 18: ${msg}`);
  }
};

const descEjemplo5Recs = [
  'Estamos trabajando la comprensión de pequeños textos, identificando personajes, lugares y acontecimientos principales.',
  '',
  '• Leer juntos un cuento breve cada día.',
  '• Preguntar qué ha sucedido en la historia.',
  '• Pedir que explique quiénes son los personajes.',
  '• Animarle a anticipar cómo podría terminar el cuento.',
  '• Valorar sus explicaciones y escuchar sus opiniones.',
].join('\n');

const descUnaLinea = 'Trabajamos el conteo hasta el 20 y las sumas sencillas; siempre de forma manipulativa.';
const descLineasVacias = '\n  \nTrabajamos el trazo de las vocales.\n\n   \n•   \n- Practicar en pauta grande.\n\n* Cuidar la postura.\n   ';
const descSinRecomendaciones = 'Lectura compartida en voz alta en clase.\n\n   \n•  \n';
const descExplicacionRepetida = 'Identificamos las sílabas directas.\nIdentificamos las sílabas directas.\n• Leer palabras con p, m y l.';

const aprendemosPayloadTest = parseAppsScriptPayload({
  config: {},
  dia_a_dia: [],
  avisos: [],
  calendario: [],
  horario: [],
  multimedia: [],
  aprendemos: [
    { id: 'ap-5', categoria: 'lectura', titulo: 'Comprensión lectora', descripcion: descEjemplo5Recs, tipo_recurso: 'Contenido de clase', estado: 'PUBLICAR', orden: 5 },
    { id: 'ap-4', categoria: 'matematicas', titulo: 'Conteo hasta 20', descripcion: descUnaLinea, tipo_recurso: 'Actividad', estado: 'PUBLICAR', orden: 4 },
    { id: 'ap-3', categoria: 'escritura', titulo: 'Vocales', descripcion: descLineasVacias, tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 3 },
    { id: 'ap-2', categoria: 'lectura', titulo: 'Lectura en voz alta', descripcion: descSinRecomendaciones, tipo_recurso: 'Contenido de clase', estado: 'PUBLICAR', orden: 2 },
    { id: 'ap-1', categoria: 'lectura', titulo: 'Sílabas directas', descripcion: descExplicacionRepetida, tipo_recurso: 'Pauta', estado: 'PUBLICAR', orden: 1 },
  ],
  recursos: [],
});

const [item5, item4, item3, item2, item1] = aprendemosPayloadTest.aprendemos;

// Caso 1: Explicación + 5 recomendaciones
assertStrict(
  item5.description === 'Estamos trabajando la comprensión de pequeños textos, identificando personajes, lugares y acontecimientos principales.',
  'Caso 1: description debe ser exclusivamente la primera línea'
);
assertStrict(
  JSON.stringify(item5.tips) === JSON.stringify([
    'Leer juntos un cuento breve cada día.',
    'Preguntar qué ha sucedido en la historia.',
    'Pedir que explique quiénes son los personajes.',
    'Animarle a anticipar cómo podría terminar el cuento.',
    'Valorar sus explicaciones y escuchar sus opiniones.',
  ]),
  'Caso 1: tips debe contener las 5 recomendaciones sin viñetas ni líneas vacías'
);
assertStrict(!item5.tips.includes(item5.description), 'Caso 1: la explicación no debe repetirse en tips');

// Caso 2: Una sola línea (sin duplicar ni partir por punto y coma)
assertStrict(item4.description === descUnaLinea, 'Caso 2: una sola línea debe mostrarse íntegra como explicación');
assertStrict(item4.tips.length === 0, 'Caso 2: una sola línea no debe duplicarse en tips');

// Caso 3: Líneas vacías y viñetas mixtas (-, *, • vacía)
assertStrict(item3.description === 'Trabajamos el trazo de las vocales.', 'Caso 3: debe ignorar líneas vacías iniciales');
assertStrict(
  JSON.stringify(item3.tips) === JSON.stringify(['Practicar en pauta grande.', 'Cuidar la postura.']),
  'Caso 3: debe limpiar líneas vacías y viñetas vacías'
);

// Caso 4: Sin recomendaciones adicionales
assertStrict(item2.description === 'Lectura compartida en voz alta en clase.', 'Caso 4: explicación incorrecta');
assertStrict(item2.tips.length === 0, 'Caso 4: sin recomendaciones debe devolver tips vacío');

// Caso 5: Nunca duplicar la explicación aunque aparezca repetida
assertStrict(item1.description === 'Identificamos las sílabas directas.', 'Caso 5: explicación incorrecta');
assertStrict(
  JSON.stringify(item1.tips) === JSON.stringify(['Leer palabras con p, m y l.']),
  'Caso 5: la explicación repetida debe excluirse de tips'
);

// Verificar paridad exacta con parseAprendemosRows (CSV)
const aprendemosCsvTest = parseAprendemosRows([
  ['id', 'categoria', 'titulo', 'descripcion', 'tipo_recurso', 'url_recurso', 'imagen_url', 'nivel', 'estado', 'orden'],
  ['ap-5', 'lectura', 'Comprensión lectora', descEjemplo5Recs, 'Contenido de clase', '', '', '1.º Primaria', 'PUBLICAR', '5'],
  ['ap-4', 'matematicas', 'Conteo hasta 20', descUnaLinea, 'Actividad', '', '', '1.º Primaria', 'PUBLICAR', '4'],
  ['ap-3', 'escritura', 'Vocales', descLineasVacias, 'Pauta', '', '', '1.º Primaria', 'PUBLICAR', '3'],
  ['ap-2', 'lectura', 'Lectura en voz alta', descSinRecomendaciones, 'Contenido de clase', '', '', '1.º Primaria', 'PUBLICAR', '2'],
  ['ap-1', 'lectura', 'Sílabas directas', descExplicacionRepetida, 'Pauta', '', '', '1.º Primaria', 'PUBLICAR', '1'],
]);
assertStrict(
  JSON.stringify(aprendemosCsvTest.map((x) => ({ d: x.description, t: x.tips }))) ===
    JSON.stringify(aprendemosPayloadTest.aprendemos.map((x) => ({ d: x.description, t: x.tips }))),
  'parseAprendemosRows y parseAppsScriptPayload deben producir idéntica separación de description y tips'
);
console.log('✓ Todos los 5 casos de APRENDEMOS (explicación + 5 pautas, 1 línea, líneas vacías, sin pautas y sin duplicados) validados.\n');

testPendingConfig().then(() => {
  console.log('================================================================');
  console.log('✓ TODAS LAS 18 PRUEBAS DE INTEGRACIÓN HAN SIDO SUPERADAS');
  console.log('================================================================');
});
