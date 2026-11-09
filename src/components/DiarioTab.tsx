import React, { useState, useRef } from 'react';
import { AppConfig, PostItem } from '../types';
import {
  Search,
  Share2,
  CheckCircle2,
  Circle,
  AlertCircle,
  FileText,
  UserCheck,
  Printer,
  Sparkles,
  BookOpen,
  Check,
  RefreshCw,
  ArrowDown,
  School,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiarioTabProps {
  posts: PostItem[];
  onToggleTask: (id: string) => void;
  onSharePost: (post: PostItem) => void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  config?: AppConfig;
}

export const DiarioTab: React.FC<DiarioTabProps> = ({
  posts,
  onToggleTask,
  onSharePost,
  isRefreshing = false,
  onRefresh,
  config,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Pull-to-refresh state
  const [pullY, setPullY] = useState(0);
  const touchStartY = useRef(0);
  const isPulling = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling.current) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    if (diff > 0 && diff < 120) {
      setPullY(diff);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullY > 60 && onRefresh) {
      setPullY(50);
      try {
        await onRefresh();
      } finally {
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  // Formatted date
  const todayStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const capitalizedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  // Filter logic
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      activeFilter === 'all'
        ? true
        : activeFilter === 'pending'
        ? post.tag === 'Tarea' && !post.completed
        : post.tag.toLowerCase() === activeFilter.toLowerCase();

    const matchesSearch =
      searchQuery.trim() === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const pendingHomeworkCount = posts.filter(
    (p) => p.tag === 'Tarea' && !p.completed
  ).length;

  const handleTaskCheck = (id: string, currentlyCompleted?: boolean) => {
    onToggleTask(id);
    if (!currentlyCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // fallback ignore
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="space-y-4 pb-6 relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh Indicator */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center py-2 transition-all duration-200 overflow-hidden text-xs text-sky-700 font-semibold"
          style={{ height: `${Math.max(pullY, isRefreshing ? 40 : 0)}px` }}
        >
          <div className="flex items-center gap-1.5 bg-sky-50 px-3 py-1 rounded-full border border-sky-200 shadow-2xs">
            {isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                <span>Actualizando el diario...</span>
              </>
            ) : (
              <>
                <ArrowDown
                  className={`w-3.5 h-3.5 text-sky-600 transition-transform ${
                    pullY > 60 ? 'rotate-180' : ''
                  }`}
                />
                <span>
                  {pullY > 60 ? 'Suelta para actualizar' : 'Desliza para actualizar'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1. Welcome Hero Banner */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-teal-700 rounded-3xl p-5 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-teal-100 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-teal-300 animate-pulse"></span>
              Cuaderno de Aula
            </span>
            <span className="text-xs text-indigo-100 font-medium bg-black/20 px-2.5 py-0.5 rounded-full">
              {capitalizedDate}
            </span>
          </div>

          <h2 className="font-display font-extrabold text-xl leading-tight">
            Novedades y Diario de Clase
          </h2>
          <p className="text-xs text-indigo-100/90 leading-relaxed max-w-sm">
            Consulta los avisos del colegio, actividades realizadas y tareas
            pendientes para hacer en familia.
          </p>

          {/* Action Row: Buscar e Imprimir */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-white/15 hover:bg-white/25 text-white font-medium px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer backdrop-blur-xs active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{showSearch ? 'Ocultar' : 'Buscar'}</span>
            </button>

            <button
              onClick={handlePrint}
              title="Imprimir diario escolar"
              className="bg-white/15 hover:bg-white/25 text-white font-medium p-2 rounded-xl text-xs flex items-center justify-center transition cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
          <BookOpen className="w-44 h-44 text-white" />
        </div>
      </div>

      {/* Search Input Container */}
      {showSearch && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en avisos, tareas o actividades..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs shadow-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            autoFocus
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Borrar
            </button>
          )}
        </div>
      )}

      {/* Homework Reminder Alert (if pending tasks exist) */}
      {pendingHomeworkCount > 0 && activeFilter !== 'pending' && (
        <div
          onClick={() => setActiveFilter('pending')}
          className="cursor-pointer bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 text-amber-900 transition hover:bg-amber-100/90"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold leading-tight">
                {pendingHomeworkCount === 1
                  ? 'Tienes 1 tarea pendiente para casa'
                  : `Tienes ${pendingHomeworkCount} tareas pendientes para casa`}
              </p>
              <p className="text-[11px] text-amber-800/80">
                Toca aquí para verlas y marcarlas como completadas
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-1 rounded-xl">
            Ver tareas
          </span>
        </div>
      )}

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({posts.length})
        </button>

        <button
          onClick={() => setActiveFilter('Aviso')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Aviso'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Avisos
        </button>

        <button
          onClick={() => setActiveFilter('Tarea')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Tarea'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Tareas
        </button>

        <button
          onClick={() => setActiveFilter('Actividad')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeFilter === 'Actividad'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          En Clase
        </button>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 text-slate-400 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                No hay avisos nuevos por el momento
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {activeFilter !== 'all'
                  ? 'No hay avisos en esta categoría. Puedes consultar el resto de novedades.'
                  : 'Aquí aparecerán las novedades, tareas y circulares escolares.'}
              </p>
            </div>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer"
              >
                Ver todos los avisos
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isHomework = post.tag === 'Tarea';
            const isCompleted = post.completed ?? false;

            // Badge styling
            let badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
            let badgeEmoji = post.icon || '📢';
            if (post.tag === 'Tarea') {
              badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
              if (!post.icon) badgeEmoji = '✏️';
            } else if (post.tag === 'Actividad') {
              badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              if (!post.icon) badgeEmoji = '🎨';
            } else if (post.tag === 'Urgente') {
              badgeStyle = 'bg-red-50 text-red-800 border-red-300 ring-2 ring-red-100';
              if (!post.icon) badgeEmoji = '🚨';
            }

            return (
              <article
                key={post.id}
                className={`bg-white p-4 rounded-3xl border transition-all duration-200 shadow-card hover:shadow-md ${
                  isHomework && isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : post.important
                    ? 'border-amber-300 ring-2 ring-amber-100'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badgeStyle}`}
                    >
                      <span>{badgeEmoji}</span>
                      <span>{post.tag}</span>
                    </span>

                    {post.important && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                        <AlertCircle className="w-2.5 h-2.5" />
                        Importante
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {post.date}
                  </span>
                </div>

                {/* Title */}
                <h3
                  className={`font-display font-bold text-slate-900 text-sm leading-snug mb-1.5 ${
                    isHomework && isCompleted
                      ? 'line-through text-slate-500'
                      : ''
                  }`}
                >
                  {post.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Homework check interaction for families */}
                {isHomework && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between bg-amber-50/50 -mx-4 -mb-1 px-4 py-2 rounded-b-3xl">
                    <button
                      onClick={() => handleTaskCheck(post.id, post.completed)}
                      className={`flex items-center gap-2 text-xs font-bold transition cursor-pointer ${
                        isCompleted
                          ? 'text-emerald-700'
                          : 'text-amber-800 hover:text-amber-900'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>¡Tarea completada en casa!</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-amber-600" />
                          <span>Marcar tarea como realizada</span>
                        </>
                      )}
                    </button>
                    {isCompleted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Listo
                      </span>
                    )}
                  </div>
                )}

                {/* Footer with Author and Actions */}
                <div
                  className={`flex items-center justify-between text-[11px] text-slate-400 ${
                    isHomework ? 'mt-2 pt-1' : 'mt-3 pt-2.5 border-t border-slate-100'
                  }`}
                >
                  <span className="flex items-center gap-1.5 font-medium text-slate-500 truncate mr-2">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">{post.author}</span>
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSharePost(post)}
                      className="hover:text-indigo-600 font-medium transition flex items-center gap-1 cursor-pointer text-slate-500 hover:bg-slate-100 px-2 py-1 rounded-lg"
                      title="Compartir o copiar aviso"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Datos fijos del colegio y tutor (minimalista) */}
      {config && (
        <div className="mt-6 pt-4 border-t border-slate-200/80 bg-slate-100/70 rounded-3xl p-4 text-xs space-y-2 text-slate-600 shadow-2xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
              <School className="w-3.5 h-3.5 text-sky-700" />
              {config.schoolName}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Tutor: <strong className="text-slate-800">{config.teacherName}</strong>
            </span>
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-2 border-t border-slate-200/50">
            Comunicaciones del centro, ausencias y gestiones oficiales gestionadas vía Séneca / iPasen.
          </p>
        </div>
      )}
    </div>
  );
};
