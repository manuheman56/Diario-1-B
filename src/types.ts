export type PostCategory = 'Aviso' | 'Tarea' | 'Actividad' | 'Examen' | 'Urgente';

/**
 * Notice interface (Requisito 5: interfaces estrictas)
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

/**
 * TimetableDay interface (Requisito 5)
 */
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

/**
 * MealPlan interface (Requisito 5)
 */
export interface MealPlan {
  day: DayOfWeek;
  dateStr: string;
  firstCourse: string;
  secondCourse: string;
  garnish: string;
  dessert: string;
  calories: string;
  allergens: string[];
}

// Alias for backwards compatibility
export type DailyMenu = MealPlan;

/**
 * ConferenceRequest interface (Requisito 5)
 */
export interface ConferenceRequest {
  id: string;
  studentName: string;
  parentName: string;
  phone: string;
  email: string;
  preferredSlot: string;
  subject: string;
  status: 'pendiente' | 'confirmada' | 'atendida';
  createdAt: string;
}

// Alias for backwards compatibility
export type TutoriaRequest = ConferenceRequest;

export interface AppConfig {
  classTitle: string;
  schoolName: string;
  teacherName: string;
  teacherEmail: string;
  schoolPhone: string;
  driveUrl: string;
  youtubeUrl: string;
  tutoriaScheduleText: string;
  teacherPin: string;  // Requisito 1: PIN de 4 dígitos (defecto: '1234')
  sheetsUrl: string;   // Requisito 2: URL de Google Sheets CSV/JSON
}
