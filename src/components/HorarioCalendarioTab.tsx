import React, { useState } from 'react';
import { CalendarEvent, DayOfWeek, ScheduleItem } from '../types';
import {
  Clock,
  CalendarDays,
  MapPin,
  Calendar as CalendarIcon,
} from 'lucide-react';

interface HorarioCalendarioTabProps {
  schedule: Record<DayOfWeek, ScheduleItem[]>;
  events: CalendarEvent[];
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const HorarioCalendarioTab: React.FC<HorarioCalendarioTabProps> = ({
  schedule,
  events,
}) => {
  const [subView, setSubView] = useState<'horario' | 'calendario'>('horario');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Determine current day of week (0=Sun, 1=Mon, ..., 5=Fri)
  const currentDayIndex = new Date().getDay();
  const defaultDay: DayOfWeek =
    currentDayIndex >= 1 && currentDayIndex <= 5
      ? DAYS[currentDayIndex - 1]
      : 'Lunes';

  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(defaultDay);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<number | null>(4); // Nov 4 default

  // Calendar month state (November 2026 default)
  const [currentMonthIndex] = useState(10); // 10 = Noviembre (0-indexed)
  const [currentYear] = useState(2026);

  // Filter events for the selected day in calendar
  const selectedDayEvents = events.filter(
    (ev) =>
      ev.day === selectedCalendarDay &&
      ev.month === currentMonthIndex &&
      ev.year === currentYear
  );

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
          {/* Day selection tabs */}
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
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition text-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>{day.slice(0, 3)}</span>
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
              onClick={() => setViewMode(viewMode === 'day' ? 'week' : 'day')}
              className="text-indigo-600 hover:underline font-bold text-[11px] cursor-pointer"
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
                    className={`p-3.5 rounded-2xl border border-slate-200/80 border-l-4 bg-white shadow-xs flex items-center justify-between gap-3 ${item.color}`}
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
                      </div>
                    </div>

                    <span className="text-[11px] font-bold text-slate-700 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200 shrink-0">
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
            {/* Header with Month */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-extrabold text-slate-900 text-sm">
                  Noviembre 2026
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">
                  Primer Trimestre Escolar
                </span>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500">
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
              </div>
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

            {/* Days Grid (Nov 2026 starts on Sunday Nov 1 if Monday=col 0, offset = 6) */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`blank-${i}`} className="py-2.5"></div>
              ))}

              {Array.from({ length: 30 }).map((_, idx) => {
                const day = idx + 1;
                const isToday = day === 4;
                const isSelected = selectedCalendarDay === day;
                const isWeekend = (idx + 6) % 7 === 5 || (idx + 6) % 7 === 6;

                // Check if any event falls on this day
                const dayEvent = events.find(
                  (ev) =>
                    ev.day === day &&
                    ev.month === currentMonthIndex &&
                    ev.year === currentYear
                );

                let cellClass =
                  'relative py-2.5 rounded-xl font-bold transition flex flex-col items-center justify-center cursor-pointer ';

                if (isSelected) {
                  cellClass +=
                    ' bg-indigo-600 text-white shadow-md ring-2 ring-indigo-200';
                } else if (isToday) {
                  cellClass +=
                    ' bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold';
                } else if (dayEvent?.type === 'salida') {
                  cellClass +=
                    ' bg-amber-100 text-amber-900 border border-amber-300 font-extrabold';
                } else if (dayEvent?.type === 'festivo') {
                  cellClass +=
                    ' bg-rose-100 text-rose-800 border border-rose-300 font-extrabold';
                } else if (dayEvent?.type === 'evaluacion') {
                  cellClass +=
                    ' bg-purple-100 text-purple-800 border border-purple-300 font-extrabold';
                } else if (isWeekend) {
                  cellClass += ' text-slate-300 hover:bg-slate-50';
                } else {
                  cellClass += ' text-slate-700 hover:bg-slate-100';
                }

                return (
                  <div
                    key={`day-${day}`}
                    onClick={() => setSelectedCalendarDay(day)}
                    className={cellClass}
                  >
                    <span>{day}</span>
                    {dayEvent && !isSelected && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          dayEvent.type === 'salida'
                            ? 'bg-amber-500'
                            : dayEvent.type === 'festivo'
                            ? 'bg-rose-500'
                            : 'bg-purple-500'
                        }`}
                      ></span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Day Details Card */}
          {selectedCalendarDay !== null && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  Día seleccionado: {selectedCalendarDay} de Noviembre
                </span>
                {selectedCalendarDay === 4 && (
                  <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">
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
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{ev.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {ev.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{ev.description}</p>
                    {ev.time && (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        Horario: {ev.time}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-500">
                  Jornada escolar ordinaria según el horario lectivo establecido.
                </p>
              )}
            </div>
          )}

          {/* Próximos Eventos Destacados */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Próximos Eventos del Trimestre
            </h4>

            {events.length > 0 ? (
              events.map((ev) => {
                const monthNames = [
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
                ];

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
                  <div
                    key={ev.id}
                    className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex items-center gap-3 shadow-xs hover:shadow-md transition"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 ${bgBox}`}
                    >
                      <span className="text-[9px] uppercase font-semibold">
                        {monthNames[ev.month] || 'Nov'}
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
                  </div>
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
