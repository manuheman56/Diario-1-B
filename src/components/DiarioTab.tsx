import React, { useState, useRef, useEffect } from 'react';
import { AppConfig, PostItem } from '../types';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import { SectionHeader } from './SectionHeader';
import { EmptyStateCard } from './EmptyStateCard';
import { FormattedText } from './FormattedText';
import { NewBadge, MarkAsReadButton } from './NewBadge';
import { getPublicationKey } from '../utils/readStatusService';
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
  ClipboardList,
  Palette,
  Bell,
  Rocket,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DiarioTabProps {
  posts: PostItem[];
  onToggleTask: (id: string) => void;
  onSharePost: (post: PostItem) => void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  config?: AppConfig;
  unreadKeys?: ReadonlySet<string>;
  onMarkAsRead?: (publicationKey: string) => void;
}

function getCategoryPresentation(categoria?: string, tag?: string) {
  const cat = (categoria || tag || '').toLowerCase();
  if (cat.includes('urgente')) {
    return {
      label: categoria || tag || 'Urgente',
      textColor: 'text-[#BE123C]',
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />,
    };
  }
  if (cat.includes('tarea') || cat.includes('deber')) {
    return {
      label: categoria || tag || 'Tarea',
      textColor: 'text-[#B45309]',
      icon: <ClipboardList className="w-3.5 h-3.5 text-[#D97706]" />,
    };
  }
  if (cat.includes('clase') || cat.includes('actividad')) {
    return {
      label: categoria || tag || 'En Clase',
      textColor: 'text-[#0F766E]',
      icon: <Palette className="w-3.5 h-3.5 text-[#0D9488]" />,
    };
  }
  if (cat.includes('aviso') || cat.includes('circular')) {
    return {
      label: categoria || tag || 'Aviso',
      textColor: 'text-[#BE123C]',
      icon: <Bell className="w-3.5 h-3.5 text-[#E11D48]" />,
    };
  }
  if (cat.includes('proyecto')) {
    return {
      label: categoria || tag || 'Proyecto',
      textColor: 'text-[#6D28D9]',
      icon: <Rocket className="w-3.5 h-3.5 text-[#7C3AED]" />,
    };
  }
  return {
    label: categoria || tag || 'General',
    textColor: 'text-[#4338CA]',
    icon: <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />,
  };
}

export const DiarioTab: React.FC<DiarioTabProps> = ({
  posts,
  onToggleTask,
  onSharePost,
  isRefreshing = false,
  onRefresh,
  config,
  unreadKeys,
  onMarkAsRead,
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) ?? null
    : null;

  useEffect(() => {
    if (!selectedPostId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPostId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPostId]);

  const handleOpenPost = (post: PostItem) => {
    const itemKey = getPublicationKey('diario', post);
    onMarkAsRead?.(itemKey);
    setSelectedPostId(post.id);
  };

  // Pull-to-refresh state (sincronizado con el contenedor scrollable <main>)
  const [pullY, setPullY] = useState(0);
  const pullYRef = useRef(0);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const isPulling = useRef(false);

  const getScrollTop = (target: EventTarget | null): number => {
    if (target instanceof HTMLElement) {
      const scrollParent = target.closest('main');
      if (scrollParent) return scrollParent.scrollTop;
    }
    if (typeof document !== 'undefined') {
      const mainEl = document.querySelector('main');
      if (mainEl) return mainEl.scrollTop;
    }
    return typeof window !== 'undefined' ? window.scrollY : 0;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isRefreshing || e.touches.length !== 1) return;
    if (getScrollTop(e.currentTarget) <= 1) {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isPulling.current || isRefreshing || e.touches.length !== 1) return;

    if (getScrollTop(e.currentTarget) > 1) {
      isPulling.current = false;
      if (pullYRef.current !== 0) {
        pullYRef.current = 0;
        setPullY(0);
      }
      return;
    }

    const currentY = e.touches[0].clientY;
    const currentX = e.touches[0].clientX;
    const diffY = currentY - touchStartY.current;
    const diffX = currentX - touchStartX.current;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
      isPulling.current = false;
      if (pullYRef.current !== 0) {
        pullYRef.current = 0;
        setPullY(0);
      }
      return;
    }

    if (diffY > 12) {
      const dampedPull = Math.min((diffY - 12) * 0.55, 100);
      pullYRef.current = dampedPull;
      setPullY(dampedPull);
    } else if (pullYRef.current !== 0) {
      pullYRef.current = 0;
      setPullY(0);
    }
  };

  const handleTouchEnd = async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    const finalPull = pullYRef.current;
    pullYRef.current = 0;

    if (finalPull > 64 && onRefresh && !isRefreshing) {
      setPullY(44);
      try {
        await onRefresh();
      } finally {
        setPullY(0);
      }
    } else {
      setPullY(0);
    }
  };

  const todayStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const capitalizedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  const filteredPosts = posts.filter((post) => {
    const catStr = (post.categoria || '').toLowerCase().trim();
    const tagStr = (post.tag || '').toLowerCase().trim();

    let matchesCategory = false;
    if (activeFilter === 'all') {
      matchesCategory = true;
    } else if (activeFilter === 'pending') {
      const isTask = catStr.includes('tarea') || catStr.includes('deber') || tagStr === 'tarea';
      matchesCategory = isTask && !post.completed;
    } else if (activeFilter === 'General') {
      matchesCategory = catStr.includes('general') || tagStr === 'general';
    } else if (activeFilter === 'Aviso') {
      // Excluir estrictamente publicaciones de categoría General
      if (catStr.includes('general')) {
        matchesCategory = false;
      } else {
        matchesCategory = catStr.includes('aviso') || catStr.includes('circular') || tagStr === 'aviso';
      }
    } else if (activeFilter === 'Tarea') {
      // Excluir estrictamente publicaciones de categoría General
      if (catStr.includes('general')) {
        matchesCategory = false;
      } else {
        matchesCategory = catStr.includes('tarea') || catStr.includes('deber') || tagStr === 'tarea';
      }
    } else if (activeFilter === 'Actividad') {
      // Excluir estrictamente publicaciones de categoría General
      if (catStr.includes('general')) {
        matchesCategory = false;
      } else {
        matchesCategory = catStr.includes('clase') || catStr.includes('actividad') || tagStr === 'actividad';
      }
    } else {
      matchesCategory = catStr === activeFilter.toLowerCase() || tagStr === activeFilter.toLowerCase();
    }

    const matchesSearch = matchesNormalizedSearch(searchQuery, [
      post.title,
      post.content,
      post.author,
      post.categoria,
      post.tag,
      post.date,
    ]);

    return matchesCategory && matchesSearch;
  });

  const pendingHomeworkCount = posts.filter((p) => {
    const cat = (p.categoria || p.tag || '').toLowerCase();
    const isTask = cat.includes('tarea') || cat.includes('deber');
    return isTask && !p.completed;
  }).length;

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
      className="space-y-4 pb-6 relative diario-fade-in"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {/* Indicador Pull-to-refresh */}
      {(pullY > 0 || isRefreshing) && (
        <div
          className="flex items-center justify-center py-2 transition-all duration-200 overflow-hidden text-xs text-[#4338CA] font-semibold"
          style={{ height: `${Math.max(pullY, isRefreshing ? 44 : 0)}px` }}
        >
          <div className="flex items-center gap-2 bg-[#EEF2FF] px-3.5 py-1.5 rounded-full border border-[#C7D2FE]">
            {isRefreshing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#4338CA]" />
                <span>Actualizando el diario...</span>
              </>
            ) : (
              <>
                <ArrowDown
                  className={`w-3.5 h-3.5 text-[#4338CA] transition-transform ${
                    pullY > 64 ? 'rotate-180' : ''
                  }`}
                />
                <span>
                  {pullY > 64 ? 'Suelta para actualizar' : 'Desliza para actualizar'}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1. Cabecera unificada de sección */}
      <SectionHeader
        eyebrow="Cuaderno de Aula"
        metaRight={capitalizedDate}
        title="Novedades y Diario de Clase"
        description="Consulta las novedades del aula, actividades realizadas y tareas pendientes para hacer en familia."
        icon={<BookOpen className="w-5 h-5" />}
        accent="indigo"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border diario-press cursor-pointer ${
                showSearch
                  ? 'bg-[#4338CA] text-white border-[#4338CA]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F7F8FA]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{showSearch ? 'Ocultar búsqueda' : 'Buscar'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Imprimir diario escolar"
              aria-label="Imprimir diario escolar"
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-white border border-[#E2E8F0] text-[#334155] hover:bg-[#F7F8FA] flex items-center justify-center gap-1.5 text-xs font-semibold diario-press cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </>
        }
        footerMeta={
          <span className="tabular-nums">
            {posts.length} {posts.length === 1 ? 'publicación' : 'publicaciones'}
          </span>
        }
      />

      {/* 2. Buscador */}
      {showSearch && (
        <div className="relative diario-slide-down">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en avisos, tareas o actividades..."
            className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-white border border-[#E2E8F0] rounded-2xl text-[14px] text-[#0F172A] placeholder:text-[#64748B] shadow-xs focus:border-[#4F46E5] transition"
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Borrar búsqueda"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 3. Recordatorio de tareas pendientes */}
      {pendingHomeworkCount > 0 && activeFilter !== 'pending' && (
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className="w-full text-left cursor-pointer bg-[#FEF3C7]/80 border border-[#FDE68A] rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:bg-[#FEF3C7] diario-press"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-white text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#0F172A] leading-snug">
                {pendingHomeworkCount === 1
                  ? 'Tienes 1 tarea pendiente para casa'
                  : `Tienes ${pendingHomeworkCount} tareas pendientes para casa`}
              </p>
              <p className="text-xs text-[#475569]">
                Toca aquí para verlas y marcarlas como completadas
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#92400E] shrink-0">
            Ver tareas
          </span>
        </button>
      )}

      {/* 4. Filtros por categoría */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 diario-press ${
            activeFilter === 'all'
              ? 'bg-[#4338CA] text-white shadow-xs'
              : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          Todos ({posts.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('General')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            activeFilter === 'General'
              ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeFilter === 'General' ? 'bg-white' : 'bg-[#4338CA]'
            }`}
          />
          <span>General</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('Aviso')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            activeFilter === 'Aviso'
              ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeFilter === 'Aviso' ? 'bg-white' : 'bg-[#E11D48]'
            }`}
          />
          <span>Avisos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('Tarea')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            activeFilter === 'Tarea'
              ? 'bg-[#D97706] text-white border-[#D97706] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeFilter === 'Tarea' ? 'bg-white' : 'bg-[#D97706]'
            }`}
          />
          <span>Tareas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('Actividad')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            activeFilter === 'Actividad'
              ? 'bg-[#0D9488] text-white border-[#0D9488] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              activeFilter === 'Actividad' ? 'bg-white' : 'bg-[#0D9488]'
            }`}
          />
          <span>En Clase</span>
        </button>
      </div>

      {/* 5. Feed de publicaciones */}
      <div className="space-y-3.5">
        {filteredPosts.length === 0 ? (
          <EmptyStateCard
            icon={<FileText className="w-6 h-6" />}
            title="No hay publicaciones en esta sección por el momento"
            description={
              activeFilter !== 'all' || searchQuery.trim() !== ''
                ? 'No hay publicaciones que coincidan con el filtro actual. Puedes ver todas las novedades escolares.'
                : 'Aquí aparecerán las novedades, tareas y actividades de la clase.'
            }
            actionLabel={
              activeFilter !== 'all' || searchQuery.trim() !== ''
                ? 'Ver todas las publicaciones'
                : undefined
            }
            onAction={
              activeFilter !== 'all' || searchQuery.trim() !== ''
                ? () => {
                    setActiveFilter('all');
                    setSearchQuery('');
                  }
                : undefined
            }
          />
        ) : (
          filteredPosts.map((post) => {
            const cat = (post.categoria || post.tag || '').toLowerCase();
            const isHomework = cat.includes('tarea') || cat.includes('deber');
            const isCompleted = post.completed ?? false;
            const catMeta = getCategoryPresentation(post.categoria, post.tag);
            const itemKey = getPublicationKey('diario', post);
            const isUnread = Boolean(unreadKeys?.has(itemKey));

            return (
              <article
                key={post.id}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.getSelection()?.toString().trim()) {
                    return;
                  }
                  handleOpenPost(post);
                }}
                className={`diario-card rounded-3xl p-4 sm:p-5 space-y-3 transition hover:border-[#C7D2FE] hover:shadow-sm cursor-pointer ${
                  isHomework && isCompleted
                    ? 'border-teal-200 bg-[#F0FDFA]/35'
                    : post.destacado
                    ? 'border-[#C7D2FE]'
                    : ''
                }`}
              >
                {/* Metadatos limpios sin píldoras */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className={`font-bold inline-flex items-center gap-1.5 ${catMeta.textColor}`}>
                      {catMeta.icon}
                      <span>{catMeta.label}</span>
                    </span>

                    {isUnread && (
                      <NewBadge variant={post.important ? 'coral' : 'indigo'} />
                    )}

                    {post.destacado && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-[#B45309]">
                          <Sparkles className="w-3 h-3 text-[#D97706]" />
                          Destacado
                        </span>
                      </>
                    )}

                    {post.important && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">
                          ·
                        </span>
                        <span className="inline-flex items-center gap-1 font-bold text-[#BE123C]">
                          <AlertCircle className="w-3 h-3 text-[#E11D48]" />
                          Urgente
                        </span>
                      </>
                    )}
                  </div>

                  <span className="text-xs text-[#475569] font-medium tabular-nums shrink-0">
                    {post.date}
                  </span>
                </div>

                {/* Título */}
                <h3
                  className={`font-display font-bold text-[16px] leading-snug ${
                    isHomework && isCompleted
                      ? 'line-through text-[#64748B]'
                      : 'text-[#0F172A]'
                  }`}
                >
                  {post.title}
                </h3>

                {/* Imagen adjunta opcional */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] aspect-video max-h-64 bg-[#F1F5F9]">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Contenido */}
                <FormattedText
                  text={post.content}
                  accent={post.important ? 'coral' : 'indigo'}
                />

                {/* Interacción de checklist para tareas */}
                {isHomework && (
                  <div
                    className={`rounded-2xl border px-3.5 py-2 flex items-center justify-between gap-3 ${
                      isCompleted
                        ? 'bg-[#F0FDFA] border-teal-200'
                        : 'bg-[#FEF3C7]/60 border-[#FDE68A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTaskCheck(post.id, post.completed);
                        onMarkAsRead?.(itemKey);
                      }}
                      className={`min-h-[40px] flex items-center gap-2 text-xs font-bold cursor-pointer ${
                        isCompleted ? 'text-[#0F766E]' : 'text-[#92400E]'
                      }`}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span>Tarea completada en casa</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span>Marcar tarea como realizada</span>
                        </>
                      )}
                    </button>

                    {isCompleted && (
                      <span className="text-xs font-bold text-[#0F766E] flex items-center gap-1 shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        Listo
                      </span>
                    )}
                  </div>
                )}

                {/* Pie con autor, lectura individual y compartir */}
                <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2 text-xs text-[#475569]">
                  <span className="flex items-center gap-1.5 font-medium truncate min-w-0">
                    <UserCheck className="w-4 h-4 text-[#4338CA] shrink-0" />
                    <span className="truncate">{post.author}</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {isUnread && (
                      <MarkAsReadButton
                        compact
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkAsRead?.(itemKey);
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsRead?.(itemKey);
                        onSharePost(post);
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#334155] hover:text-[#4338CA] hover:bg-[#EEF2FF] flex items-center gap-1.5 cursor-pointer shrink-0 diario-press"
                      title="Compartir o copiar aviso"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Compartir</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 6. Pie informativo de tutoría */}
      {config && (
        <footer className="mt-4 bg-[#F1F5F9] border border-[#E2E8F0] rounded-3xl p-4 text-xs space-y-1.5 text-[#334155]">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <School className="w-4 h-4 text-[#4338CA]" />
              El Diario del Aula – 1.º B
            </span>
            <span className="text-xs text-[#475569] font-medium">
              Tutoría: <strong className="text-[#0F172A]">{config.teacherName}</strong>
            </span>
          </div>
          <p className="text-xs text-[#475569] pt-1.5 border-t border-[#E2E8F0]">
            Diario digital de aula y herramienta personal de tutoría para el seguimiento diario del grupo.
          </p>
        </footer>
      )}

      {/* Ficha detallada de publicación del diario */}
      {selectedPost && (() => {
        const detailMeta = getCategoryPresentation(selectedPost.categoria, selectedPost.tag);
        const detailCat = (selectedPost.categoria || selectedPost.tag || '').toLowerCase();
        const detailIsHomework = detailCat.includes('tarea') || detailCat.includes('deber');
        const detailCompleted = selectedPost.completed ?? false;
        const detailKey = getPublicationKey('diario', selectedPost);

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="diario-detail-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs diario-fade-in"
            onClick={() => setSelectedPostId(null)}
          >
            <div
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#E2E8F0] shadow-xl max-h-[85dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 pt-5 pb-4 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className={`font-bold inline-flex items-center gap-1.5 ${detailMeta.textColor}`}>
                      {detailMeta.icon}
                      <span>{detailMeta.label}</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-[#475569] font-medium tabular-nums">
                      {selectedPost.date}
                    </span>
                  </div>
                  <h3
                    id="diario-detail-title"
                    className="font-display font-bold text-lg sm:text-xl text-[#0F172A] leading-snug"
                  >
                    {selectedPost.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  aria-label="Cerrar publicación"
                  className="w-11 h-11 rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center justify-center shrink-0 cursor-pointer diario-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto">
                {selectedPost.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] aspect-video max-h-64 bg-[#F1F5F9]">
                    <img
                      src={selectedPost.imageUrl}
                      alt={selectedPost.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <FormattedText
                  text={selectedPost.content}
                  size="base"
                  accent={selectedPost.important ? 'coral' : 'indigo'}
                />

                {detailIsHomework && (
                  <div
                    className={`rounded-2xl border px-3.5 py-2 flex items-center justify-between gap-3 ${
                      detailCompleted
                        ? 'bg-[#F0FDFA] border-teal-200'
                        : 'bg-[#FEF3C7]/60 border-[#FDE68A]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        handleTaskCheck(selectedPost.id, selectedPost.completed);
                        onMarkAsRead?.(detailKey);
                      }}
                      className={`min-h-[40px] flex items-center gap-2 text-xs font-bold cursor-pointer ${
                        detailCompleted ? 'text-[#0F766E]' : 'text-[#92400E]'
                      }`}
                    >
                      {detailCompleted ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#0D9488] shrink-0" />
                          <span>Tarea completada en casa</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-4 h-4 text-[#D97706] shrink-0" />
                          <span>Marcar tarea como realizada</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-[#F1F5F9] bg-[#F7F8FA]/60 flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => onSharePost(selectedPost)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold text-[#334155] hover:text-[#4338CA] hover:bg-[#EEF2FF] flex items-center gap-1.5 cursor-pointer diario-press"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPostId(null)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold text-sm cursor-pointer diario-press"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
