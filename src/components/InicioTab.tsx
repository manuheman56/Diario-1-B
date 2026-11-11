import React from 'react';
import { AppConfig, CalendarEvent, Notice, MainTabType, SubResourceTab, SubScheduleTab } from '../types';
import {
  Sparkles,
  BookOpen,
  Bell,
  Clock,
  Calendar,
  Image as ImageIcon,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  CalendarDays,
  School,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

import { initialConfig } from '../data/defaultData';
import { AvisoItem } from '../types';

interface InicioTabProps {
  posts: Notice[];
  events: CalendarEvent[];
  avisos?: AvisoItem[];
  onNavigate: (tab: MainTabType, subTab?: SubScheduleTab | SubResourceTab) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  config?: AppConfig;
}

export const InicioTab: React.FC<InicioTabProps> = ({
  posts,
  events,
  avisos,
  onNavigate,
  isRefreshing = false,
  onRefresh,
  config = initialConfig,
}) => {
  // Current date formatted in Spanish
  const todayStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  const capitalizedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  // Urgent notices check (from AVISOS or DIA_A_DIA)
  const urgentAviso = avisos?.find((a) => a.important || a.tipo?.toLowerCase().includes('urgente'));
  const urgentPost = urgentAviso
    ? {
        id: urgentAviso.id,
        title: urgentAviso.titulo,
        content: urgentAviso.mensaje,
        date: urgentAviso.fecha_publicacion,
      }
    : posts.find((p) => p.important || p.tag === 'Urgente');

  // Pending homework check
  const pendingTasks = posts.filter((p) => p.tag === 'Tarea' && !p.completed);

  // Recent 2 posts
  const recentPosts = posts.slice(0, 2);

  // Upcoming 2 events
  const nextEvents = events.slice(0, 2);

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-sky-800 p-5 text-white shadow-lg shadow-indigo-900/20">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-sky-100 backdrop-blur-md border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              {config.classTitle} · {config.schoolYear || 'Curso 2026/27'}
            </span>
            <span className="text-[11px] font-medium text-indigo-100 bg-black/20 px-2.5 py-1 rounded-full">
              {capitalizedDate}
            </span>
          </div>

          <div>
            <h2 className="font-display font-extrabold text-2xl leading-tight tracking-tight text-white">
              El Diario del Aula
            </h2>
            <p className="text-xs text-indigo-100/90 leading-relaxed mt-1 max-w-sm">
              {config.welcomeMessage ||
                'Bienvenidas, familias. Portal informativo oficial de 1.º B para seguir el aprendizaje, actividades y vida diaria de nuestra clase.'}
            </p>
          </div>

          {/* Teacher Badge & Refresh Action */}
          <div className="pt-1 flex items-center justify-between flex-wrap gap-2 text-xs border-t border-white/15">
            <span className="text-[11px] text-indigo-200 flex items-center gap-1.5">
              <span>Tutor:</span>
              <strong className="text-white font-semibold">{config.teacherName}</strong>
            </span>

            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="text-[11px] font-semibold text-white/90 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Actualizar datos escolares"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Decorative backdrop shape */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <School className="w-52 h-52 text-white" />
        </div>
      </div>

      {/* 2. Urgent / Important Notice Banner (if active) */}
      {urgentPost && (
        <div
          onClick={() => onNavigate('avisos')}
          className="bg-rose-50 border border-rose-200/90 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs hover:bg-rose-100/80 transition cursor-pointer"
        >
          <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900">
                Aviso importante
              </span>
              <span className="text-[10px] text-rose-500">{urgentPost.date}</span>
            </div>
            <h4 className="font-bold text-xs text-rose-950 mt-1 truncate">
              {urgentPost.title}
            </h4>
            <p className="text-[11px] text-rose-800 line-clamp-1 mt-0.5">
              {urgentPost.content}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-rose-600 shrink-0 self-center" />
        </div>
      )}

      {/* 3. Pending Homework Alert (if tasks exist) */}
      {pendingTasks.length > 0 && (
        <div
          onClick={() => onNavigate('diario')}
          className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-900 transition hover:bg-amber-100/90 cursor-pointer shadow-xs"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold leading-tight truncate">
                {pendingTasks.length === 1
                  ? 'Tienes 1 tarea pendiente para casa'
                  : `Tienes ${pendingTasks.length} tareas pendientes para casa`}
              </p>
              <p className="text-[11px] text-amber-800/80 truncate">
                Pulsa para abrir el checklist y marcarla al terminar
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-xl shrink-0">
            Ver tarea
          </span>
        </div>
      )}

      {/* 4. Quick Shortcuts Grid (Acceso directo a las 6 áreas funcionales) */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Acceso Rápido al Aula
          </h3>
          <span className="text-[10px] text-slate-400 font-medium">1.º B Primaria</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* A. Día a Día */}
          <button
            onClick={() => onNavigate('diario')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Día a Día</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Actividades y deberes
            </span>
          </button>

          {/* B. Avisos */}
          <button
            onClick={() => onNavigate('avisos')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-2 group-hover:scale-105 transition relative">
              <Bell className="w-4 h-4" />
              {urgentPost && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
              )}
            </div>
            <span className="font-bold text-xs text-slate-900">Tablón de Avisos</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Circulares del colegio
            </span>
          </button>

          {/* C. Horario */}
          <button
            type="button"
            onClick={() => onNavigate('horario')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Horario Semanal</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Sesiones de lunes a viernes
            </span>
          </button>

          {/* D. Calendario */}
          <button
            type="button"
            onClick={() => onNavigate('calendario')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Calendario</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Salidas y festivos
            </span>
          </button>

          {/* E. Fotos y Vídeos */}
          <button
            type="button"
            onClick={() => onNavigate('multimedia')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-sky-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <ImageIcon className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Fotos y Vídeos</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Galería segura de clase
            </span>
          </button>

          {/* F. Aprendemos (Qué trabajamos en clase) */}
          <button
            type="button"
            onClick={() => onNavigate('aprendemos')}
            className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <School className="w-4 h-4" />
            </div>
            <span className="font-bold text-xs text-slate-900">Aprendemos</span>
            <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Qué trabajamos en el aula
            </span>
          </button>

          {/* G. Recursos (Biblioteca para casa) */}
          <button
            type="button"
            onClick={() => onNavigate('recursos')}
            className="col-span-2 sm:col-span-1 p-3.5 bg-gradient-to-br from-indigo-50/80 to-sky-50/80 rounded-2xl border border-indigo-200/80 shadow-xs hover:border-indigo-300 hover:shadow-sm transition flex flex-col items-start text-left cursor-pointer group active:scale-98"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-indigo-950">Recursos en Casa</span>
              <span className="text-[9px] font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded-full">
                Biblioteca
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
              Juegos, fichas PDF y pautas
            </span>
          </button>
        </div>
      </div>

      {/* 5. Últimas Publicaciones del Aula */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
            Últimas Novedades de Clase
          </h3>
          <button
            onClick={() => onNavigate('diario')}
            className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Ver todas</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentPosts.length === 0 ? (
            <div className="p-5 bg-white rounded-3xl border border-slate-200/80 text-center text-xs text-slate-500 space-y-1 shadow-xs">
              <p className="font-bold text-slate-800">No hay publicaciones recientes</p>
              <p className="text-[11px] text-slate-400">
                Las actividades, tareas y notas del aula se mostrarán aquí en cuanto se publiquen.
              </p>
            </div>
          ) : (
            recentPosts.map((post) => (
              <div
                key={post.id}
                onClick={() => onNavigate('diario')}
                className="p-4 bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition cursor-pointer space-y-1.5"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <span>{post.icon || '📌'}</span>
                    <span>{post.tag}</span>
                  </span>
                  <span>{post.date}</span>
                </div>
                <h4 className="font-display font-bold text-xs text-slate-900">
                  {post.title}
                </h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {post.content}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 6. Próximos Acontecimientos */}
      {nextEvents.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500">
              Próximos Acontecimientos
            </h3>
            <button
              onClick={() => onNavigate('horario', 'calendario')}
              className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Calendario completo</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nextEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onNavigate('horario', 'calendario')}
                className="p-3 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3 cursor-pointer hover:border-amber-200 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex flex-col items-center justify-center font-bold shrink-0">
                  <span className="text-[9px] uppercase font-semibold">Nov</span>
                  <span className="text-sm font-extrabold leading-none">{ev.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-xs text-slate-900 truncate">{ev.title}</h5>
                  <p className="text-[10px] text-slate-500 truncate">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. Footer minimalista institucional */}
      <div className="pt-3 border-t border-slate-200/70 text-center text-xs text-slate-400 space-y-1">
        <p className="font-semibold text-slate-600">
          {config.schoolName} · {config.classTitle}
        </p>
        <p className="text-[10px] text-slate-400">
          Comunicaciones y avisos oficiales canalizados mediante Séneca e iPasen.
        </p>
      </div>
    </div>
  );
};
