import { AppConfig, CalendarEvent, DailyMenu, DayOfWeek, PostItem, ScheduleItem, TutoriaRequest } from '../types';

export const initialConfig: AppConfig = {
  classTitle: '1º Primaria A',
  schoolName: 'CEIP San Juan Bautista',
  teacherName: 'Elena Ramos (Tutora)',
  teacherEmail: 'profesora1a@sanjuan.es',
  schoolPhone: '912 345 678',
  driveUrl: 'https://drive.google.com',
  youtubeUrl: 'https://youtube.com',
  tutoriaScheduleText: 'Martes de 16:00 a 17:30 h (Previa cita)',
  teacherPin: '1234',
  sheetsUrl: ''
};

export const initialPosts: PostItem[] = [
  {
    id: 'post-1',
    title: '¡Iniciamos nuestro rincón de lectura y préstamos!',
    tag: 'Actividad',
    date: 'Hoy, 13:40',
    timestamp: Date.now() - 3600000 * 2,
    content: 'Hoy cada alumno/a ha elegido su primer cuento del trimestre en la biblioteca de aula con su carnet lector. Dedicaremos los primeros 15 minutos de la mañana a la lectura silenciosa. ¡Se llevarán el libro a casa los viernes!',
    author: 'Elena Ramos (Tutora)'
  },
  {
    id: 'post-2',
    title: 'Repaso de matemáticas: decenas, unidades y cálculo mental',
    tag: 'Tarea',
    date: 'Hoy, 11:15',
    timestamp: Date.now() - 3600000 * 5,
    content: 'Realizar las actividades 1 y 2 de la ficha azul del archivador. Recordad repasar con el ábaco en casa si tenéis dudas con la formación de números del 1 al 50.',
    author: 'Elena Ramos (Tutora)',
    completed: false
  },
  {
    id: 'post-3',
    title: 'Autorización y detalles de la excursión al Museo de Ciencias',
    tag: 'Aviso',
    date: '2 Nov 2026',
    timestamp: Date.now() - 86400000 * 2,
    content: 'Por favor, enviad firmado el resguardo de la autorización antes de este viernes para cerrar el listado de transporte escolar. Saldremos a las 9:30 h y regresaremos a las 13:30 h. Llevar agua y almuerzo en mochila pequeña.',
    author: 'Equipo Directivo',
    important: true
  },
  {
    id: 'post-4',
    title: 'Pequeño control de lectoescritura (Sonidos g/j y c/qu)',
    tag: 'Examen',
    date: '31 Oct 2026',
    timestamp: Date.now() - 86400000 * 4,
    content: 'El próximo martes realizaremos un juego de dictado interactivo en pizarra y ficha para comprobar la diferenciación de sonidos. Repasaremos en clase el lunes.',
    author: 'Elena Ramos (Tutora)',
    completed: false
  }
];

export const weeklySchedule: Record<DayOfWeek, ScheduleItem[]> = {
  Lunes: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana', loc: 'Aula 1ºA', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Elena Ramos' },
    { time: '10:00 - 11:00', subject: 'Matemáticas', loc: 'Aula 1ºA', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Elena Ramos' },
    { time: '11:00 - 11:30', subject: 'Recreo & Fruta Saludable', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Ciencias de la Naturaleza', loc: 'Laboratorio Infantil', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Carlos Silva' },
    { time: '12:30 - 14:00', subject: 'Educación Plástica y Creatividad', loc: 'Taller de Arte', color: 'border-l-purple-500 bg-purple-50/50 text-purple-900', teacher: 'Marta Vega' }
  ],
  Martes: [
    { time: '09:00 - 10:00', subject: 'Matemáticas (Cálculo y Juegos)', loc: 'Aula 1ºA', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Elena Ramos' },
    { time: '10:00 - 11:00', subject: 'Lengua Extranjera (Inglés)', loc: 'Aula de Idiomas', color: 'border-l-sky-500 bg-sky-50/50 text-sky-900', teacher: 'Sarah Jenkins' },
    { time: '11:00 - 11:30', subject: 'Recreo & Juegos Tradicionales', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Educación Física (¡Llevar Zapatillas!)', loc: 'Pabellón Polideportivo', color: 'border-l-rose-500 bg-rose-50/50 text-rose-900', teacher: 'Marcos Peña' },
    { time: '12:30 - 14:00', subject: 'Lengua (Lectura y Caligrafía)', loc: 'Aula 1ºA', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Elena Ramos' }
  ],
  Miércoles: [
    { time: '09:00 - 10:00', subject: 'Lengua Castellana', loc: 'Aula 1ºA', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Elena Ramos' },
    { time: '10:00 - 11:00', subject: 'Ciencias Sociales (El Barrio y la Familia)', loc: 'Aula 1ºA', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Elena Ramos' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Matemáticas (Resolución de Problemas)', loc: 'Aula 1ºA', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Elena Ramos' },
    { time: '12:30 - 14:00', subject: 'Música y Movimiento', loc: 'Aula de Música', color: 'border-l-purple-500 bg-purple-50/50 text-purple-900', teacher: 'Lucía Benítez' }
  ],
  Jueves: [
    { time: '09:00 - 10:00', subject: 'Lengua Extranjera (Inglés)', loc: 'Aula de Idiomas', color: 'border-l-sky-500 bg-sky-50/50 text-sky-900', teacher: 'Sarah Jenkins' },
    { time: '10:00 - 11:00', subject: 'Educación Física (Psicomotricidad)', loc: 'Pabellón Polideportivo', color: 'border-l-rose-500 bg-rose-50/50 text-rose-900', teacher: 'Marcos Peña' },
    { time: '11:00 - 11:30', subject: 'Recreo', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Matemáticas (Geometría con figuras)', loc: 'Aula 1ºA', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Elena Ramos' },
    { time: '12:30 - 14:00', subject: 'Biblioteca y Cuentacuentos', loc: 'Biblioteca Escolar', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Elena Ramos' }
  ],
  Viernes: [
    { time: '09:00 - 10:00', subject: 'Ciencias Naturales (Experimentos)', loc: 'Aula 1ºA', color: 'border-l-teal-500 bg-teal-50/50 text-teal-900', teacher: 'Carlos Silva' },
    { time: '10:00 - 11:00', subject: 'Lengua (Ortografía divertida)', loc: 'Aula 1ºA', color: 'border-l-indigo-500 bg-indigo-50/50 text-indigo-900', teacher: 'Elena Ramos' },
    { time: '11:00 - 11:30', subject: 'Recreo y Música en el Patio', loc: 'Patio Principal', color: 'border-l-amber-500 bg-amber-50/50 text-amber-900' },
    { time: '11:30 - 12:30', subject: 'Valores Cívicos / Tutoría Emocional', loc: 'Aula 1ºA', color: 'border-l-cyan-500 bg-cyan-50/50 text-cyan-900', teacher: 'Elena Ramos' },
    { time: '12:30 - 14:00', subject: 'Asamblea de Clase y Proyectos', loc: 'Aula 1ºA', color: 'border-l-emerald-500 bg-emerald-50/50 text-emerald-900', teacher: 'Elena Ramos' }
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
    description: 'Jornada de actividades de convivencia y derechos en el patio.',
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
    title: 'Festival de Invierno y Entrega de Boletines',
    description: 'Actuación navideña del alumnado de 1º y cierre del 1er trimestre escolar.',
    type: 'evaluacion',
    time: '11:00 h'
  }
];

export const weeklyDiningMenu: DailyMenu[] = [
  {
    day: 'Lunes',
    dateStr: 'Semana Actual',
    firstCourse: 'Crema casera de calabacín y puerros con picatostes integrales',
    secondCourse: 'Filete de lubina fresca al horno con patatas panaderas',
    garnish: 'Tomatitos cherry aliñados con orégano',
    dessert: 'Plátano de Canarias ecológico',
    calories: '610 kcal',
    allergens: ['Pescado']
  },
  {
    day: 'Martes',
    dateStr: 'Semana Actual',
    firstCourse: 'Lentejas pardinas estofadas con hortalizas de temporada',
    secondCourse: 'Tortilla española jugosa hecha con huevos camperos',
    garnish: 'Ensalada multicolor de lechuga, zanahoria y maíz',
    dessert: 'Yogur natural con bajo contenido en azúcar',
    calories: '645 kcal',
    allergens: ['Huevo', 'Lácteos']
  },
  {
    day: 'Miércoles',
    dateStr: 'Semana Actual',
    firstCourse: 'Macarrones de trigo duro con salsa de tomate casera y albahaca',
    secondCourse: 'Pechuga de pavo braseada a las finas hierbas',
    garnish: 'Arroz jazmín salteado con guisantes',
    dessert: 'Mandarinas de Valencia dulces',
    calories: '595 kcal',
    allergens: ['Gluten']
  },
  {
    day: 'Jueves',
    dateStr: 'Semana Actual',
    firstCourse: 'Sopa de picadillo con fideos finos y trocitos de pollo',
    secondCourse: 'Varitas de merluza crujientes al horno (no fritas)',
    garnish: 'Puré de patata tradicional con aceite de oliva virgen extra',
    dessert: 'Manzana asada con un toque de canela',
    calories: '580 kcal',
    allergens: ['Pescado', 'Gluten']
  },
  {
    day: 'Viernes',
    dateStr: 'Semana Actual',
    firstCourse: 'Arroz con verduras de la huerta (alcachofas, pimientos y judías)',
    secondCourse: 'Albóndigas de ternera en salsa jardinera',
    garnish: 'Bastoncitos de zanahoria al vapor',
    dessert: 'Pera conferencia de temporada',
    calories: '630 kcal',
    allergens: ['Gluten']
  }
];

export const sampleTutorias: TutoriaRequest[] = [
  {
    id: 'tut-1',
    studentName: 'Lucas Martínez',
    parentName: 'Ana Belén Martínez',
    phone: '611 223 344',
    email: 'anabelen@correo.es',
    preferredSlot: 'Martes 10 Nov - 16:30 h',
    subject: 'Consultar la adaptación a los grupos de lectura y hábitos de estudio.',
    status: 'confirmada',
    createdAt: '3 Nov 2026'
  }
];

export const multimediaAlbums = [
  {
    id: 'alb-1',
    title: 'Taller de Otoño y Hojas Secas',
    date: 'Octubre 2026',
    count: '34 fotografías',
    coverUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=80',
    tag: 'Manualidades'
  },
  {
    id: 'alb-2',
    title: 'Visita de la Policía Local (Educación Vial)',
    date: 'Octubre 2026',
    count: '18 fotografías',
    coverUrl: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?w=600&auto=format&fit=crop&q=80',
    tag: 'Seguridad'
  },
  {
    id: 'alb-3',
    title: 'Experimento: Germinación de Lentejas',
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
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  },
  {
    id: 'vid-2',
    title: 'Juegos de conteo: La pandilla de las decenas',
    duration: '4:10 min',
    subject: 'Matemáticas divertidas',
    thumbnail: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
  }
];
