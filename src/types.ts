export type PostCategory = 'General' | 'Aviso' | 'Tarea' | 'Actividad' | 'Urgente' | 'Proyecto' | string;

export type PublicacionEstado = 'PUBLICAR' | 'BORRADOR' | 'ARCHIVADO';

/**
 * 1. Pestaña DIA_A_DIA:
 * id | fecha | titulo | contenido | categoria | imagen_url | enlace_url | destacado | estado | orden
 */
export interface DiaADiaItem {
  id: string;
  fecha: string; // Formato DD/MM/AAAA
  titulo: string;
  contenido: string;
  categoria: string;
  imagen_url?: string;
  enlace_url?: string;
  destacado: boolean; // "SI" / "NO"
  estado: PublicacionEstado;
  orden: number;
  // Campos adaptados para componentes visuales
  title: string;
  content: string;
  tag: PostCategory;
  date: string;
  timestamp: number;
  completed?: boolean; // Checklist interactivo local de tareas en el hogar
  important?: boolean;
  author: string;
  imageUrl?: string;
  icon?: string;
}

// Alias de retrocompatibilidad
export type Notice = DiaADiaItem;
export type PostItem = DiaADiaItem;

/**
 * 2. Pestaña AVISOS:
 * id | fecha_publicacion | fecha_limite | titulo | mensaje | tipo | prioridad | enlace_url | destacado | estado | orden
 */
export interface AvisoItem {
  id: string;
  fecha_publicacion: string; // DD/MM/AAAA
  fecha_limite?: string;
  titulo: string;
  mensaje: string;
  tipo: string; // "General", "Urgente", "Circular", etc.
  prioridad: string; // "Alta", "Normal", "Baja", "Urgente"
  enlace_url?: string;
  destacado: boolean;
  estado: PublicacionEstado;
  orden: number;
  // Adaptado para vistas
  author: string;
  important: boolean;
}

/**
 * 3. Pestaña CALENDARIO:
 * id | fecha_inicio | fecha_fin | hora_inicio | hora_fin | titulo | descripcion | categoria | lugar | destacado | estado | orden
 */
export interface CalendarEvent {
  id: string;
  fecha_inicio?: string; // DD/MM/AAAA
  fecha_fin?: string;
  hora_inicio?: string; // HH:MM
  hora_fin?: string; // HH:MM
  titulo?: string;
  descripcion?: string;
  categoria?: 'lectivo' | 'salida' | 'festivo' | 'evaluacion' | 'reunion' | string;
  lugar?: string;
  destacado?: boolean;
  estado?: PublicacionEstado;
  orden?: number;
  // Campos para compatibilidad con el calendario mensual
  day: number;
  month: number; // 0-indexed (10 es Noviembre)
  year: number;
  title: string;
  description: string;
  type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion';
  time?: string;
}

/**
 * 4. Pestaña HORARIO:
 * dia_semana | orden_sesion | hora_inicio | hora_fin | asignatura | observaciones
 */
export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface ScheduleItem {
  dia_semana?: DayOfWeek;
  orden_sesion?: number;
  hora_inicio?: string;
  hora_fin?: string;
  asignatura?: string;
  observaciones?: string;
  // Campos visuales adaptados
  time: string;
  subject: string;
  loc: string;
  teacher?: string;
  color: string;
  iconName?: string;
}

export interface TimetableDay {
  day: DayOfWeek;
  items: ScheduleItem[];
}

/**
 * 5. Pestaña MULTIMEDIA:
 * id | fecha | titulo | descripcion | tipo | url_media | miniatura_url | actividad_relacionada | estado | orden
 */
export interface MultimediaItem {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  tipo: 'FOTOGRAFIA' | 'VIDEO';
  url_media: string;
  miniatura_url?: string;
  actividad_relacionada?: string;
  estado: PublicacionEstado;
  orden: number;
  embedUrl?: string; // Para incrustar vídeos de forma segura
}

/**
 * 6. Pestaña APRENDEMOS (Qué trabajamos en clase):
 * Exclusivamente Lengua Castellana y Matemáticas de 1.º de Primaria
 * id | categoria | titulo | descripcion | tipo_recurso | url_recurso | imagen_url | nivel | estado | orden
 */
export interface EducationalResource {
  id: string;
  categoria?: 'lengua' | 'matematicas' | 'lectura' | 'escritura' | 'calculo' | 'pautas' | string;
  titulo?: string;
  descripcion?: string;
  tipo_recurso?: string; // "Contenido de clase", "Lectura colectiva", "Pauta del aula", "Actividad manipulativa"
  url_recurso?: string;
  imagen_url?: string;
  nivel?: string; // "1.º Primaria"
  estado?: PublicacionEstado;
  orden?: number;
  // Campos adaptados para vista
  category: 'lengua' | 'matematicas' | 'lectura' | 'escritura' | 'calculo' | 'pautas';
  title: string;
  description: string;
  level: string;
  tips: string[];
  externalUrl?: string;
  externalLabel?: string;
  badge: string;
}

/**
 * 7. Pestaña RECURSOS (Biblioteca educativa para practicar y reforzar en casa):
 * id | categoria | titulo | descripcion | tipo_recurso | url_recurso | imagen_url | asignatura | nivel | estado | orden | destacado
 * Curriculares: Exclusivamente Lengua Castellana y Matemáticas (+ Apoyo Familiar)
 */
export type HomeResourceCategory =
  | 'matematicas'
  | 'lengua_lectura'
  | 'escritura'
  | 'fichas'
  | 'familias'
  | string;

export interface HomeLearningResource {
  id: string;
  categoria: HomeResourceCategory;
  titulo: string;
  descripcion: string;
  tipo_recurso: string; // "Juego interactivo", "Ficha PDF", "Lectura guiada", "Cuadernillo", "Pauta familiar"
  url_recurso?: string;
  imagen_url?: string;
  asignatura?: 'Lengua Castellana' | 'Matemáticas' | 'Apoyo Familiar' | string;
  nivel: string; // "1.º Primaria", "Refuerzo", "Familias"
  estado: PublicacionEstado;
  orden: number;
  destacado?: boolean;
  destacado_casa?: boolean;
  tiempo_estimado?: string;
}

/**
 * Carga consolidada devuelta por Google Apps Script
 */
export interface FullSheetsSyncPayload {
  config: Record<string, string>;
  dia_a_dia: DiaADiaItem[];
  avisos: AvisoItem[];
  calendario: CalendarEvent[];
  horario: ScheduleItem[];
  multimedia: MultimediaItem[];
  aprendemos: EducationalResource[];
  recursos: HomeLearningResource[];
}

export interface AppsScriptResponse<T = unknown> {
  success: boolean;
  sheet?: string;
  timestamp?: string;
  data?: T;
  error?: string;
}

/**
 * 8. Pestaña CONFIGURACION:
 * clave | valor | descripcion
 */
export interface AppConfig {
  classTitle: string;
  schoolName: string;
  teacherName: string;
  schoolYear: string;
  welcomeMessage: string;
  timezone: string;
  language: string;
  driveFolderUrl: string;
  youtubeAuthorizedUrl: string;
  sheetsDocumentId: string;
}

/**
 * Las 8 Secciones Oficiales Definitivas de la Aplicación:
 * 1. Inicio
 * 2. Día a Día
 * 3. Calendario
 * 4. Horario
 * 5. Fotografías y Vídeos
 * 6. Aprendemos (Qué trabajamos en clase)
 * 7. Recursos (Biblioteca para practicar en casa)
 * 8. Avisos
 */
export type MainTabType =
  | 'inicio'
  | 'diario'
  | 'calendario'
  | 'horario'
  | 'multimedia'
  | 'aprendemos'
  | 'recursos'
  | 'avisos';

export type SubResourceTab = 'aprendemos' | 'fotos' | 'multimedia' | 'recursos';
export type SubScheduleTab = 'horario' | 'calendario';
