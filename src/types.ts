export type PostCategory = 'Aviso' | 'Tarea' | 'Actividad' | 'Urgente';

/**
 * Notice interface (Diario de aula)
 */
export interface Notice {
  id: string;
  title: string;
  tag: PostCategory;
  date: string;
  timestamp: number;
  content: string;
  author: string;
  completed?: boolean;
  important?: boolean;
  icon?: string;
  source?: 'local' | 'sheets';
}

// Alias for backwards compatibility
export type PostItem = Notice;

export interface ScheduleItem {
  time: string;
  subject: string;
  loc: string;
  teacher?: string;
  color: string;
  iconName?: string;
}

export type DayOfWeek = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes';

export interface TimetableDay {
  day: DayOfWeek;
  items: ScheduleItem[];
}

export interface CalendarEvent {
  id: string;
  day: number;
  month: number; // 0-indexed (10 is Nov)
  year: number;
  title: string;
  description: string;
  type: 'lectivo' | 'salida' | 'festivo' | 'evaluacion';
  time?: string;
}

export interface AppConfig {
  classTitle: string;
  schoolName: string;
  teacherName: string;
  driveFolderUrl: string; // Restringido exclusivamente a la carpeta autorizada del aula
  youtubeAuthorizedUrl: string; // Restringido exclusivamente al vídeo o lista autorizada del aula
  sheetsUrl: string;
}
