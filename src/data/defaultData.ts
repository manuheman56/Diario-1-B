import {
  AppConfig,
  AvisoItem,
  CalendarEvent,
  DayOfWeek,
  DiaADiaItem,
  EducationalResource,
  HomeLearningResource,
  MultimediaItem,
  PostItem,
  ScheduleItem,
} from '../types';
import { SPREADSHEET_ID } from '../config/appsScriptConfig';

/**
 * Constantes de privacidad para almacenamiento seguro y contenido audiovisual del aula
 */
export const GOOGLE_DRIVE_FOLDER_URL = 'PEGA_AQUÍ_EL_ENLACE_O_ID_DE_TU_CARPETA_ESPECÍFICA_DE_DRIVE';
export const YOUTUBE_AUTHORIZED_VIDEO_OR_PLAYLIST = 'PEGA_AQUÍ_LA_URL_O_ID_AUTORIZADO_DE_YOUTUBE';

export const initialConfig: AppConfig = {
  classTitle: '1.º de Primaria B',
  schoolName: 'C.E.I.P. Dr. Fleming',
  teacherName: 'Manuel Herrera',
  schoolYear: 'Curso 2026/27',
  welcomeMessage: '¡Bienvenidos al portal de 1.º B! Aquí encontraréis el día a día del aula, avisos escolares y recursos para aprender juntos en familia.',
  timezone: 'Europe/Madrid',
  language: 'es',
  driveFolderUrl: GOOGLE_DRIVE_FOLDER_URL,
  youtubeAuthorizedUrl: YOUTUBE_AUTHORIZED_VIDEO_OR_PLAYLIST,
  sheetsDocumentId: SPREADSHEET_ID,
};

/**
 * DATOS PREDETERMINADOS PARA DESARROLLO LOCAL
 * En producción la aplicación consulta Google Apps Script / Google Sheets.
 * Si no hay datos publicados, se muestran estados vacíos limpios.
 */

export const initialDiaADia: DiaADiaItem[] = [
  {
    id: 'dia-1',
    fecha: '10/11/2026',
    titulo: 'Ficha de comprensión lectora (Tema 3)',
    contenido: 'Completar con calma la ficha de comprensión lectora de la lectura del tema 3 de Lengua Castellana. Recordar leer el texto dos veces antes de responder.',
    categoria: 'Tarea',
    imagen_url: undefined,
    enlace_url: undefined,
    destacado: true,
    estado: 'PUBLICAR',
    orden: 1,
    title: 'Ficha de comprensión lectora (Tema 3)',
    content: 'Completar con calma la ficha de comprensión lectora de la lectura del tema 3 de Lengua Castellana. Recordar leer el texto dos veces antes de responder.',
    tag: 'Tarea',
    date: '10/11/2026',
    timestamp: Date.now() - 3600000 * 2,
    completed: false,
    important: true,
    author: 'Manuel Herrera',
    icon: '📝',
  },
  {
    id: 'dia-2',
    fecha: '09/11/2026',
    titulo: 'Juego de los amigos del 10 en matemáticas',
    contenido: 'Hoy hemos practicado las parejas de números que suman 10 utilizando regletas y manos. Podéis repasar jugando en casa con una baraja de cartas.',
    categoria: 'Actividad',
    imagen_url: undefined,
    enlace_url: undefined,
    destacado: false,
    estado: 'PUBLICAR',
    orden: 2,
    title: 'Juego de los amigos del 10 en matemáticas',
    content: 'Hoy hemos practicado las parejas de números que suman 10 utilizando regletas y manos. Podéis repasar jugando en casa con una baraja de cartas.',
    tag: 'Actividad',
    date: '09/11/2026',
    timestamp: Date.now() - 3600000 * 24,
    author: 'Manuel Herrera',
    icon: '🔢',
  },
];

export const initialPosts: PostItem[] = initialDiaADia;

export const initialAvisos: AvisoItem[] = [
  {
    id: 'aviso-1',
    fecha_publicacion: '10/11/2026',
    fecha_limite: '12/11/2026',
    titulo: 'Entrega de autorizaciones de la salida cultural',
    mensaje: 'Por favor, recordad entregar la autorización firmada a través de la mochila del alumno/a antes del jueves.',
    tipo: 'Urgente',
    prioridad: 'Alta',
    destacado: true,
    estado: 'PUBLICAR',
    orden: 1,
    author: 'Manuel Herrera',
    important: true,
  },
];

/**
 * Horario escolar semanal:
 * Manuel Herrera imparte exclusivamente Lengua Castellana y Matemáticas.
 */
export const weeklySchedule: Record<DayOfWeek, ScheduleItem[]> = {
  Lunes: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Matemáticas (Cálculo manipulativo)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo & Desayuno Saludable', loc: 'Patio Principal', color: 'bg-amber-50/70 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Lengua (Comprensión y Vocabulario)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Educación Artística (Plástica)', loc: 'Aula 1ºB', color: 'bg-purple-50/70 text-purple-900' }
  ],
  Martes: [
    { time: '09:00 - 10:00', subject: 'Matemáticas (Resolución de Problemas)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Lengua (Escritura y Caligrafía)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo & Juegos Tradicionales', loc: 'Patio Principal', color: 'bg-amber-50/70 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Educación Física / Psicomotricidad', loc: 'Pabellón Polideportivo', color: 'bg-rose-50/70 text-rose-900' },
    { time: '12:30 - 14:00', subject: 'Matemáticas (Los amigos del 10)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' }
  ],
  Miércoles: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana (Lectura colectiva)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Matemáticas (Geometría con figuras)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'bg-amber-50/70 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Biblioteca y Animación Lectora', loc: 'Biblioteca Escolar', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Música y Movimiento', loc: 'Aula de Música', color: 'bg-purple-50/70 text-purple-900' }
  ],
  Jueves: [
    { time: '09:00 - 10:00', subject: 'Lengua (Ortografía divertida y rimas)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Educación Física (Juegos motores)', loc: 'Pabellón Polideportivo', color: 'bg-rose-50/70 text-rose-900' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'bg-amber-50/70 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Matemáticas (Series y Conteo hasta 20)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Lengua Castellana (Expresión Oral)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' }
  ],
  Viernes: [
    { time: '09:00 - 10:00', subject: 'Matemáticas (Juegos de cálculo mental)', loc: 'Aula 1ºB', color: 'bg-emerald-50/70 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Lengua (Cuentacuentos y Creatividad)', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'bg-amber-50/70 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Tutoría Emocional y Convivencia', loc: 'Aula 1ºB', color: 'bg-cyan-50/70 text-cyan-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Asamblea de Aula y Repaso Semanal', loc: 'Aula 1ºB', color: 'bg-indigo-50/70 text-indigo-900', teacher: 'Manuel Herrera' }
  ]
};

export const schoolEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    day: 12,
    month: 10, // Nov (10 en base 0)
    year: 2026,
    title: 'Encuentro de Animación Lectora en Biblioteca',
    description: 'Sesión especial de cuentacuentos y taller de ilustración de 09:30 a 11:00 h.',
    type: 'salida',
    time: '09:30 - 11:00 h'
  },
  {
    id: 'ev-2',
    day: 20,
    month: 10,
    year: 2026,
    title: 'Día Universal de los Derechos de la Infancia',
    description: 'Jornada escolar de convivencia y actividades lúdicas en el patio.',
    type: 'lectivo',
    time: 'Durante la jornada'
  },
  {
    id: 'ev-3',
    day: 6,
    month: 11, // Dic
    year: 2026,
    title: 'Día de la Constitución Española',
    description: 'Festivo nacional (colegio cerrado).',
    type: 'festivo'
  },
  {
    id: 'ev-4',
    day: 8,
    month: 11,
    year: 2026,
    title: 'Día de la Inmaculada Concepción',
    description: 'Festivo nacional (colegio cerrado).',
    type: 'festivo'
  },
  {
    id: 'ev-5',
    day: 22,
    month: 11,
    year: 2026,
    title: 'Festival de Invierno y Cierre de Trimestre',
    description: 'Actuación musical de villancicos de 1º B y entrega de informes del primer trimestre.',
    type: 'evaluacion',
    time: '11:00 h'
  }
];

/**
 * 6. Pestaña APRENDEMOS:
 * Exclusivamente Lengua Castellana y Matemáticas de 1.º de Primaria
 */
export const educationalResources: EducationalResource[] = [
  {
    id: 'rec-1',
    category: 'lectura',
    title: 'Pautas para los 10 minutos de lectura diaria en casa',
    description: 'Estrategias pedagógicas para afianzar el hábito lector en 1.º de Primaria de forma lúdica y sin presiones.',
    level: '1.º Primaria',
    badge: 'Lectura',
    tips: [
      'Alternar frases: una lee el adulto con entonación, la siguiente el alumno.',
      'Preguntar qué cree que va a pasar a continuación para estimular la comprensión.',
      'Felicitar siempre el esfuerzo con afecto, evitando correcciones bruscas.'
    ],
    externalUrl: 'https://leer.es',
    externalLabel: 'Portal Educativo Leer.es'
  },
  {
    id: 'rec-2',
    category: 'escritura',
    title: 'Trazo de grafías y caligrafía relajada',
    description: 'Orientaciones sobre la correcta sujeción del lápiz en pinza trípode, postura corporal y dirección de las letras.',
    level: '1.º Primaria',
    badge: 'Escritura',
    tips: [
      'Cuidar el agarre en pinza con pulgar e índice, apoyando en el dedo corazón.',
      'Practicar trazos grandes antes de pasar a la cuadrícula de la libreta.',
      'Respetar la separación entre palabras dejando un dedo de distancia.'
    ]
  },
  {
    id: 'rec-3',
    category: 'matematicas',
    title: 'Los amigos del 10 y cálculo manipulativo',
    description: 'Estrategias lúdicas para interiorizar las parejas de números que suman 10 (1+9, 2+8, 3+7, 4+6, 5+5).',
    level: '1.º Primaria',
    badge: 'Matemáticas',
    tips: [
      'Usar las dos manos como soporte visual y manipulativo constante.',
      'Juegos con baraja: sacar una carta y decir qué carta falta para hacer 10.',
      'Contar objetos cotidianos (frutas, lápices, pinzas de la ropa).'
    ]
  },
  {
    id: 'rec-4',
    category: 'calculo',
    title: 'Resolución de problemas cotidianos de suma y resta',
    description: 'Pautas para comprender el enunciado antes de calcular: dramatizar la situación con objetos reales.',
    level: '1.º Primaria',
    badge: 'Problemas',
    tips: [
      'Identificar primero qué nos preguntan y si vamos a tener más o menos.',
      'Dibujar los datos en un borrador antes de escribir la operación.',
      'Verificar si la solución final tiene sentido en la vida real.'
    ]
  },
  {
    id: 'rec-5',
    category: 'pautas',
    title: 'Rutina autónoma de mochila, estuche y horario escolar',
    description: 'Guía visual para que los alumnos de 1.º preparen su material escolar con creciente independencia.',
    level: '1.º Primaria',
    badge: 'Autonomía',
    tips: [
      'Consultar juntos el horario del día siguiente en esta app antes de cenar.',
      'Comprobar los lápices con punta y la goma en el estuche.',
      'Colocar la botella de agua y el desayuno saludable en el bolsillo exterior.'
    ]
  }
];

export const initialMultimedia: MultimediaItem[] = [
  {
    id: 'media-1',
    fecha: '05/11/2026',
    titulo: 'Mural colectivo de bienvenida de 1.º B',
    descripcion: 'Fotografías del trabajo cooperativo y artístico realizado en el aula durante el inicio del curso.',
    tipo: 'FOTOGRAFIA',
    url_media: '/pwa-512x512.png',
    miniatura_url: '/pwa-512x512.png',
    actividad_relacionada: 'Convivencia Escolar',
    estado: 'PUBLICAR',
    orden: 1,
  },
  {
    id: 'media-2',
    fecha: '03/11/2026',
    titulo: 'Canción didáctica: La pandilla de las decenas',
    descripcion: 'Vídeo educativo utilizado en el aula para reforzar el conteo de 10 en 10 en Matemáticas.',
    tipo: 'VIDEO',
    url_media: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    miniatura_url: '/pwa-512x512.png',
    actividad_relacionada: 'Matemáticas divertidas',
    estado: 'PUBLICAR',
    orden: 2,
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1',
  },
];

/**
 * 7. Pestaña RECURSOS (Biblioteca Educativa para Casa):
 * Exclusivamente Lengua Castellana, Matemáticas y Apoyo Familiar.
 * Totalmente administrable desde Google Sheets (Pestaña RECURSOS).
 */
export const initialHomeResources: HomeLearningResource[] = [
  // 1. Matemáticas
  {
    id: 'rec-mat-1',
    titulo: 'Los Amigos del 10 y parejas de números',
    descripcion: 'Juego interactivo y tarjetas visuales para dominar las combinaciones que suman 10 de forma ágil y natural.',
    categoria: 'matematicas',
    asignatura: 'Matemáticas',
    tipo_recurso: 'Juego interactivo',
    nivel: '1.º Primaria',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '10-15 min',
    url_recurso: 'https://vedoque.com/juegos/juego.php?j=amigos-del-10',
    estado: 'PUBLICAR',
    orden: 1,
  },
  {
    id: 'rec-mat-2',
    titulo: 'Retos de razonamiento lógico con regletas de colores',
    descripcion: 'Problemas matemáticos ilustrados con objetos de la vida cotidiana para iniciarse en la deducción lógica sin miedo al error.',
    categoria: 'matematicas',
    asignatura: 'Matemáticas',
    tipo_recurso: 'Guía de actividades',
    nivel: '1.º Primaria',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '15 min',
    url_recurso: 'https://www.matematicasdivertidas.com/ZonaJuegos/juegosmatematicas.html',
    estado: 'PUBLICAR',
    orden: 2,
  },
  {
    id: 'rec-mat-3',
    titulo: 'Dominó de sumas y cálculo mental rápido hasta el 20',
    descripcion: 'Tarjetas descargables para practicar el conteo, las decenas y el cálculo ágil en partidas de 10 minutos.',
    categoria: 'matematicas',
    asignatura: 'Matemáticas',
    tipo_recurso: 'Juego de mesa imprimible',
    nivel: 'Refuerzo lúdico',
    destacado: false,
    destacado_casa: false,
    tiempo_estimado: '10 min',
    estado: 'PUBLICAR',
    orden: 3,
  },

  // 2. Lengua y lectura
  {
    id: 'rec-len-1',
    titulo: 'Biblioteca de mini-cuentos con pictogramas',
    descripcion: 'Relatos breves con letra ligada y apoyos visuales para estimular la lectura autónoma y la fluidez expresiva.',
    categoria: 'lengua_lectura',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'Lectura guiada',
    nivel: '1.º Primaria',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '10 min diarios',
    url_recurso: 'https://leer.es/recursos/primaria',
    estado: 'PUBLICAR',
    orden: 4,
  },
  {
    id: 'rec-len-2',
    titulo: 'Ruleta de rimas, sílabas y sonidos trabados',
    descripcion: 'Tarjetas fonológicas para diferenciar sonidos próximos (b/d, p/q, m/n) a través de juegos de palabras cantadas.',
    categoria: 'lengua_lectura',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'Juego fonológico',
    nivel: '1.º Primaria',
    destacado: false,
    destacado_casa: false,
    tiempo_estimado: '10 min',
    url_recurso: 'https://arbolabc.com/juegos-de-vocales-y-consonantes',
    estado: 'PUBLICAR',
    orden: 5,
  },
  {
    id: 'rec-len-3',
    titulo: 'Lecturas breves ilustradas: Comprensión paso a paso',
    descripcion: 'Textos cortos con tres preguntas de opción múltiple para consolidar la atención lectora en casa.',
    categoria: 'lengua_lectura',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'Lectura comprensiva',
    nivel: '1.º Primaria',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '10 min',
    estado: 'PUBLICAR',
    orden: 6,
  },

  // 3. Escritura y caligrafía
  {
    id: 'rec-esc-1',
    titulo: 'Taller de caligrafía y trazo relajado en cuadrícula',
    descripcion: 'Pautas ergonómicas para sujetar el lápiz en pinza trípode, evitar tensiones en la muñeca y lograr un trazo seguro.',
    categoria: 'escritura',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'Ficha práctica',
    nivel: 'Refuerzo caligrafía',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '15 min',
    url_recurso: 'https://www.edufichas.com/grafomotricidad/',
    estado: 'PUBLICAR',
    orden: 7,
  },
  {
    id: 'rec-esc-2',
    titulo: 'Plantilla de pauta suave con guías de cielo y tierra',
    descripcion: 'Hojas en formato PDF optimizadas para imprimir en casa con referencias visuales claras para la dirección de las letras.',
    categoria: 'escritura',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'Plantilla descargable',
    nivel: 'Refuerzo',
    destacado: false,
    destacado_casa: false,
    tiempo_estimado: 'Plantilla',
    estado: 'PUBLICAR',
    orden: 8,
  },

  // 4. Fichas y cuadernillos de repaso
  {
    id: 'rec-fich-1',
    titulo: 'Cuadernillo imprimible de repaso semanal (PDF)',
    descripcion: 'Fichas limpias en blanco y negro de lectura, grafía y cálculo hasta el 20 para imprimir cuando se necesite refuerzo.',
    categoria: 'fichas',
    asignatura: 'Lengua Castellana',
    tipo_recurso: 'PDF descargable',
    nivel: '1.º Primaria',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: 'Descarga libre',
    url_recurso: 'https://www.actiludis.com/fichas-primero-primaria',
    estado: 'PUBLICAR',
    orden: 9,
  },
  {
    id: 'rec-fich-2',
    titulo: 'Cuadernillo de problemas matemáticos visuales (PDF)',
    descripcion: 'Colección de 6 problemas ilustrados de sumas y restas cotidianas sin llevadas para practicar en familia.',
    categoria: 'fichas',
    asignatura: 'Matemáticas',
    tipo_recurso: 'PDF descargable',
    nivel: '1.º Primaria',
    destacado: false,
    destacado_casa: false,
    tiempo_estimado: '15 min',
    estado: 'PUBLICAR',
    orden: 10,
  },

  // 5. Orientaciones para las familias
  {
    id: 'rec-fam-1',
    titulo: 'Crear una rutina tranquila de 15 minutos de estudio',
    descripcion: 'Pautas sobre cómo preparar un rincón despejado, la importancia de anticipar el horario y cómo evitar distracciones con pantallas.',
    categoria: 'familias',
    asignatura: 'Apoyo Familiar',
    tipo_recurso: 'Guía pedagógica',
    nivel: 'Para Familias',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: '5 min de lectura',
    estado: 'PUBLICAR',
    orden: 11,
  },
  {
    id: 'rec-fam-2',
    titulo: 'El decálogo de los 10 minutos de lectura compartida',
    descripcion: 'Consejos para leer en voz alta con vuestros hijos: cómo modular la voz, cuándo turnarse y cómo elogiar el progreso sin exigir perfección.',
    categoria: 'familias',
    asignatura: 'Apoyo Familiar',
    tipo_recurso: 'Guía familiar',
    nivel: 'Para Familias',
    destacado: true,
    destacado_casa: true,
    tiempo_estimado: 'Lectura familiar',
    url_recurso: 'https://leer.es/familias',
    estado: 'PUBLICAR',
    orden: 12,
  },
  {
    id: 'rec-fam-3',
    titulo: 'El valor positivo del error en los primeros aprendizajes',
    descripcion: 'Reflexión pedagógica de don Manuel Herrera sobre cómo acompañar los tropiezos escolares reforzando la autoestima y la curiosidad.',
    categoria: 'familias',
    asignatura: 'Apoyo Familiar',
    tipo_recurso: 'Artículo pedagógico',
    nivel: 'Para Familias',
    destacado: false,
    destacado_casa: false,
    tiempo_estimado: '4 min de lectura',
    estado: 'PUBLICAR',
    orden: 13,
  },
];
