import React, { useMemo, useState } from 'react';
import { CalendarEvent, DayOfWeek, ScheduleItem } from '../types';
import { getUpcomingCalendarEvents } from '../utils/eventUtils';
import { SectionHeader } from './SectionHeader';
import {
  Clock,
  CalendarDays,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calculator,
  Leaf,
  Languages,
  Activity,
  Palette,
  Coffee,
  HeartHandshake,
} from 'lucide-react';

interface HorarioCalendarioTabProps {
  schedule: Record<DayOfWeek, ScheduleItem[]>;
  events: CalendarEvent[];
  initialSubView?: 'horario' | 'calendario';
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

export const SHORT_MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
] as const;

export function getDaysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function getMonthLeadingEmptyCells(year: number, monthIndex: number): number {
  // getDay(): 0 = Domingo, 1 = Lunes ... 6 = Sábado -> Convertimos a semana iniciada en Lunes (0 = Lunes ... 6 = Domingo)
  const firstDayOfWeek = new Date(year, monthIndex, 1).getDay();
  return (firstDayOfWeek + 6) % 7;
}

export function getSchoolTermLabel(monthIndex: number): string {
  if (monthIndex >= 8 && monthIndex <= 11) return 'Primer Trimestre Escolar';
  if (monthIndex >= 0 && monthIndex <= 2) return 'Segundo Trimestre Escolar';
  if (monthIndex >= 3 && monthIndex <= 5) return 'Tercer Trimestre Escolar';
  return 'Periodo No Lectivo';
}

export function stepCalendarMonth(
  year: number,
  monthIndex: number,
  delta: -1 | 1
): { year: number; monthIndex: number } {
  const nextMonth = monthIndex + delta;
  if (nextMonth < 0) {
    return { year: year - 1, monthIndex: 11 };
  }
  if (nextMonth > 11) {
    return { year: year + 1, monthIndex: 0 };
  }
  return { year, monthIndex: nextMonth };
}

function toDateCodeFromSpanish(dateStr?: string): number | null {
  if (!dateStr) return null;
  const match = dateStr.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const d = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const y = parseInt(match[3], 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return y * 10000 + m * 100 + d;
}

export function doesEventFallOnDate(
  ev: CalendarEvent,
  day: number,
  monthIndex: number,
  year: number
): boolean {
  const targetCode = year * 10000 + (monthIndex + 1) * 100 + day;
  const startCode = toDateCodeFromSpanish(ev.fecha_inicio);
  const endCode = toDateCodeFromSpanish(ev.fecha_fin);

  if (startCode !== null && endCode !== null && endCode >= startCode) {
    return targetCode >= startCode && targetCode <= endCode;
  }
  if (startCode !== null) {
    return targetCode === startCode;
  }
  return ev.day === day && ev.month === monthIndex && ev.year === year;
}

function getSubjectVisual(subject: string) {
  const s = subject.toLowerCase();
  if (s.includes('recreo') || s.includes('descanso')) {
    return {
      isBreak: true,
      icon: <Coffee className="w-4 h-4" />,
      iconBox: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
      cardBg: 'bg-[#FEF3C7]/40 border-[#FDE68A]',
      timeBadge: 'bg-white text-[#92400E] border border-[#FDE68A]',
    };
  }
  if (s.includes('lengua') || s.includes('lectura')) {
    return {
      isBreak: false,
      icon: <BookOpen className="w-4 h-4" />,
      iconBox: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/70',
    };
  }
  if (s.includes('matem') || s.includes('cálculo') || s.includes('calculo')) {
    return {
      isBreak: false,
      icon: <Calculator className="w-4 h-4" />,
      iconBox: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#F0FDFA] text-[#0F766E] border border-teal-200/70',
    };
  }
  if (s.includes('conoc') || s.includes('cienc') || s.includes('natur')) {
    return {
      isBreak: false,
      icon: <Leaf className="w-4 h-4" />,
      iconBox: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
    };
  }
  if (s.includes('ingl') || s.includes('franc')) {
    return {
      isBreak: false,
      icon: <Languages className="w-4 h-4" />,
      iconBox: 'bg-[#F5F3FF] text-[#7C3AED] border border-violet-200/80',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#F5F3FF] text-[#6D28D9] border border-violet-200/70',
    };
  }
  if (s.includes('físic') || s.includes('fisic') || s.includes('deport')) {
    return {
      isBreak: false,
      icon: <Activity className="w-4 h-4" />,
      iconBox: 'bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3]',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]',
    };
  }
  if (s.includes('plást') || s.includes('plast') || s.includes('art') || s.includes('músic') || s.includes('music')) {
    return {
      isBreak: false,
      icon: <Palette className="w-4 h-4" />,
      iconBox: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
    };
  }
  if (s.includes('relig') || s.includes('valor') || s.includes('tutor')) {
    return {
      isBreak: false,
      icon: <HeartHandshake className="w-4 h-4" />,
      iconBox: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]',
      cardBg: 'bg-white border-[#E2E8F0]',
      timeBadge: 'bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]',
    };
  }
  return {
    isBreak: false,
    icon: <Clock className="w-4 h-4" />,
    iconBox: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80',
    cardBg: 'bg-white border-[#E2E8F0]',
    timeBadge: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/70',
  };
}

function getEventTypePresentation(type: CalendarEvent['type']) {
  switch (type) {
    case 'festivo':
      return {
        label: 'Festivo',
        badge: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
        dateBox: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
        cell: 'bg-[#FFF1F2] text-[#9F1239] border border-[#FECDD3] font-bold',
        dot: 'bg-[#E11D48]',
      };
    case 'evaluacion':
      return {
        label: 'Evaluación',
        badge: 'bg-[#F5F3FF] text-[#6D28D9] border-violet-200',
        dateBox: 'bg-[#F5F3FF] text-[#6D28D9] border-violet-200',
        cell: 'bg-[#F5F3FF] text-[#5B21B6] border border-violet-200 font-bold',
        dot: 'bg-[#7C3AED]',
      };
    case 'lectivo':
      return {
        label: 'Lectivo',
        badge: 'bg-[#F0FDFA] text-[#0F766E] border-teal-200',
        dateBox: 'bg-[#F0FDFA] text-[#0F766E] border-teal-200',
        cell: 'bg-[#F0FDFA] text-[#115E59] border border-teal-200 font-bold',
        dot: 'bg-[#0D9488]',
      };
    case 'salida':
    default:
      return {
        label: 'Salida',
        badge: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        dateBox: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
        cell: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] font-bold',
        dot: 'bg-[#D97706]',
      };
  }
}

export const HorarioCalendarioTab: React.FC<HorarioCalendarioTabProps> = ({
  schedule,
  events,
  initialSubView = 'horario',
}) => {
  const [subView, setSubView] = useState<'horario' | 'calendario'>(initialSubView);

  React.useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Fecha real actual del dispositivo (calculada dinámicamente al montar)
  const today = useMemo(() => {
    const now = new Date();
    return {
      day: now.getDate(),
      month: now.getMonth(),
      year: now.getFullYear(),
      dayOfWeek: now.getDay(),
    };
  }, []);

  // Determine current day of week (0=Sun, 1=Mon, ..., 5=Fri)
  const currentDayIndex = today.dayOfWeek;
  const defaultDay: DayOfWeek =
    currentDayIndex >= 1 && currentDayIndex <= 5
      ? DAYS[currentDayIndex - 1]
      : 'Lunes';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);

  // Estado dinámico del calendario escolar (inicializado en la fecha real actual)
  const [currentMonthIndex, setCurrentMonthIndex] = useState<number>(today.month);
  const [currentYear, setCurrentYear] = useState<number>(today.year);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(today.day);

  const isViewingCurrentMonth =
    currentMonthIndex === today.month && currentYear === today.year;

  const isSelectedToday =
    selectedCalendarDay !== null &&
    selectedCalendarDay === today.day &&
    isViewingCurrentMonth;

  const handleChangeMonth = (delta: -1 | 1) => {
    const next = stepCalendarMonth(currentYear, currentMonthIndex, delta);
    setCurrentYear(next.year);
    setCurrentMonthIndex(next.monthIndex);
    setSelectedCalendarDay(
      next.monthIndex === today.month && next.year === today.year ? today.day : null
    );
  };

  const handleGoToToday = () => {
    setCurrentYear(today.year);
    setCurrentMonthIndex(today.month);
    setSelectedCalendarDay(today.day);
  };

  const leadingEmptyCells = getMonthLeadingEmptyCells(currentYear, currentMonthIndex);
  const daysInMonth = getDaysInMonth(currentYear, currentMonthIndex);

  const selectedDayEvents =
    selectedCalendarDay !== null
      ? events.filter((ev) =>
          doesEventFallOnDate(ev, selectedCalendarDay, currentMonthIndex, currentYear)
        )
      : [];

  const upcomingEvents = useMemo(
    () => getUpcomingCalendarEvents(events),
    [events]
  );

  const currentDaySchedule = schedule[selectedDay] || [];

  return (
    <div className="space-y-4 pb-6 diario-fade-in">
      {/* Cabecera unificada de organización */}
      <SectionHeader
        eyebrow="Organización del Aula"
        metaRight={
          subView === 'horario'
            ? 'Lunes a Viernes'
            : getSchoolTermLabel(currentMonthIndex)
        }
        title={subView === 'horario' ? 'Horario Semanal de 1.º B' : 'Calendario Escolar'}
        description={
          subView === 'horario'
            ? 'Consulta las sesiones, espacios y apoyos organizados por día o en vista semanal completa.'
            : 'Fechas clave del curso, días festivos, salidas escolares y sesiones de evaluación.'
        }
        icon={
          subView === 'horario' ? (
            <Clock className="w-5 h-5" />
          ) : (
            <CalendarDays className="w-5 h-5" />
          )
        }
        accent={subView === 'horario' ? 'teal' : 'amber'}
      />

      {/* Selector segmentado Horario / Calendario */}
      <div className="bg-[#F1F5F9] border border-[#E2E8F0] p-1 rounded-2xl flex text-xs font-bold">
        <button
          type="button"
          onClick={() => setSubView('horario')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer diario-press ${
            subView === 'horario'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <Clock
            className={`w-4 h-4 ${
              subView === 'horario' ? 'text-[#0D9488]' : 'text-[#64748B]'
            }`}
          />
          <span>Horario Semanal</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('calendario')}
          className={`flex-1 min-h-[44px] py-2 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer diario-press ${
            subView === 'calendario'
              ? 'bg-white text-[#0F172A] shadow-xs'
              : 'text-[#475569] hover:text-[#0F172A]'
          }`}
        >
          <CalendarDays
            className={`w-4 h-4 ${
              subView === 'calendario' ? 'text-[#D97706]' : 'text-[#64748B]'
            }`}
          />
          <span>Calendario Escolar</span>
        </button>
      </div>

      {/* ================= 1. VISTA HORARIO ================= */}
      {subView === 'horario' && (
        <div className="space-y-4 diario-fade-in">
          {/* Selector de días */}
          <div className="grid grid-cols-5 gap-1.5 bg-white p-1.5 rounded-2xl border border-[#E2E8F0] shadow-xs">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              const isToday =
                currentDayIndex >= 1 &&
                currentDayIndex <= 5 &&
                DAYS[currentDayIndex - 1] === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[48px] py-2 px-1 rounded-xl text-xs font-bold transition text-center relative cursor-pointer touch-manipulation diario-press flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-[#0D9488] text-white shadow-xs'
                      : 'text-[#334155] hover:bg-[#F7F8FA]'
                  }`}
                >
                  <span className="leading-tight sm:hidden">{day.slice(0, 3)}</span>
                  <span className="leading-tight hidden sm:inline">{day}</span>
                  {isToday && (
                    <span
                      className={`block text-[10px] font-bold leading-none mt-0.5 ${
                        isSelected ? 'text-teal-100' : 'text-[#0D9488]'
                      }`}
                    >
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Barra modo Día vs Semana */}
          <div className="flex items-center justify-between px-1 gap-2">
            <h3 className="font-display font-bold text-base text-[#0F172A]">
              {viewMode === 'day' ? `Clases del ${selectedDay}` : 'Semana completa'}
            </h3>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white border border-[#E2E8F0] hover:border-teal-300 hover:bg-[#F0FDFA] text-[#0F766E] font-bold text-xs cursor-pointer diario-press"
            >
              {viewMode === 'day' ? 'Ver semana completa' : 'Ver día a día'}
            </button>
          </div>

          {/* Vista diaria */}
          {viewMode === 'day' && (
            <div className="space-y-2.5">
              {currentDaySchedule.length > 0 ? (
                currentDaySchedule.map((item, index) => {
                  const visual = getSubjectVisual(item.subject);
                  return (
                    <div
                      key={index}
                      className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between gap-3 ${visual.cardBg}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${visual.iconBox}`}
                        >
                          {visual.icon}
                        </div>

                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-[15px] text-[#0F172A] leading-snug truncate">
                            {item.subject}
                          </h4>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[#475569] mt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                              <span className="truncate">{item.loc}</span>
                            </span>
                            {item.teacher && (
                              <span className="text-xs text-[#475569] truncate">
                                · {item.teacher}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl shrink-0 tabular-nums ${visual.timeBadge}`}
                      >
                        {item.time}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="diario-card p-6 rounded-3xl text-center text-sm text-[#475569]">
                  No hay clases programadas para este día.
                </div>
              )}
            </div>
          )}

          {/* Vista semanal completa */}
          {viewMode === 'week' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {DAYS.map((day) => {
                const dayItems = schedule[day] || [];
                const isToday =
                  currentDayIndex >= 1 &&
                  currentDayIndex <= 5 &&
                  DAYS[currentDayIndex - 1] === day;
                return (
                  <div
                    key={day}
                    className="diario-card rounded-3xl p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-2">
                      <h4 className="font-display font-bold text-sm text-[#0F172A]">
                        {day}
                      </h4>
                      {isToday && (
                        <span className="text-xs font-bold text-[#0F766E]">Hoy</span>
                      )}
                    </div>

                    {dayItems.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayItems.map((item, idx) => {
                          const visual = getSubjectVisual(item.subject);
                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between gap-2 text-xs py-2 px-2.5 rounded-xl border ${
                                visual.isBreak
                                  ? 'bg-[#FEF3C7]/45 border-[#FDE68A]'
                                  : 'bg-[#F7F8FA] border-[#E2E8F0]'
                              }`}
                            >
                              <div className="min-w-0 pr-1">
                                <span className="font-semibold text-[#0F172A] block truncate">
                                  {item.subject}
                                </span>
                                <span className="text-[11px] text-[#475569] block truncate">
                                  {item.loc}
                                  {item.teacher ? ` · ${item.teacher}` : ''}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#334155] shrink-0 font-bold bg-white px-2 py-1 rounded-lg border border-[#E2E8F0] tabular-nums">
                                {item.time}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-[#475569] italic">Sin clases</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 2. VISTA CALENDARIO ================= */}
      {subView === 'calendario' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start diario-fade-in">
          {/* Columna izquierda: Cuadrícula mensual */}
          <div className="lg:col-span-7 diario-card rounded-3xl p-4 sm:p-5 space-y-4">
            {/* Navegación mensual */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display font-bold text-[#0F172A] text-lg leading-tight">
                  {MONTH_NAMES[currentMonthIndex]} {currentYear}
                </h3>
                <span className="text-xs text-[#475569] font-medium block mt-0.5">
                  {getSchoolTermLabel(currentMonthIndex)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isViewingCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="min-h-[44px] px-3 rounded-xl text-xs font-bold bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE] hover:bg-[#E0E7FF] diario-press cursor-pointer"
                  >
                    Hoy
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleChangeMonth(-1)}
                  aria-label="Mes anterior"
                  className="w-11 h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F7F8FA] hover:text-[#0F172A] flex items-center justify-center diario-press cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMonth(1)}
                  aria-label="Mes siguiente"
                  className="w-11 h-11 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F7F8FA] hover:text-[#0F172A] flex items-center justify-center diario-press cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Leyenda coherente con el grid y los eventos */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-[#475569] pt-3 border-t border-[#F1F5F9]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4338CA]" />
                Hoy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488]" />
                Lectivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                Salida
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48]" />
                Festivo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                Evaluación
              </span>
            </div>

            {/* Cabecera días de la semana */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[#475569]">
              <span>L</span>
              <span>M</span>
              <span>X</span>
              <span>J</span>
              <span>V</span>
              <span className="text-[#BE123C]">S</span>
              <span className="text-[#BE123C]">D</span>
            </div>

            {/* Rejilla de días (celdas >= 44px táctiles) */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-xs sm:text-[13px] tabular-nums">
              {Array.from({ length: leadingEmptyCells }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[44px]" aria-hidden="true" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const isToday = day === today.day && isViewingCurrentMonth;
                const isSelected = selectedCalendarDay === day;
                const cellIndex = leadingEmptyCells + idx;
                const isWeekend = cellIndex % 7 === 5 || cellIndex % 7 === 6;

                const dayEvents = events.filter((ev) =>
                  doesEventFallOnDate(ev, day, currentMonthIndex, currentYear)
                );
                const dayEvent = dayEvents[0];
                const evStyle = dayEvent
                  ? getEventTypePresentation(dayEvent.type)
                  : null;

                let cellClass =
                  'relative min-h-[44px] py-1.5 rounded-xl font-semibold transition flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation diario-press ';

                if (isSelected) {
                  cellClass +=
                    'bg-[#4338CA] text-white shadow-sm ring-2 ring-[#C7D2FE] font-bold';
                } else if (isToday) {
                  cellClass +=
                    'bg-[#EEF2FF] text-[#312E81] border-2 border-[#4F46E5] font-bold';
                } else if (evStyle) {
                  cellClass += evStyle.cell;
                } else if (isWeekend) {
                  cellClass += 'text-[#64748B] hover:bg-[#F7F8FA]';
                } else {
                  cellClass += 'text-[#0F172A] hover:bg-[#F1F5F9]';
                }

                const dotColor = isSelected
                  ? 'bg-white'
                  : evStyle
                  ? evStyle.dot
                  : 'bg-[#4338CA]';

                return (
                  <button
                    key={`day-${currentYear}-${currentMonthIndex}-${day}`}
                    type="button"
                    onClick={() => setSelectedCalendarDay(day)}
                    aria-label={`${day} de ${MONTH_NAMES[currentMonthIndex]} de ${currentYear}${isToday ? ', hoy' : ''}`}
                    aria-pressed={isSelected}
                    className={cellClass}
                  >
                    <span className="leading-none">{day}</span>
                    {dayEvent ? (
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`} />
                    ) : isToday && !isSelected ? (
                      <span className="w-1.5 h-1.5 rounded-full mt-1 bg-[#4338CA]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Columna derecha: Día seleccionado + Próximos eventos */}
          <div className="lg:col-span-5 space-y-4">
            {/* Detalle del día seleccionado */}
            {selectedCalendarDay !== null ? (
              <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-3xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#0F172A]">
                  <span className="flex items-center gap-2 text-[#4338CA]">
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    <span>
                      {selectedCalendarDay} de {MONTH_NAMES[currentMonthIndex]} de {currentYear}
                    </span>
                  </span>
                  {isSelectedToday && (
                    <span className="text-xs font-bold bg-[#EEF2FF] text-[#4338CA] px-2.5 py-0.5 rounded-full border border-[#C7D2FE] shrink-0">
                      Hoy
                    </span>
                  )}
                </div>

                {selectedDayEvents.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDayEvents.map((ev) => {
                      const evStyle = getEventTypePresentation(ev.type);
                      const isMultiDay =
                        Boolean(ev.fecha_fin) && ev.fecha_fin !== ev.fecha_inicio;

                      return (
                        <div
                          key={ev.id}
                          className="p-3.5 bg-white rounded-2xl border border-[#E2E8F0] space-y-1.5 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-display font-bold text-sm text-[#0F172A] leading-snug">
                              {ev.title}
                            </span>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${evStyle.badge}`}
                            >
                              {evStyle.label}
                            </span>
                          </div>

                          {isMultiDay && (
                            <p className="text-xs font-semibold text-[#4338CA] tabular-nums">
                              Del {ev.fecha_inicio} al {ev.fecha_fin}
                            </p>
                          )}

                          {ev.description && (
                            <p className="text-xs text-[#334155] leading-relaxed">
                              {ev.description}
                            </p>
                          )}

                          {(ev.time || ev.lugar) && (
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#475569] font-medium pt-0.5">
                              {ev.time && <span>Horario: {ev.time}</span>}
                              {ev.lugar && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                                  <span>{ev.lugar}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-[#475569]">
                    No hay actividades programadas para esta fecha.
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-[#F1F5F9] border border-[#E2E8F0] rounded-3xl p-4 text-xs text-[#475569] flex items-center gap-2.5">
                <CalendarIcon className="w-4 h-4 text-[#4338CA] shrink-0" />
                <span>
                  Pulsa sobre cualquier día de {MONTH_NAMES[currentMonthIndex]} para consultar las actividades programadas.
                </span>
              </div>
            )}

            {/* Próximos Eventos */}
            <div className="space-y-2.5">
              <h4 className="font-display font-bold text-sm text-[#0F172A] px-1">
                Próximos eventos del calendario
              </h4>

              {upcomingEvents.length > 0 ? (
                <div className="space-y-2.5">
                  {upcomingEvents.map((ev) => {
                    const evStyle = getEventTypePresentation(ev.type);
                    const isMultiDay =
                      Boolean(ev.fecha_fin) && ev.fecha_fin !== ev.fecha_inicio;

                    return (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => {
                          setCurrentYear(ev.year);
                          setCurrentMonthIndex(ev.month);
                          setSelectedCalendarDay(ev.day);
                        }}
                        className="w-full text-left diario-card-interactive diario-press p-3.5 rounded-2xl flex items-center gap-3.5 cursor-pointer"
                      >
                        <div
                          className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center font-bold shrink-0 tabular-nums ${evStyle.dateBox}`}
                        >
                          <span className="text-[10px] uppercase font-bold leading-none">
                            {SHORT_MONTH_NAMES[ev.month] ?? ''}
                          </span>
                          <span className="text-base font-extrabold leading-tight mt-0.5">
                            {ev.day}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h5 className="font-display font-bold text-sm text-[#0F172A] truncate">
                              {ev.title}
                            </h5>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${evStyle.badge}`}
                            >
                              {evStyle.label}
                            </span>
                          </div>
                          {isMultiDay && (
                            <p className="text-[11px] font-semibold text-[#4338CA] mt-0.5 tabular-nums">
                              Del {ev.fecha_inicio} al {ev.fecha_fin}
                            </p>
                          )}
                          <p className="text-xs text-[#475569] leading-snug line-clamp-2 mt-0.5">
                            {ev.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="diario-card p-6 rounded-3xl text-center text-xs text-[#475569]">
                  No hay eventos programados en este momento.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
