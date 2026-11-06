import React, { useState } from 'react';
import { AppConfig, DailyMenu, DayOfWeek, TutoriaRequest } from '../types';
import { weeklyDiningMenu } from '../data/defaultData';
import {
  Utensils,
  FileText,
  CalendarCheck,
  Send,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Heart,
  Info,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServiciosTabProps {
  config: AppConfig;
  tutorias: TutoriaRequest[];
  onAddTutoria: (req: Omit<TutoriaRequest, 'id' | 'createdAt' | 'status'>) => void;
  onUpdateTutoriaStatus: (id: string, status: 'pendiente' | 'confirmada' | 'atendida') => void;
  onOpenMenuPdf: () => void;
  role: 'family' | 'teacher';
}

const DAYS: DayOfWeek[] = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

export const ServiciosTab: React.FC<ServiciosTabProps> = ({
  config,
  tutorias,
  onAddTutoria,
  onUpdateTutoriaStatus,
  onOpenMenuPdf,
  role,
}) => {
  // Day selection for dining menu
  const currentDayIdx = new Date().getDay();
  const defaultDay: DayOfWeek =
    currentDayIdx >= 1 && currentDayIdx <= 5 ? DAYS[currentDayIdx - 1] : 'Lunes';
  const [selectedMenuDay, setSelectedMenuDay] = useState<DayOfWeek>(defaultDay);

  // Form states
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('Próximo Martes - 16:00 h');
  const [subject, setSubject] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Current day's menu data
  const currentMenu =
    weeklyDiningMenu.find((m) => m.day === selectedMenuDay) ||
    weeklyDiningMenu[0];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !parentName.trim() || !phone.trim() || !subject.trim()) {
      return;
    }

    onAddTutoria({
      studentName,
      parentName,
      phone,
      email: email || 'No especificado',
      preferredSlot,
      subject,
    });

    setSubmittedSuccess(true);
    setStudentName('');
    setParentName('');
    setPhone('');
    setEmail('');
    setSubject('');

    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSubmittedSuccess(false);
    }, 6000);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-lg font-display font-bold text-slate-900">
          Servicios Escolares & Contacto
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Consulta el menú del comedor diario, solicita cita de tutoría o contacta
          con secretaría.
        </p>
      </div>

      {/* 1. Menú del Comedor Card */}
      <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-card space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-sm shadow-xs">
              <Utensils className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm text-slate-900">
                Menú Saludable del Comedor
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                Supervisado por nutricionistas escolares
              </span>
            </div>
          </div>

          <button
            onClick={onOpenMenuPdf}
            className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Ver Menú PDF</span>
          </button>
        </div>

        {/* Days selector */}
        <div className="flex justify-between gap-1 bg-slate-100/80 p-1 rounded-2xl">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setSelectedMenuDay(d)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition text-center cursor-pointer ${
                selectedMenuDay === d
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Daily dishes breakdown */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-bold pb-1.5 border-b border-slate-200/70">
            <span className="text-emerald-800 uppercase tracking-wide">
              Menú del {currentMenu.day}
            </span>
            <span className="text-slate-500 font-semibold">
              Aporte: {currentMenu.calories}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Primer Plato
              </span>
              <p className="font-semibold text-slate-800">
                {currentMenu.firstCourse}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Segundo Plato & Guarnición
              </span>
              <p className="font-semibold text-slate-800">
                {currentMenu.secondCourse}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                + {currentMenu.garnish}
              </p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Postre del Día
              </span>
              <p className="font-semibold text-emerald-700">
                {currentMenu.dessert}
              </p>
            </div>
          </div>

          {/* Allergens warning */}
          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2 text-[10px]">
            <span className="text-slate-500 flex items-center gap-1 font-medium">
              <Info className="w-3 h-3 text-slate-400" />
              Alérgenos presentes:
            </span>
            <div className="flex items-center gap-1">
              {currentMenu.allergens.map((alg) => (
                <span
                  key={alg}
                  className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold"
                >
                  {alg}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Solicitud de Tutoría Card */}
      <div className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-card space-y-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center text-sm shadow-xs">
            <CalendarCheck className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm text-slate-900">
              Solicitud de Cita de Tutoría
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">
              Horario de atención: {config.tutoriaScheduleText}
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {submittedSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900 animate-in fade-in duration-200">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong>¡Solicitud de tutoría enviada con éxito!</strong>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                La tutora revisará la petición y se pondrá en contacto contigo
                para confirmar la cita.
              </p>
            </div>
          </div>
        )}

        {/* Parent booking form */}
        <form onSubmit={handleBookingSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre del Alumno/a *
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Ej: Lucas Martínez"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nombre del Padre / Madre / Tutor *
              </label>
              <input
                type="text"
                required
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
                placeholder="Ej: Ana Belén Martínez"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Teléfono de Contacto *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 612 345 678"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Franja Horaria Preferida
              </label>
              <select
                value={preferredSlot}
                onChange={(e) => setPreferredSlot(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
              >
                <option value="Martes 10 Nov - 16:00 h">
                  Martes 10 Nov - 16:00 h
                </option>
                <option value="Martes 10 Nov - 16:30 h">
                  Martes 10 Nov - 16:30 h
                </option>
                <option value="Martes 10 Nov - 17:00 h">
                  Martes 10 Nov - 17:00 h
                </option>
                <option value="Martes 17 Nov - 16:00 h">
                  Martes 17 Nov - 16:00 h
                </option>
                <option value="Martes 17 Nov - 16:30 h">
                  Martes 17 Nov - 16:30 h
                </option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Motivo de la Tutoría *
            </label>
            <textarea
              required
              rows={2}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Deseo consultar la adaptación al grupo, hábitos de lectura o rendimiento en cálculo..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar Solicitud de Cita</span>
          </button>
        </form>

        {/* Teacher View: List of received requests */}
        {role === 'teacher' && (
          <div className="pt-3 border-t border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Panel Docente: Peticiones Recibidas ({tutorias.length})
              </h4>
            </div>

            {tutorias.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">
                No hay solicitudes de tutoría pendientes.
              </p>
            ) : (
              tutorias.map((tut) => (
                <div
                  key={tut.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-xs space-y-1.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-slate-900">
                        {tut.studentName}
                      </strong>{' '}
                      <span className="text-slate-500">
                        ({tut.parentName} - {tut.phone})
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                        tut.status === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tut.status.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100">
                    "{tut.subject}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Preferencia: {tut.preferredSlot}</span>
                    <button
                      onClick={() =>
                        onUpdateTutoriaStatus(
                          tut.id,
                          tut.status === 'confirmada' ? 'pendiente' : 'confirmada'
                        )
                      }
                      className="text-indigo-600 hover:underline font-bold cursor-pointer"
                    >
                      {tut.status === 'confirmada'
                        ? 'Desmarcar'
                        : 'Confirmar Cita'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 3. Datos de Contacto del Colegio */}
      <div className="bg-slate-100/90 border border-slate-200/90 rounded-3xl p-4 space-y-2.5 shadow-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          Contacto Directo con el Centro
        </span>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Teléfono Secretaría:</span>
          </span>
          <a
            href={`tel:${config.schoolPhone}`}
            className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:bg-slate-50 transition"
          >
            {config.schoolPhone}
          </a>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            <span>Email de Tutoría:</span>
          </span>
          <a
            href={`mailto:${config.teacherEmail}`}
            className="font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs hover:bg-indigo-50 transition text-[11px] truncate max-w-[170px]"
          >
            {config.teacherEmail}
          </a>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span>Horario de Secretaría:</span>
          </span>
          <span className="font-semibold text-slate-700 text-[11px]">
            De 09:00 a 11:30 h
          </span>
        </div>
      </div>
    </div>
  );
};
