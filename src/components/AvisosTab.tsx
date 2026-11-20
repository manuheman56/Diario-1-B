import React, { useState } from 'react';
import { AvisoItem, Notice } from '../types';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import { SectionHeader } from './SectionHeader';
import { EmptyStateCard } from './EmptyStateCard';
import { FormattedText } from './FormattedText';
import { NewBadge, MarkAsReadButton } from './NewBadge';
import { getPublicationKey } from '../utils/readStatusService';
import {
  Bell,
  Search,
  Share2,
  AlertCircle,
  FileText,
  UserCheck,
  Printer,
  Calendar,
  ExternalLink,
  Pin,
  X,
} from 'lucide-react';

interface AvisosTabProps {
  avisos?: AvisoItem[];
  posts?: Notice[];
  onSharePost: (item: { title: string; content: string }) => void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
  unreadKeys?: ReadonlySet<string>;
  onMarkAsRead?: (publicationKey: string) => void;
}

export const AvisosTab: React.FC<AvisosTabProps> = ({
  avisos,
  posts = [],
  onSharePost,
  unreadKeys,
  onMarkAsRead,
}) => {
  const [filter, setFilter] = useState<'all' | 'urgente' | 'general' | 'actividad'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Normalizar avisos desde pestaña AVISOS o fallback a posts
  const normalizedAvisos =
    avisos && avisos.length > 0
      ? avisos.map((a) => ({
          id: a.id,
          publicationKey: getPublicationKey('avisos', a),
          title: a.titulo,
          content: a.mensaje,
          date: a.fecha_publicacion,
          deadline: a.fecha_limite,
          important: a.important,
          tag: a.tipo || (a.important ? 'Urgente' : 'Aviso'),
          prioridad: a.prioridad,
          author: a.author || 'Manuel Herrera',
          link: a.enlace_url,
        }))
      : posts
          .filter((p) => {
            const cat = (p.categoria || p.tag || '').toLowerCase();
            return cat.includes('aviso') || cat.includes('circular') || cat.includes('urgente');
          })
          .map((p) => ({
            id: p.id,
            publicationKey: getPublicationKey('diario', p),
            title: p.title,
            content: p.content,
            date: p.date,
            deadline: undefined,
            important: p.important || p.tag === 'Urgente',
            tag: p.categoria || p.tag || 'Aviso',
            prioridad: p.important ? 'Alta' : 'Normal',
            author: p.author,
            link: p.enlace_url,
          }));

  const filteredNotices = normalizedAvisos.filter((post) => {
    const isUrgent = post.important || post.tag === 'Urgente' || post.prioridad === 'Alta';
    const matchesCategory =
      filter === 'all'
        ? true
        : filter === 'urgente'
        ? isUrgent
        : filter === 'general'
        ? !isUrgent && post.tag.toLowerCase().includes('aviso')
        : post.tag.toLowerCase().includes('actividad');

    const matchesSearch = matchesNormalizedSearch(searchQuery, [
      post.title,
      post.content,
      post.author,
      post.tag,
      post.prioridad,
      post.date,
      post.deadline,
    ]);

    return matchesCategory && matchesSearch;
  });

  const urgentCount = normalizedAvisos.filter(
    (p) => p.important || p.tag === 'Urgente' || p.prioridad === 'Alta'
  ).length;

  return (
    <div className="space-y-4 pb-6 diario-fade-in">
      {/* 1. Cabecera unificada */}
      <SectionHeader
        eyebrow="Tablón de Comunicaciones"
        metaRight={
          urgentCount > 0
            ? `${urgentCount} urgente${urgentCount > 1 ? 's' : ''}`
            : 'Al día'
        }
        title="Avisos y Notas del Aula"
        description="Notas informativas, recordatorios y comunicaciones de tutoría para las familias de 1.º B."
        icon={<Bell className="w-5 h-5" />}
        accent="coral"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border diario-press cursor-pointer ${
                showSearch
                  ? 'bg-[#E11D48] text-white border-[#E11D48]'
                  : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F7F8FA]'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{showSearch ? 'Ocultar búsqueda' : 'Buscar'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="Imprimir avisos"
              aria-label="Imprimir avisos"
              className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-white border border-[#E2E8F0] text-[#334155] hover:bg-[#F7F8FA] flex items-center justify-center gap-1.5 text-xs font-semibold diario-press cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </>
        }
        footerMeta={
          <span className="tabular-nums">
            {normalizedAvisos.length} {normalizedAvisos.length === 1 ? 'aviso' : 'avisos'}
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
            placeholder="Buscar en circulares y avisos..."
            className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-white border border-[#E2E8F0] rounded-2xl text-[14px] text-[#0F172A] placeholder:text-[#64748B] shadow-xs focus:border-[#E11D48] transition"
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

      {/* 3. Filtros */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 diario-press ${
            filter === 'all'
              ? 'bg-[#0F172A] text-white shadow-xs'
              : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          Todos ({normalizedAvisos.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('urgente')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            filter === 'urgente'
              ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              filter === 'urgente' ? 'bg-white' : 'bg-[#E11D48]'
            }`}
          />
          <span>Urgentes ({urgentCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('general')}
          className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-2 cursor-pointer shrink-0 diario-press ${
            filter === 'general'
              ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs'
              : 'bg-white text-[#334155] border-[#E2E8F0] hover:bg-[#F1F5F9]'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              filter === 'general' ? 'bg-white' : 'bg-[#4338CA]'
            }`}
          />
          <span>Generales</span>
        </button>
      </div>

      {/* 4. Listado de avisos */}
      <div className="space-y-3.5">
        {filteredNotices.length === 0 ? (
          <EmptyStateCard
            icon={<FileText className="w-6 h-6" />}
            title="No hay avisos en esta categoría"
            description="Las comunicaciones del aula aparecerán aquí cuando sean publicadas."
            actionLabel={
              filter !== 'all' || searchQuery.trim() !== ''
                ? 'Ver todos los avisos'
                : undefined
            }
            onAction={
              filter !== 'all' || searchQuery.trim() !== ''
                ? () => {
                    setFilter('all');
                    setSearchQuery('');
                  }
                : undefined
            }
          />
        ) : (
          filteredNotices.map((post) => {
            const isUrgent = post.important;
            const isUnread = Boolean(unreadKeys?.has(post.publicationKey));

            return (
              <article
                key={post.id}
                className={`diario-card rounded-3xl p-4 sm:p-5 space-y-3 ${
                  isUrgent
                    ? 'border-[#FECDD3] bg-[#FFF1F2]/55'
                    : ''
                }`}
              >
                {/* Cabecera de metadatos limpios */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isUrgent ? (
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#BE123C]">
                        <AlertCircle className="w-4 h-4 text-[#E11D48]" />
                        <span>Urgente · Importante</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#4338CA]">
                        <Pin className="w-3.5 h-3.5 text-[#4338CA]" />
                        <span>{post.tag}</span>
                      </span>
                    )}
                    {isUnread && (
                      <NewBadge variant={isUrgent ? 'coral' : 'indigo'} />
                    )}
                  </div>

                  <span className="text-xs text-[#475569] font-medium tabular-nums">
                    {post.date}
                  </span>
                </div>

                {/* Título */}
                <h3 className="font-display font-bold text-[16px] text-[#0F172A] leading-snug">
                  {post.title}
                </h3>

                {/* Fecha límite destacada cuando exista */}
                {post.deadline && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-bold tabular-nums">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Fecha límite: {post.deadline}</span>
                  </div>
                )}

                {/* Contenido */}
                <FormattedText
                  text={post.content}
                  accent={isUrgent ? 'coral' : 'indigo'}
                />

                {/* Enlace externo opcional */}
                {post.link && (
                  <div className="pt-1">
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        if (isUnread) onMarkAsRead?.(post.publicationKey);
                      }}
                      className="min-h-[44px] inline-flex items-center gap-2 text-xs font-bold text-[#BE123C] bg-white hover:bg-[#FFF1F2] px-4 py-2 rounded-xl border border-[#FECDD3] diario-press"
                    >
                      <span>Abrir enlace o documento</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {/* Pie con autor, lectura individual y compartir */}
                <div className="pt-2.5 border-t border-[#E2E8F0]/70 flex items-center justify-between flex-wrap gap-2 text-xs text-[#475569]">
                  <span className="flex items-center gap-1.5 font-medium truncate min-w-0">
                    <UserCheck className="w-4 h-4 text-[#E11D48] shrink-0" />
                    <span className="truncate">{post.author}</span>
                  </span>

                  <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                    {isUnread && (
                      <MarkAsReadButton
                        compact
                        onClick={() => onMarkAsRead?.(post.publicationKey)}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (isUnread) onMarkAsRead?.(post.publicationKey);
                        onSharePost({ title: post.title, content: post.content });
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold text-[#334155] hover:text-[#BE123C] hover:bg-white flex items-center gap-1.5 cursor-pointer shrink-0 diario-press"
                      title="Compartir o copiar comunicado"
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
    </div>
  );
};
