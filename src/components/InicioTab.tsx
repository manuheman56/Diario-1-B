import React, { useState } from 'react';
import {
  AppConfig,
  CalendarEvent,
  Notice,
  MainTabType,
  SubResourceTab,
  SubScheduleTab,
  AvisoItem,
} from '../types';
import {
  Home,
  BookOpen,
  Bell,
  Calendar,
  Clock,
  Camera,
  Sparkles,
  GraduationCap,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  Palette,
  Rocket,
  Image as ImageIcon,
  ChevronRight,
} from 'lucide-react';
import { initialConfig } from '../data/defaultData';
import { getUpcomingCalendarEvents } from '../utils/eventUtils';
import { toReadablePreviewText } from '../utils/textFormatUtils';
import { UnreadCountsBySection } from '../utils/readStatusService';

const SHORT_MONTH_NAMES = [
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

interface InicioTabProps {
  posts: Notice[];
  events: CalendarEvent[];
  avisos?: AvisoItem[];
  unreadCounts?: UnreadCountsBySection;
  onNavigate: (tab: MainTabType, subTab?: SubScheduleTab | SubResourceTab) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  config?: AppConfig;
}

interface QuickSectionCard {
  id: MainTabType;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBoxClass: string;
  accentTextClass: string;
  statusNote?: string;
  unreadBadge?: number;
  unreadBadgeClass?: string;
}

function getPostCategoryMeta(categoria?: string, tag?: string) {
  const cat = (categoria || tag || '').toLowerCase();
  if (cat.includes('urgente')) {
    return {
      icon: <AlertCircle className="w-3.5 h-3.5 text-[#E11D48]" />,
      label: categoria || tag || 'Urgente',
      color: 'text-[#BE123C]',
    };
  }
  if (cat.includes('tarea') || cat.includes('deber')) {
    return {
      icon: <ClipboardList className="w-3.5 h-3.5 text-[#D97706]" />,
      label: categoria || tag || 'Tarea',
      color: 'text-[#B45309]',
    };
  }
  if (cat.includes('clase') || cat.includes('actividad')) {
    return {
      icon: <Palette className="w-3.5 h-3.5 text-[#0D9488]" />,
      label: categoria || tag || 'En Clase',
      color: 'text-[#0F766E]',
    };
  }
  if (cat.includes('aviso') || cat.includes('circular')) {
    return {
      icon: <Bell className="w-3.5 h-3.5 text-[#E11D48]" />,
      label: categoria || tag || 'Aviso',
      color: 'text-[#BE123C]',
    };
  }
  if (cat.includes('proyecto')) {
    return {
      icon: <Rocket className="w-3.5 h-3.5 text-[#7C3AED]" />,
      label: categoria || tag || 'Proyecto',
      color: 'text-[#6D28D9]',
    };
  }
  return {
    icon: <BookOpen className="w-3.5 h-3.5 text-[#4338CA]" />,
    label: categoria || tag || 'General',
    color: 'text-[#4338CA]',
  };
}

export const InicioTab: React.FC<InicioTabProps> = ({
  posts,
  events,
  avisos,
  unreadCounts,
  onNavigate,
  isRefreshing = false,
  onRefresh,
  config = initialConfig,
}) => {
  const [mascotImgError, setMascotImgError] = useState(false);
  const [coverImgError, setCoverImgError] = useState(false);

  const todayStr = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());
  const capitalizedDate = todayStr.charAt(0).toUpperCase() + todayStr.slice(1);

  const urgentAvisosCount =
    avisos && avisos.length > 0
      ? avisos.filter(
          (a) =>
            a.important ||
            a.tipo?.toLowerCase().includes('urgente') ||
            a.prioridad?.toLowerCase().includes('urgente') ||
            a.prioridad?.toLowerCase().includes('alta')
        ).length
      : posts.filter(
          (p) =>
            p.important ||
            (p.tag || '').toLowerCase() === 'urgente' ||
            (p.categoria || '').toLowerCase() === 'urgente'
        ).length;

  const urgentAviso = avisos?.find(
    (a) =>
      a.tipo?.toLowerCase().includes('urgente') ||
      a.prioridad?.toLowerCase().includes('urgente') ||
      a.prioridad?.toLowerCase().includes('alta')
  );

  const urgentPost = urgentAviso
    ? {
        id: urgentAviso.id,
        title: urgentAviso.titulo,
        content: urgentAviso.mensaje,
        date: urgentAviso.fecha_publicacion,
        targetTab: 'avisos' as MainTabType,
      }
    : (() => {
        const p = posts.find(
          (item) =>
            (item.tag || '').toLowerCase() === 'urgente' ||
            (item.categoria || '').toLowerCase() === 'urgente'
        );
        return p
          ? {
              id: p.id,
              title: p.title,
              content: p.content,
              date: p.date,
              targetTab: 'diario' as MainTabType,
            }
          : null;
      })();

  const pendingTasks = posts.filter((p) => p.tag === 'Tarea' && !p.completed);
  const recentPosts = posts.slice(0, 2);
  const nextEvents = getUpcomingCalendarEvents(events).slice(0, 2);

  const diarioUnread = unreadCounts?.diario ?? 0;
  const avisosUnread = unreadCounts?.avisos ?? 0;
  const calendarioUnread = unreadCounts?.calendario ?? 0;
  const multimediaUnread = unreadCounts?.multimedia ?? 0;
  const aprendemosUnread = unreadCounts?.aprendemos ?? 0;
  const recursosUnread = unreadCounts?.recursos ?? 0;

  const sections: QuickSectionCard[] = [
    {
      id: 'inicio',
      label: 'Inicio',
      subtitle: 'Portada del aula',
      icon: <Home className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#EEF2FF] text-[#4338CA]',
      accentTextClass: 'text-[#4338CA]',
      statusNote: 'Estás aquí',
    },
    {
      id: 'diario',
      label: 'Día a día',
      subtitle: 'Clase y tareas',
      icon: <BookOpen className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#EEF2FF] text-[#4338CA]',
      accentTextClass: 'text-[#4338CA]',
      statusNote:
        pendingTasks.length > 0
          ? `${pendingTasks.length} pendiente${pendingTasks.length > 1 ? 's' : ''}`
          : undefined,
      unreadBadge: diarioUnread > 0 ? diarioUnread : undefined,
      unreadBadgeClass: 'bg-[#4338CA] text-white',
    },
    {
      id: 'avisos',
      label: 'Avisos',
      subtitle: 'Circulares y notas',
      icon: <Bell className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#FFF1F2] text-[#E11D48]',
      accentTextClass: 'text-[#BE123C]',
      statusNote:
        urgentAvisosCount > 0
          ? `${urgentAvisosCount} urgente${urgentAvisosCount > 1 ? 's' : ''}`
          : undefined,
      unreadBadge: avisosUnread > 0 ? avisosUnread : undefined,
      unreadBadgeClass: 'bg-[#E11D48] text-white',
    },
    {
      id: 'calendario',
      label: 'Calendario',
      subtitle: 'Fechas y salidas',
      icon: <Calendar className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#FEF3C7] text-[#D97706]',
      accentTextClass: 'text-[#B45309]',
      unreadBadge: calendarioUnread > 0 ? calendarioUnread : undefined,
      unreadBadgeClass: 'bg-[#D97706] text-white',
    },
    {
      id: 'horario',
      label: 'Horario',
      subtitle: 'Lunes a viernes',
      icon: <Clock className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#F0FDFA] text-[#0D9488]',
      accentTextClass: 'text-[#0F766E]',
    },
    {
      id: 'multimedia',
      label: 'Multimedia',
      subtitle: 'Fotos y vídeos',
      icon: <Camera className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#EEF2FF] text-[#4338CA]',
      accentTextClass: 'text-[#4338CA]',
      unreadBadge: multimediaUnread > 0 ? multimediaUnread : undefined,
      unreadBadgeClass: 'bg-[#4338CA] text-white',
    },
    {
      id: 'aprendemos',
      label: 'Aprendemos',
      subtitle: 'Qué trabajamos',
      icon: <Sparkles className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#F5F3FF] text-[#7C3AED]',
      accentTextClass: 'text-[#6D28D9]',
      unreadBadge: aprendemosUnread > 0 ? aprendemosUnread : undefined,
      unreadBadgeClass: 'bg-[#7C3AED] text-white',
    },
    {
      id: 'recursos',
      label: 'Recursos',
      subtitle: 'Apoyo en casa',
      icon: <GraduationCap className="w-5 h-5" strokeWidth={1.9} />,
      iconBoxClass: 'bg-[#F0FDFA] text-[#0D9488]',
      accentTextClass: 'text-[#0F766E]',
      unreadBadge: recursosUnread > 0 ? recursosUnread : undefined,
      unreadBadgeClass: 'bg-[#0D9488] text-white',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 pb-4 diario-fade-in">
      {/* A. CABECERA DE BIENVENIDA COMPACTA Y EDITORIAL */}
      <section
        aria-label="Cabecera de bienvenida del aula"
        className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs px-4 py-3.5 sm:px-5 sm:py-4"
      >
        <div className="flex items-center justify-between gap-3">
          {/* Mascota original de 1.º B + Identidad */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border border-[#E2E8F0] bg-white overflow-hidden shrink-0 flex items-center justify-center">
              {!mascotImgError ? (
                <img
                  src="/pwa-192x192.png"
                  alt="Mascota original de 1.º B Las Hormiguitas Laboriosas"
                  referrerPolicy="no-referrer"
                  onError={() => setMascotImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-[#4338CA] text-center leading-tight px-1">
                  1.º B
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4338CA] truncate">
                <span>1.º B</span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-[#475569] font-medium truncate">
                  {config.schoolYear || 'Curso 2026/27'}
                </span>
              </div>
              <h2 className="font-display font-bold text-[17px] sm:text-xl text-[#0F172A] leading-tight truncate">
                El Diario del Aula
              </h2>
              <p className="text-xs text-[#475569] truncate mt-0.5">
                {capitalizedDate}
              </p>
            </div>
          </div>

          {/* Acceso directo a notificaciones / avisos + actualizar */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('avisos')}
              aria-label={
                urgentAvisosCount > 0
                  ? `Ver notificaciones y avisos (${urgentAvisosCount} urgentes)`
                  : 'Ver avisos y notificaciones del aula'
              }
              title="Avisos y notificaciones"
              className="relative min-w-[44px] min-h-[44px] rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] hover:bg-[#FFF1F2] hover:border-[#FECDD3] text-[#334155] hover:text-[#E11D48] flex items-center justify-center diario-press cursor-pointer"
            >
              <Bell className="w-[18px] h-[18px]" strokeWidth={1.9} />
              {urgentAvisosCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#E11D48] text-white text-[10px] font-bold tabular-nums flex items-center justify-center ring-2 ring-white">
                  {urgentAvisosCount}
                </span>
              )}
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                aria-label="Actualizar contenido del aula"
                title="Actualizar contenido"
                className="min-w-[44px] min-h-[44px] sm:px-3 rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] hover:bg-[#EEF2FF] hover:border-[#C7D2FE] text-[#334155] hover:text-[#4338CA] flex items-center justify-center gap-1.5 text-xs font-semibold diario-press cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isRefreshing ? 'Actualizando' : 'Actualizar'}
                </span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* B. BLOQUE PRINCIPAL DE BIENVENIDA */}
      <section
        aria-labelledby="inicio-welcome-heading"
        className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Mensaje principal */}
          <div className="space-y-2 min-w-0 flex-1">
            <h3
              id="inicio-welcome-heading"
              className="font-display font-bold text-xl sm:text-[26px] text-[#0F172A] leading-snug tracking-tight text-balance"
            >
              ¡Bienvenidos a nuestra clase!
            </h3>
            <p className="text-[14px] sm:text-[15px] text-[#475569] leading-relaxed max-w-xl">
              Un espacio para acompañar cada día nuestro aprendizaje.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#475569]">
              <span>
                Tutoría:{' '}
                <strong className="font-semibold text-[#0F172A]">
                  {config.teacherName}
                </strong>
              </span>
              <span aria-hidden="true" className="text-slate-300">
                ·
              </span>
              <span className="truncate">Espacio personal de tutoría</span>
            </div>
          </div>

          {/* Ilustración de portada del aula 1.º B */}
          <div className="w-full sm:w-64 md:w-72 lg:w-80 shrink-0">
            {!coverImgError ? (
              <img
                src="/portada-aula-1b.png"
                alt="El Diario del Aula 1.º B: hormiguita junto a la pizarra del aula"
                referrerPolicy="no-referrer"
                onError={() => setCoverImgError(true)}
                className="w-full h-auto object-contain rounded-2xl border border-[#E2E8F0] block"
              />
            ) : (
              <div className="w-full aspect-[3/2] rounded-2xl border border-[#E2E8F0] bg-[#F7F8FA] flex flex-col items-center justify-center gap-1.5 text-center p-4">
                <ImageIcon className="w-5 h-5 text-[#4338CA]" strokeWidth={1.85} />
                <span className="text-xs font-semibold text-[#0F172A]">
                  El Diario del Aula · 1.º B
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Alertas dinámicas activas (avisos urgentes y tareas pendientes reales) */}
      {(urgentPost || pendingTasks.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {urgentPost && (
            <button
              type="button"
              onClick={() => onNavigate(urgentPost.targetTab || 'avisos')}
              className={`w-full min-h-[56px] text-left bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-3.5 flex items-center gap-3 hover:bg-[#FFE4E6]/75 diario-press cursor-pointer ${
                pendingTasks.length === 0 ? 'md:col-span-2' : ''
              }`}
            >
              <span className="w-10 h-10 rounded-xl bg-white text-[#E11D48] border border-[#FECDD3] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-[#BE123C]">Aviso importante</span>
                  <span aria-hidden="true" className="text-rose-300">
                    ·
                  </span>
                  <span className="text-[#9F1239] tabular-nums truncate">
                    {urgentPost.date}
                  </span>
                </div>
                <p className="font-display font-bold text-sm text-[#0F172A] mt-0.5 truncate">
                  {urgentPost.title}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#E11D48] shrink-0" />
            </button>
          )}

          {pendingTasks.length > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('diario')}
              className={`w-full min-h-[56px] text-left bg-[#FEF3C7]/75 border border-[#FDE68A] rounded-2xl p-3.5 flex items-center justify-between gap-3 hover:bg-[#FEF3C7] diario-press cursor-pointer ${
                !urgentPost ? 'md:col-span-2' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-white text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-[#0F172A] leading-snug truncate">
                    {pendingTasks.length === 1
                      ? '1 tarea pendiente para casa'
                      : `${pendingTasks.length} tareas pendientes para casa`}
                  </p>
                  <p className="text-xs text-[#475569] truncate">
                    Pulsa para ver y marcar al terminar
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-[#B45309] shrink-0" />
            </button>
          )}
        </div>
      )}

      {/* C. EXPLORA NUESTRA AULA (8 SECCIONES OFICIALES EN 2 COLUMNAS EN MÓVIL) */}
      <section aria-labelledby="explora-aula-heading" className="space-y-3">
        <div className="px-0.5">
          <h3
            id="explora-aula-heading"
            className="font-display font-bold text-[17px] sm:text-lg text-[#0F172A] tracking-tight"
          >
            Explora nuestra aula
          </h3>
          <p className="text-xs sm:text-[13px] text-[#475569] mt-0.5">
            Todo lo que necesitas, a un toque.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {sections.map((section) => {
            const isCurrent = section.id === 'inicio';
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => onNavigate(section.id)}
                aria-current={isCurrent ? 'page' : undefined}
                className={`min-h-[96px] p-3.5 sm:p-4 rounded-2xl text-left flex flex-col justify-between gap-2.5 cursor-pointer touch-manipulation diario-press transition-colors ${
                  isCurrent
                    ? 'bg-white border border-[#C7D2FE] shadow-xs'
                    : 'diario-card-interactive'
                }`}
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${section.iconBoxClass}`}
                  >
                    {section.icon}
                  </div>
                  {section.unreadBadge !== undefined && section.unreadBadge > 0 ? (
                    <span
                      aria-label={`${section.unreadBadge} ${section.unreadBadge === 1 ? 'novedad sin leer' : 'novedades sin leer'}`}
                      className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-bold tabular-nums inline-flex items-center justify-center shrink-0 shadow-2xs ${
                        section.unreadBadgeClass || 'bg-[#4338CA] text-white'
                      }`}
                    >
                      {section.unreadBadge}
                    </span>
                  ) : section.statusNote ? (
                    <span
                      className={`text-[11px] font-semibold truncate text-right ${section.accentTextClass}`}
                    >
                      {section.statusNote}
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 w-full">
                  <span className="font-display font-bold text-[14px] text-[#0F172A] block truncate leading-snug">
                    {section.label}
                  </span>
                  <span className="text-xs text-[#475569] block truncate mt-0.5 leading-tight">
                    {section.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* D. CONTENIDO DINÁMICO (ÚLTIMAS NOVEDADES Y PRÓXIMOS ACONTECIMIENTOS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        <section className="lg:col-span-7 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-display font-bold text-base text-[#0F172A] tracking-tight">
              Últimas novedades de clase
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('diario')}
              className="min-h-[44px] px-2 -mr-2 text-xs font-bold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs p-5 text-center space-y-1">
                <p className="font-display font-bold text-sm text-[#0F172A]">
                  No hay publicaciones recientes
                </p>
                <p className="text-xs text-[#475569]">
                  Las actividades, tareas y notas del aula se mostrarán aquí en cuanto se publiquen.
                </p>
              </div>
            ) : (
              recentPosts.map((post) => {
                const catMeta = getPostCategoryMeta(post.categoria, post.tag);
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => onNavigate('diario')}
                    className="w-full min-h-[44px] text-left p-4 rounded-2xl diario-card-interactive diario-press cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                        <span className={`font-bold flex items-center gap-1.5 ${catMeta.color}`}>
                          {catMeta.icon}
                          <span>{catMeta.label}</span>
                        </span>
                        {post.destacado && (
                          <>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="font-semibold text-[#B45309]">
                              Destacado
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-xs text-[#475569] font-medium tabular-nums shrink-0">
                        {post.date}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-[15px] text-[#0F172A] leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-[13.5px] text-[#475569] line-clamp-2 leading-relaxed">
                      {toReadablePreviewText(post.content)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="lg:col-span-5 space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h3 className="font-display font-bold text-base text-[#0F172A] tracking-tight">
              Próximos acontecimientos
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('calendario')}
              className="min-h-[44px] px-2 -mr-2 text-xs font-bold text-[#4338CA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Calendario</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {nextEvents.length > 0 ? (
            <div className="space-y-2.5">
              {nextEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onNavigate('calendario')}
                  className="w-full min-h-[68px] text-left p-3.5 rounded-2xl diario-card-interactive diario-press flex items-center gap-3.5 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] flex flex-col items-center justify-center font-bold shrink-0 tabular-nums">
                    <span className="text-[10px] uppercase font-bold leading-none">
                      {SHORT_MONTH_NAMES[ev.month] ?? ''}
                    </span>
                    <span className="text-base font-extrabold leading-tight mt-0.5">
                      {ev.day}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display font-bold text-sm text-[#0F172A] truncate">
                      {ev.title}
                    </h4>
                    {ev.description && (
                      <p className="text-xs text-[#475569] leading-relaxed line-clamp-2 mt-0.5">
                        {toReadablePreviewText(ev.description)}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 text-center space-y-1">
              <p className="font-display font-bold text-sm text-[#0F172A]">
                Sin eventos próximos
              </p>
              <p className="text-xs text-[#475569]">
                Puedes consultar cualquier mes desde el Calendario Escolar.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Pie informativo de tutoría */}
      <footer className="pt-4 border-t border-[#E2E8F0] text-center space-y-1">
        <p className="text-xs font-semibold text-[#0F172A]">
          El Diario del Aula – 1.º B · {config.classTitle}
        </p>
        <p className="text-xs text-[#475569]">
          Espacio personal de tutoría para el seguimiento y la comunicación con las familias.
        </p>
      </footer>
    </div>
  );
};
