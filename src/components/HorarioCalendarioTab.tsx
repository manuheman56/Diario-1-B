import React, { useMemo, useState } from 'react';
import { CalendarEvent, DayOfWeek, ScheduleItem } from '../types';
import {
  Clock,
  CalendarDays,
  MapPin,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
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
    // Al cambiar de mes, solo preseleccionar "hoy" si regresamos al mes y año actuales
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

  // Filter events for the selected day in calendar
  const selectedDayEvents =
    selectedCalendarDay !== null
      ? events.filter((ev) =>
          doesEventFallOnDate(ev, selectedCalendarDay, currentMonthIndex, currentYear)
        )
      : [];

  const currentDaySchedule = schedule[selectedDay] || [];

  return (
    <div className="space-y-4 pb-6">
      {/* Top Segmented Switcher */}
      <div className="bg-slate-200/90 p-1 rounded-2xl flex text-xs font-bold shadow-inner">
        <button
          onClick={() => setSubView('horario')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subView === 'horario'
              ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock
            className={`w-3.5 h-3.5 ${
              subView === 'horario' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span>Horario Semanal</span>
        </button>

        <button
          onClick={() => setSubView('calendario')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            subView === 'calendario'
              ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarDays
            className={`w-3.5 h-3.5 ${
              subView === 'calendario' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span>Calendario Escolar</span>
        </button>
      </div>

      {/* ================= 1. VISTA HORARIO ================= */}
      {subView === 'horario' && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Day selection tabs with 44px min touch target */}
          <div className="flex justify-between gap-1 bg-white p-1 rounded-2xl border border-slate-200/80 shadow-xs">
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
                  className={`flex-1 min-h-[44px] py-2 px-1 rounded-xl text-xs font-bold transition text-center relative cursor-pointer touch-manipulation active:scale-95 flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="leading-tight">{day.slice(0, 3)}</span>
                  {isToday && (
                    <span
                      className={`block text-[8px] uppercase tracking-tighter ${
                        isSelected ? 'text-indigo-200' : 'text-indigo-600'
                      }`}
                    >
                      Hoy
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Toggle view mode: Day vs Whole Week */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <span className="font-semibold text-slate-700">
              Clases del {selectedDay}
            </span>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="text-indigo-600 hover:underline font-bold text-[11px] cursor-pointer min-h-[32px] flex items-center"
            >
              {viewMode === 'day' ? 'Ver semana completa' : 'Ver día a día'}
            </button>
          </div>

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="space-y-2.5">
              {currentDaySchedule.length > 0 ? (
                currentDaySchedule.map((item, index) => (
                  <div
                    key={index}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-xs flex items-center justify-between gap-3 hover:border-indigo-200 transition"
                  >
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {item.subject}
                      </h4>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{item.loc}</span>
                        </span>
                        {item.teacher && (
                          <span className="text-[10px] text-slate-400 truncate">
                            · {item.teacher}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-xl border border-indigo-100 shrink-0">
                      {item.time}
                    </span>
                  </div>
                ))
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                  No hay clases programadas para este día.
                </div>
              )}
            </div>
          )}

          {/* Whole Week Matrix View */}
          {viewMode === 'week' && (
            <div className="space-y-3">
              {DAYS.map((day) => {
                const dayItems = schedule[day] || [];
                return (
                  <div
                    key={day}
                    className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs"
                  >
                    <h4 className="font-bold text-xs text-indigo-900 border-b border-slate-100 pb-1.5 mb-2">
                      {day}
                    </h4>
                    {dayItems.length > 0 ? (
                      <div className="space-y-1.5">
                        {dayItems.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-slate-800 block truncate">
                                {item.subject}
                              </span>
                              <span className="text-[10px] text-slate-400 block truncate">
                                {item.loc}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-600 shrink-0 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                              {item.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">Sin clases</p>
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
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Calendar Card */}
          <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-card space-y-3.5">
            {/* Header with Month Navigation */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-display font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                  {MONTH_NAMES[currentMonthIndex]} {currentYear}
                </h3>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  {getSchoolTermLabel(currentMonthIndex)}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!isViewingCurrentMonth && (
                  <button
                    type="button"
                    onClick={handleGoToToday}
                    className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer active:scale-95"
                  >
                    Hoy
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleChangeMonth(-1)}
                  aria-label="Mes anterior"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleChangeMonth(1)}
                  aria-label="Mes siguiente"
                  className="w-9 h-9 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center transition cursor-pointer active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-500 pt-0.5 border-t border-slate-100">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Hoy
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Lectivo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Salida
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                Festivo
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Evaluación
              </span>
            </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
              <span>L</span>
              <span>M</span>
              <span>X</span>
              <span>J</span>
              <span>V</span>
              <span className="text-rose-400">S</span>
              <span className="text-rose-400">D</span>
            </div>

            {/* Dynamic Days Grid (Week starts on Monday) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: leadingEmptyCells }).map((_, i) => (
                <div key={`blank-${i}`} className="min-h-[42px] py-1.5" aria-hidden="true"></div>
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const isToday = day === today.day && isViewingCurrentMonth;
                const isSelected = selectedCalendarDay === day;
                const cellIndex = leadingEmptyCells + idx;
                const isWeekend = cellIndex % 7 === 5 || cellIndex % 7 === 6;

                // Check if any events fall on this day
                const dayEvents = events.filter((ev) =>
                  doesEventFallOnDate(ev, day, currentMonthIndex, currentYear)
                );
                const dayEvent = dayEvents[0];

                let cellClass =
                  'relative min-h-[42px] py-1.5 rounded-xl font-bold transition flex flex-col items-center justify-center cursor-pointer select-none touch-manipulation active:scale-95 ';

                if (isSelected) {
                  cellClass += isToday
                    ? ' bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300'
                    : ' bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200';
                } else if (isToday) {
                  cellClass +=
                    ' bg-indigo-50 text-indigo-900 border-2 border-indigo-400 font-extrabold';
                } else if (dayEvent?.type === 'salida') {
                  cellClass +=
                    ' bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
                } else if (dayEvent?.type === 'festivo') {
                  cellClass +=
                    ' bg-rose-100 text-rose-800 border border-rose-300 font-extrabold';
                } else if (dayEvent?.type === 'evaluacion') {
                  cellClass +=
                    ' bg-purple-100 text-purple-800 border border-purple-300 font-extrabold';
                } else if (dayEvent?.type === 'lectivo') {
                  cellClass +=
                    ' bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold';
                } else if (isWeekend) {
                  cellClass += ' text-slate-300 hover:bg-slate-50';
                } else {
                  cellClass += ' text-slate-700 hover:bg-slate-100';
                }

                const dotColor = isSelected
                  ? 'bg-white'
                  : dayEvent?.type === 'salida'
                  ? 'bg-amber-500'
                  : dayEvent?.type === 'festivo'
                  ? 'bg-rose-500'
                  : dayEvent?.type === 'evaluacion'
                  ? 'bg-purple-500'
                  : 'bg-emerald-500';

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
                      <span className={`w-1.5 h-1.5 rounded-full mt-1 ${dotColor}`}></span>
                    ) : isToday && !isSelected ? (
                      <span className="w-1.5 h-1.5 rounded-full mt-1 bg-indigo-500"></span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details Card */}
          {selectedCalendarDay !== null ? (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <CalendarIcon className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Día seleccionado: {selectedCalendarDay} de {MONTH_NAMES[currentMonthIndex]} de {currentYear}
                  </span>
                </span>
                {isSelectedToday && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full shrink-0">
                    Hoy
                  </span>
                )}
              </div>

              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 shrink-0">
                        {ev.type.toUpperCase()}
                      </span>
                    </div>
                    {ev.description && (
                      <p className="text-slate-600 text-[11px]">{ev.description}</p>
                    )}
                    {(ev.time || ev.lugar) && (
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-medium pt-0.5">
                        {ev.time && <span>Horario: {ev.time}</span>}
                        {ev.lugar && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />
                            <span>{ev.lugar}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  No hay actividades programadas para esta fecha.
                </p>
              )}
            </div>
          ) : (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-500 flex items-center gap-2">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>
                Pulsa sobre cualquier día de {MONTH_NAMES[currentMonthIndex]} para consultar las actividades programadas.
              </span>
            </div>
          )}

          {/* Próximos Eventos Destacados */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Próximos Eventos del Calendario
            </h4>

            {events.length > 0 ? (
              events.map((ev) => {
                let badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
                let badgeText = 'Salida';
                let bgBox = 'bg-amber-100 text-amber-800';

                if (ev.type === 'festivo') {
                  badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                  badgeText = 'Festivo';
                  bgBox = 'bg-rose-100 text-rose-800';
                } else if (ev.type === 'evaluacion') {
                  badgeColor = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                  badgeText = 'Notas';
                  bgBox = 'bg-indigo-100 text-indigo-800';
                } else if (ev.type === 'lectivo') {
                  badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                  badgeText = 'Jornada';
                  bgBox = 'bg-emerald-100 text-emerald-800';
                }

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => {
                      setCurrentYear(ev.year);
                      setCurrentMonthIndex(ev.month);
                      setSelectedCalendarDay(ev.day);
                    }}
                    className="w-full text-left bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-xs hover:shadow-md hover:border-indigo-200 transition cursor-pointer"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${bgBox}`}
                    >
                      <span className="text-[9px] uppercase font-semibold">
                        {SHORT_MONTH_NAMES[ev.month] ?? ''}
                      </span>
                      <span className="text-sm font-extrabold leading-none">
                        {ev.day}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-900 truncate">
                        {ev.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 leading-tight line-clamp-2">
                        {ev.description}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${badgeColor}`}
                    >
                      {badgeText}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
                No hay eventos programados en este momento.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
