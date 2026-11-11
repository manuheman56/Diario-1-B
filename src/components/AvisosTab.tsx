import React, { useState } from 'react';
import { AvisoItem, Notice } from '../types';
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
} from 'lucide-react';

interface AvisosTabProps {
  avisos?: AvisoItem[];
  posts?: Notice[];
  onSharePost: (item: { title: string; content: string }) => void;
  isRefreshing?: boolean;
  onRefresh?: () => Promise<void> | void;
}

export const AvisosTab: React.FC<AvisosTabProps> = ({
  avisos,
  posts = [],
  onSharePost,
  isRefreshing = false,
  onRefresh,
}) => {
  const [filter, setFilter] = useState<'all' | 'urgente' | 'general' | 'actividad'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Normalizar avisos desde pestaña AVISOS o fallback a posts
  const normalizedAvisos =
    avisos && avisos.length > 0
      ? avisos.map((a) => ({
          id: a.id,
          title: a.titulo,
          content: a.mensaje,
          date: a.fecha_publicacion,
          deadline: a.fecha_limite,
          important: a.important,
          tag: a.tipo || (a.important ? 'Urgente' : 'Aviso'),
          prioridad: a.prioridad,
          author: a.author || 'Manuel Herrera',
          link: a.enlace_url,
          icon: a.important ? '🚨' : '📌',
        }))
      : posts
          .filter((p) => {
            const cat = (p.categoria || p.tag || '').toLowerCase();
            return cat.includes('aviso') || cat.includes('circular') || cat.includes('urgente');
          })
          .map((p) => ({
            id: p.id,
            title: p.title,
            content: p.content,
            date: p.date,
            deadline: undefined,
            important: p.important || p.tag === 'Urgente',
            tag: p.categoria || p.tag || 'Aviso',
            prioridad: p.important ? 'Alta' : 'Normal',
            author: p.author,
            link: p.enlace_url,
            icon: p.icon || '📌',
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

    const matchesSearch =
      searchQuery.trim() === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const urgentCount = normalizedAvisos.filter(
    (p) => p.important || p.tag === 'Urgente' || p.prioridad === 'Alta'
  ).length;

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-rose-700 via-rose-800 to-amber-800 rounded-3xl p-5 text-white shadow-lg shadow-rose-900/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-rose-100 backdrop-blur-md">
              <Bell className="w-3.5 h-3.5 text-rose-200" />
              Tablón de Comunicaciones
            </span>
            {urgentCount > 0 && (
              <span className="text-[11px] font-extrabold bg-white text-rose-900 px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                {urgentCount} urgente{urgentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <h2 className="font-display font-extrabold text-xl leading-tight">
            Avisos y Circulares del Aula
          </h2>
          <p className="text-xs text-rose-100/90 leading-relaxed max-w-sm">
            Comunicaciones del colegio, notas informativas, recordatorios y circulares oficiales
            de 1.º B.
          </p>

          {/* Quick Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSearch(!showSearch)}
              className="bg-white/15 hover:bg-white/25 text-white font-medium px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer backdrop-blur-xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{showSearch ? 'Ocultar búsqueda' : 'Buscar'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="Imprimir avisos"
              className="bg-white/15 hover:bg-white/25 text-white font-medium p-2 rounded-xl text-xs flex items-center justify-center transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Backdrop decorative icon */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
          <Bell className="w-44 h-44 text-white" />
        </div>
      </div>

      {/* 2. Search Container */}
      {showSearch && (
        <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar en circulares y avisos..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs shadow-xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 transition"
            autoFocus
          />
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Borrar
            </button>
          )}
        </div>
      )}

      {/* 3. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({normalizedAvisos.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('urgente')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            filter === 'urgente'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Urgentes ({urgentCount})
        </button>

        <button
          type="button"
          onClick={() => setFilter('general')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            filter === 'general'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          Generales
        </button>
      </div>

      {/* 4. Notices Feed */}
      <div className="space-y-3">
        {filteredNotices.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700">
                No hay avisos en esta categoría
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Las comunicaciones del aula aparecerán aquí cuando sean publicadas.
              </p>
            </div>
            {filter !== 'all' && (
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs text-rose-600 font-bold hover:underline cursor-pointer"
              >
                Ver todos los avisos
              </button>
            )}
          </div>
        ) : (
          filteredNotices.map((post) => {
            const isUrgent = post.important;

            return (
              <article
                key={post.id}
                className={`bg-white p-4.5 rounded-3xl border transition shadow-card space-y-2.5 ${
                  isUrgent
                    ? 'border-rose-300 ring-2 ring-rose-100 bg-rose-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isUrgent ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                        Urgente / Importante
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        <span>{post.icon}</span>
                        <span>{post.tag}</span>
                      </span>
                    )}

                    {post.deadline && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        <Calendar className="w-2.5 h-2.5" />
                        Límite: {post.deadline}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {post.date}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-slate-900 text-sm leading-snug">
                  {post.title}
                </h3>

                {/* Content */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Optional external link button */}
                {post.link && (
                  <div className="pt-1">
                    <a
                      href={post.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200 transition"
                    >
                      <span>Abrir enlace / documento</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Footer with Author and Share */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium text-slate-500 truncate mr-2">
                    <UserCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">{post.author}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => onSharePost({ title: post.title, content: post.content })}
                    className="hover:text-rose-600 font-medium transition flex items-center gap-1 cursor-pointer text-slate-500 hover:bg-slate-100 px-2.5 py-1 rounded-lg"
                    title="Compartir o copiar comunicado"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Compartir</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
