import { AppConfig, CalendarEvent, DayOfWeek, EducationalResource, PostItem, ScheduleItem } from '../types';
import { SHEETS_CSV_URL } from '../services/sheetsService';

/**
 * Constantes de privacidad para almacenamiento seguro y contenido audiovisual del aula
 */
export const GOOGLE_DRIVE_FOLDER_URL = 'PEGA_AQUÍ_EL_ENLACE_O_ID_DE_TU_CARPETA_ESPECÍFICA_DE_DRIVE';
export const YOUTUBE_AUTHORIZED_VIDEO_OR_PLAYLIST = 'PEGA_AQUÍ_LA_URL_O_ID_AUTORIZADO_DE_YOUTUBE';

export const initialConfig: AppConfig = {
  classTitle: '1º de Primaria B',
  schoolName: 'C.E.I.P. Dr. Fleming',
  teacherName: 'Manuel Herrera',
  driveFolderUrl: GOOGLE_DRIVE_FOLDER_URL,
  youtubeAuthorizedUrl: YOUTUBE_AUTHORIZED_VIDEO_OR_PLAYLIST,
  sheetsUrl: SHEETS_CSV_URL,
};

export const initialPosts: PostItem[] = [
  {
    id: 'post-1',
    title: 'Bienvenida a la app del aula',
    tag: 'Aviso',
    date: '06/11/2026',
    timestamp: Date.now() - 3600000 * 48,
    content: 'Estrenamos el portal digital de 1º B. Aquí podréis consultar las actividades diarias, tareas para casa y avisos importantes de don Manuel Herrera.',
    author: 'Manuel Herrera',
    icon: '📢',
    important: true,
  },
  {
    id: 'post-2',
    title: 'Ficha de comprensión lectora (Tema 3)',
    tag: 'Tarea',
    date: '09/11/2026',
    timestamp: Date.now() - 3600000 * 2,
    content: 'Completar con calma la ficha de comprensión lectora de la lectura del tema 3. Recordar leer el texto dos veces antes de responder a las preguntas.',
    author: 'Manuel Herrera',
    icon: '📝',
    completed: false,
  },
  {
    id: 'post-3',
    title: 'Taller de otoño: estampación con hojas secas',
    tag: 'Actividad',
    date: '05/11/2026',
    timestamp: Date.now() - 3600000 * 72,
    content: 'Hoy hemos realizado un mural colectivo con las hojas que trajisteis de casa. Han aprendido a mezclar tonos marrones, amarillos y ocres trabajando la creatividad en equipo.',
    author: 'Manuel Herrera',
    icon: '🎨',
    imageUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=700&auto=format&fit=crop&q=80',
    completed: false,
  },
];

export const weeklySchedule: Record<DayOfWeek, ScheduleItem[]> = {
  Lunes: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana', loc: 'Aula 1ºB', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Matemáticas', loc: 'Aula 1ºB', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo & Fruta Saludable', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Ciencias de la Naturaleza', loc: 'Laboratorio Infantil', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Carlos Silva' },
    { time: '12:30 - 14:00', subject: 'Educación Plástica y Creatividad', loc: 'Taller de Arte', color: 'border-l-purple-500 bg-purple-50/50 text-purple-900', teacher: 'Marta Vega' }
  ],
  Martes: [
    { time: '09:00 - 10:00', subject: 'Matemáticas (Cálculo y Juegos)', loc: 'Aula 1ºB', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Lengua Extranjera (Inglés)', loc: 'Aula de Idiomas', color: 'border-l-sky-500 bg-sky-50/50 text-sky-900', teacher: 'Sarah Jenkins' },
    { time: '11:00 - 11:30', subject: 'Recreo & Juegos Tradicionales', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Educación Física (¡Zapatillas y agua!)', loc: 'Pabellón Polideportivo', color: 'border-l-rose-500 bg-rose-50/50 text-rose-900', teacher: 'Marcos Peña' },
    { time: '12:30 - 14:00', subject: 'Lengua (Lectura y Caligrafía)', loc: 'Aula 1ºB', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Manuel Herrera' }
  ],
  Miércoles: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana', loc: 'Aula 1ºB', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '10:00 - 11:00', subject: 'Ciencias Sociales (El Barrio y la Familia)', loc: 'Aula 1ºB', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Matemáticas (Resolución de Problemas)', loc: 'Aula 1ºB', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Música y Movimiento', loc: 'Aula de Música', color: 'border-l-purple-500 bg-purple-50/50 text-purple-900', teacher: 'Lucía Benítez' }
  ],
  Jueves: [
    { time: '09:00 - 10:00', subject: 'Lengua Extranjera (Inglés)', loc: 'Aula de Idiomas', color: 'border-l-sky-500 bg-sky-50/50 text-sky-900', teacher: 'Sarah Jenkins' },
    { time: '10:00 - 11:00', subject: 'Educación Física (Psicomotricidad)', loc: 'Pabellón Polideportivo', color: 'border-l-rose-500 bg-rose-50/50 text-rose-900', teacher: 'Marcos Peña' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Matemáticas (Geometría con figuras)', loc: 'Aula 1ºB', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Biblioteca y Cuentacuentos', loc: 'Biblioteca Escolar', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Manuel Herrera' }
  ],
  Viernes: [
    { time: '09:00 - 10:00', subject: 'Ciencias Naturales (Experimentos)', loc: 'Aula 1ºB', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Carlos Silva' },
    { time: '10:00 - 11:00', subject: 'Lengua (Ortografía divertida)', loc: 'Aula 1ºB', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Manuel Herrera' },
    { time: '11:00 - 11:30', subject: 'Recreo y Música en el Patio', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Valores Cívicos / Tutoría Emocional', loc: 'Aula 1ºB', color: 'border-l-cyan-500 bg-cyan-50/50 text-cyan-900', teacher: 'Manuel Herrera' },
    { time: '12:30 - 14:00', subject: 'Asamblea de Clase y Proyectos', loc: 'Aula 1ºB', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Manuel Herrera' }
  ]
};

export const schoolEvents: CalendarEvent[] = [
  {
    id: 'ev-1',
    day: 12,
    month: 10, // Nov (10 in 0-indexed)
    year: 2026,
    title: 'Visita al Museo de Ciencias Naturales',
    description: 'Salida formativa de 09:30 a 13:30 h. Taller interactivo de dinosaurios y ecosistemas.',
    type: 'salida',
    time: '09:30 - 13:30 h'
  },
  {
    id: 'ev-2',
    day: 20,
    month: 10,
    year: 2026,
    title: 'Día Universal del Niño y la Niña',
    description: 'Jornada escolar de convivencia y talleres de derechos de la infancia en el patio.',
    type: 'lectivo',
    time: 'Durante la jornada'
  },
  {
    id: 'ev-3',
    day: 6,
    month: 11, // Dic
    year: 2026,
    title: 'Día de la Constitución Española',
    description: 'Festivo nacional (centro cerrado).',
    type: 'festivo'
  },
  {
    id: 'ev-4',
    day: 8,
    month: 11,
    year: 2026,
    title: 'Día de la Inmaculada Concepción',
    description: 'Festivo nacional (centro cerrado).',
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

export const educationalResources: EducationalResource[] = [
  {
    id: 'rec-1',
    category: 'lectura',
    title: 'Pautas para los 10 minutos de lectura diaria en casa',
    description: 'Consejos pedagógicos para afianzar el hábito lector en 1.º de Primaria de forma lúdica y sin presiones.',
    level: '1.º Primaria',
    badge: 'Lectura',
    tips: [
      'Alternar párrafos: una frase lee el adulto, la siguiente el alumno.',
      'Preguntar qué cree que va a pasar a continuación para estimular la comprensión.',
      'Felicitar el esfuerzo con palabras afectuosas, no corregir bruscamente.'
    ],
    externalUrl: 'https://leer.es',
    externalLabel: 'Portal Educativo Leer.es'
  },
  {
    id: 'rec-2',
    category: 'escritura',
    title: 'Trazo de grafías y caligrafía divertida',
    description: 'Orientaciones sobre la correcta sujeción del lápiz (agarre trípode), postura de la espalda y dirección de las letras.',
    level: '1.º Primaria',
    badge: 'Escritura',
    tips: [
      'Cuidar el agarre en pinza con pulgar e índice, apoyando en el dedo medio.',
      'Trabajar trazos en arena, harina o pizarra antes de pasar a la libreta.',
      'Respetar la separación entre palabras dejando un dedo de distancia.'
    ]
  },
  {
    id: 'rec-3',
    category: 'matematicas',
    title: 'Los amigos del 10 y cálculo mental manipulativo',
    description: 'Estrategias lúdicas para memorizar las parejas de números que suman 10 (1+9, 2+8, 3+7, 4+6, 5+5).',
    level: '1.º Primaria',
    badge: 'Matemáticas',
    tips: [
      'Usar las dos manos como herramienta visual constante.',
      'Juegos con baraja española: sacar una carta y decir qué carta falta para hacer 10.',
      'Contar objetos cotidianos (frutas, cubiertos, pinzas de la ropa).'
    ]
  },
  {
    id: 'rec-4',
    category: 'juegos',
    title: 'Plataformas de juegos educativos interactivos recomendadas',
    description: 'Selección de portales educativos sin publicidad invasiva ni registro con actividades adaptadas a niños de 6 a 7 años.',
    level: '1.º Primaria',
    badge: 'Juegos',
    tips: [
      'Vedoque: Juegos de mecanografía infantil, sumas y cálculo rápido.',
      'Árbol ABC: Canciones y lecturas interactivas de vocales y consonantes.',
      'Límite de tiempo recomendado en pantalla: 20-30 minutos por sesión.'
    ],
    externalUrl: 'https://www.vedoque.com',
    externalLabel: 'Visitar Vedoque Infantil'
  },
  {
    id: 'rec-5',
    category: 'refuerzo',
    title: 'Rutina autónoma de mochila y estuche',
    description: 'Guía visual para que los alumnos y alumnas preparen su material escolar con creciente independencia cada tarde.',
    level: '1.º Primaria',
    badge: 'Autonomía',
    tips: [
      'Revisar juntos el horario del día siguiente antes de cenar.',
      'Comprobar los lápices con punta y la goma en el estuche.',
      'Colocar la botella de agua y el almuerzo saludable en el compartimento exterior.'
    ]
  }
];

export const multimediaAlbums = [
  {
    id: 'alb-1',
    title: 'Taller de Otoño y Hojas Secas',
    date: 'Noviembre 2026',
    count: '34 fotografías',
    coverUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
    tag: 'Manualidades'
  },
  {
    id: 'alb-2',
    title: 'Visita de Educación Vial y Policía Local',
    date: 'Octubre 2026',
    count: '18 fotografías',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
    tag: 'Seguridad'
  },
  {
    id: 'alb-3',
    title: 'Experimento de Ciencias: Germinación de Semillas',
    date: 'Noviembre 2026',
    count: '26 fotografías',
    coverUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    tag: 'Ciencias'
  }
];

export const educationalVideos = [
  {
    id: 'vid-1',
    title: 'Canción didáctica: El ciclo del agua para peques',
    duration: '3:45 min',
    subject: 'Ciencias de la Naturaleza',
    thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'
  },
  {
    id: 'vid-2',
    title: 'Juegos de conteo: La pandilla de las decenas',
    duration: '4:10 min',
    subject: 'Matemáticas divertidas',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80',
    embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1'
  }
];
