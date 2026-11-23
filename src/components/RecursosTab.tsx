import React, { useState, useMemo, useEffect } from 'react';
import { HomeLearningResource, HomeResourceCategory } from '../types';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import { toReadablePreviewText } from '../utils/textFormatUtils';
import { SectionHeader } from './SectionHeader';
import { EmptyStateCard } from './EmptyStateCard';
import { FormattedText } from './FormattedText';
import { NewBadge, MarkAsReadButton } from './NewBadge';
import { getPublicationKey } from '../utils/readStatusService';
import {
  BookOpen,
  Calculator,
  FileText,
  HeartHandshake,
  Search,
  ExternalLink,
  Download,
  Clock,
  Layers,
  Star,
  X,
  ChevronRight,
  Home,
} from 'lucide-react';

interface RecursosTabProps {
  resources?: HomeLearningResource[];
  isLoadedFromSheets?: boolean;
  unreadKeys?: ReadonlySet<string>;
  onMarkAsRead?: (publicationKey: string) => void;
}

interface CategoryConfig {
  id: HomeResourceCategory | 'all';
  label: string;
  icon: React.ReactNode;
  description: string;
  count: number;
}

/**
 * Extrae el tiempo recomendado únicamente cuando figura de forma explícita
 * en la descripción de la propuesta (sin inventar valores por defecto).
 */
function extractRecommendedTime(description?: string | null): string | null {
  if (!description || typeof description !== 'string') return null;
  const normalized = description.replace(/\s+/g, ' ').trim();

  const rangeMatch = normalized.match(
    /\b(\d{1,2})\s*(?:-|–|—|a|y)\s*(\d{1,2})\s*(minutos?|min\.?)\b/i
  );
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]} min`;
  }

  const singleMatch = normalized.match(
    /\b(\d{1,2})\s*(minutos?|min\.?|horas?)\b/i
  );
  if (singleMatch) {
    const unit = singleMatch[2].toLowerCase().startsWith('h')
      ? singleMatch[1] === '1'
        ? 'hora'
        : 'horas'
      : 'min';
    return `${singleMatch[1]} ${unit}`;
  }

  if (/\bmedia hora\b/i.test(normalized)) return '30 min';
  if (/\bun cuarto de hora\b/i.test(normalized)) return '15 min';

  return null;
}

export const RecursosTab: React.FC<RecursosTabProps> = ({
  resources,
  unreadKeys,
  onMarkAsRead,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HomeResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [selectedResource, setSelectedResource] = useState<HomeLearningResource | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!selectedResource) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedResource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedResource]);

  const handleOpenResource = (item: HomeLearningResource) => {
    const itemKey = getPublicationKey('recursos', item);
    onMarkAsRead?.(itemKey);
    setSelectedResource(item);
  };

  const activeResources = useMemo(() => {
    return resources !== undefined ? resources : [];
  }, [resources]);

  // Compute category counts (exclusivamente Lengua, Matemáticas, Fichas y Familias)
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: activeResources.length,
      matematicas: 0,
      lengua_lectura: 0,
      fichas: 0,
      familias: 0,
    };
    activeResources.forEach((r) => {
      if (map[r.categoria] !== undefined) {
        map[r.categoria]++;
      }
    });
    return map;
  }, [activeResources]);

  const categories: CategoryConfig[] = [
    {
      id: 'all',
      label: 'Todas las ideas',
      icon: <Layers className="w-3.5 h-3.5" />,
      description: 'Propuestas sencillas para acompañar desde casa a vuestro ritmo',
      count: counts.all,
    },
    {
      id: 'matematicas',
      label: 'Matemáticas',
      icon: <Calculator className="w-3.5 h-3.5" />,
      description: 'Juegos cotidianos de números, cálculo y razonamiento lógico',
      count: counts.matematicas,
    },
    {
      id: 'lengua_lectura',
      label: 'Lengua y lectura',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      description: 'Lectura compartida, cuentos, vocabulario y gusto por escribir',
      count: counts.lengua_lectura,
    },
    {
      id: 'fichas',
      label: 'Fichas y materiales',
      icon: <FileText className="w-3.5 h-3.5" />,
      description: 'Materiales imprimibles y propuestas listas para descargar',
      count: counts.fichas,
    },
    {
      id: 'familias',
      label: 'Orientaciones familias',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      description: 'Hábitos tranquilos, acompañamiento afectivo y rutinas en casa',
      count: counts.familias,
    },
  ];

  const getCategoryMeta = (cat: HomeResourceCategory) => {
    switch (cat) {
      case 'matematicas':
        return {
          text: 'Matemáticas',
          color: 'text-[#0F766E]',
          iconBox: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
          icon: <Calculator className="w-5 h-5" strokeWidth={1.9} />,
        };
      case 'lengua_lectura':
        return {
          text: 'Lengua y lectura',
          color: 'text-[#4338CA]',
          iconBox: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80',
          icon: <BookOpen className="w-5 h-5" strokeWidth={1.9} />,
        };
      case 'fichas':
        return {
          text: 'Fichas y materiales',
          color: 'text-[#B45309]',
          iconBox: 'bg-[#FEF3C7]/75 text-[#B45309] border border-[#FDE68A]',
          icon: <FileText className="w-5 h-5" strokeWidth={1.9} />,
        };
      case 'familias':
        return {
          text: 'Orientaciones familias',
          color: 'text-[#6D28D9]',
          iconBox: 'bg-[#F5F3FF] text-[#7C3AED] border border-violet-200/80',
          icon: <HeartHandshake className="w-5 h-5" strokeWidth={1.9} />,
        };
      default:
        return {
          text: 'Propuesta familiar',
          color: 'text-[#0F766E]',
          iconBox: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
          icon: <Home className="w-5 h-5" strokeWidth={1.9} />,
        };
    }
  };

  const filteredList = useMemo(() => {
    return activeResources.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.categoria === selectedCategory;
      const matchesFeatured = !onlyFeatured || Boolean(item.destacado_casa);
      const badgeText = getCategoryMeta(item.categoria).text;
      const matchesSearch = matchesNormalizedSearch(searchQuery, [
        item.titulo,
        item.descripcion,
        item.tipo_recurso,
        item.nivel,
        item.asignatura,
        badgeText,
      ]);

      return matchesCategory && matchesFeatured && matchesSearch;
    });
  }, [activeResources, selectedCategory, onlyFeatured, searchQuery]);

  const activeCategoryMeta = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="space-y-4 pb-8 diario-fade-in">
      {/* 1. Cabecera acogedora de guía familiar */}
      <SectionHeader
        eyebrow="Guía de Orientación Familiar"
        metaRight="1.º de Primaria B"
        title="Ideas para acompañarles desde casa"
        description="Pequeñas propuestas para reforzar lo que aprendemos en clase, compartir momentos y descubrir que aprender también puede ser divertido. No necesitamos materiales especiales ni dedicar mucho tiempo; lo importante es disfrutar juntos."
        icon={<HeartHandshake className="w-5 h-5" />}
        accent="teal"
        footerMeta={
          <>
            <span className="tabular-nums text-[#0F766E] font-semibold">
              {activeResources.length}{' '}
              {activeResources.length === 1 ? 'propuesta disponible' : 'propuestas disponibles'}
            </span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>A vuestro ritmo, sin presión</span>
          </>
        }
      />

      {/* 2. Buscador y filtro rápido */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#475569] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar una idea por tema, lectura, juego o pauta..."
            className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-white rounded-2xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#64748B] shadow-xs focus:border-[#0D9488] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] cursor-pointer"
              aria-label="Borrar búsqueda"
              title="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Descripción activa + Recomendados */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <span className="text-xs text-[#475569] font-medium">
            {activeCategoryMeta?.description}
          </span>
          <button
            type="button"
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer diario-press whitespace-nowrap shrink-0 ${
              onlyFeatured
                ? 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                onlyFeatured ? 'fill-[#D97706] text-[#D97706]' : 'text-[#64748B]'
              }`}
            />
            <span>Recomendados de casa</span>
          </button>
        </div>
      </div>

      {/* 3. Selector de categorías */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
                isSelected
                  ? 'bg-[#0F766E] text-white shadow-xs'
                  : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-[#64748B]'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[#F1F5F9] text-[#475569]'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Rejilla de tarjetas compactas de guía familiar */}
      {filteredList.length === 0 ? (
        <EmptyStateCard
          icon={<Search className="w-6 h-6" />}
          title="No se han encontrado propuestas con estos criterios"
          description="Prueba a cambiar el texto de búsqueda o desactiva el filtro de recomendados."
          actionLabel="Restablecer filtros"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setOnlyFeatured(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map((item) => {
            const meta = getCategoryMeta(item.categoria);
            const itemKey = getPublicationKey('recursos', item);
            const isUnread = Boolean(unreadKeys?.has(itemKey));
            const recommendedTime = extractRecommendedTime(item.descripcion);
            const previewText = toReadablePreviewText(item.descripcion);
            const hasThumb = Boolean(item.imagen_url) && !failedImages[item.id];
            const subjectLabel = item.asignatura || meta.text;

            return (
              <article
                key={item.id}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.getSelection()?.toString().trim()) {
                    return;
                  }
                  handleOpenResource(item);
                }}
                className="diario-card rounded-3xl p-4 flex flex-col justify-between gap-3 hover:border-teal-300/90 hover:shadow-sm transition cursor-pointer"
              >
                <div className="space-y-2.5">
                  {/* Cabecera compacta: icono/miniatura discreta + asignatura/categoría + título */}
                  <div className="flex items-start gap-3">
                    {hasThumb && item.imagen_url ? (
                      <div className="w-11 h-11 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F7F8FA] shrink-0">
                        <img
                          src={item.imagen_url}
                          alt={item.titulo}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [item.id]: true }))
                          }
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${meta.iconBox}`}
                      >
                        {meta.icon}
                      </div>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap text-xs leading-none">
                        <span className={`font-bold ${meta.color} truncate`}>
                          {subjectLabel}
                        </span>
                        {item.destacado_casa && (
                          <Star
                            aria-label="Recomendado para casa"
                            className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706] shrink-0"
                          />
                        )}
                        {isUnread && <NewBadge variant="teal" />}
                      </div>

                      <h3 className="font-display font-bold text-[15.5px] text-[#0F172A] leading-snug line-clamp-2">
                        {item.titulo}
                      </h3>
                    </div>
                  </div>

                  {/* Breve introducción de un vistazo (sin bloques largos) */}
                  {previewText && (
                    <p className="text-[13.5px] text-[#475569] leading-relaxed line-clamp-2">
                      {previewText}
                    </p>
                  )}
                </div>

                {/* Pie limpio con tiempo recomendado (solo si figura en la descripción) y acceso a la guía */}
                <div className="pt-2.5 border-t border-[#F1F5F9] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-[#475569] font-medium min-w-0">
                    {recommendedTime ? (
                      <span className="inline-flex items-center gap-1 text-[#0F766E] font-semibold tabular-nums whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>{recommendedTime}</span>
                      </span>
                    ) : (
                      <span className="truncate text-[11.5px] text-[#64748B]">
                        {item.tipo_recurso}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
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
                        handleOpenResource(item);
                      }}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl text-xs font-bold text-[#0F766E] hover:bg-[#F0FDFA] inline-flex items-center gap-1 cursor-pointer diario-press whitespace-nowrap"
                    >
                      <span>Ver idea</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Nota cercana para familias */}
      <footer className="bg-[#F0FDFA]/80 border border-teal-200/80 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-xl bg-white border border-teal-200 flex items-center justify-center text-[#0D9488] shrink-0">
          <HeartHandshake className="w-4 h-4" />
        </span>
        <p className="text-xs sm:text-[13px] text-[#334155] leading-relaxed">
          <strong className="text-[#0F172A]">Acompañar sin prisas:</strong> En 1.º de Primaria unos pocos minutos compartidos desde el juego y la curiosidad valen mucho más que largas sesiones de ejercicios.
        </p>
      </footer>

      {/* Vista de detalle estilo guía práctica familiar */}
      {selectedResource && (() => {
        const detailMeta = getCategoryMeta(selectedResource.categoria);
        const detailDownloadable =
          selectedResource.tipo_recurso.toLowerCase().includes('pdf') ||
          selectedResource.tipo_recurso.toLowerCase().includes('imprimible') ||
          selectedResource.tipo_recurso.toLowerCase().includes('ficha');
        const detailKey = getPublicationKey('recursos', selectedResource);
        const detailTime = extractRecommendedTime(selectedResource.descripcion);
        const detailSubject = selectedResource.asignatura || detailMeta.text;
        const detailHasImage =
          Boolean(selectedResource.imagen_url) && !failedImages[selectedResource.id];

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurso-detail-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs diario-fade-in"
            onClick={() => setSelectedResource(null)}
          >
            <div
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#E2E8F0] shadow-xl max-h-[88dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

              {/* Cabecera limpia de la guía práctica */}
              <div className="px-5 pt-4 sm:pt-5 pb-4 border-b border-[#F1F5F9] flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${detailMeta.iconBox}`}
                  >
                    {detailMeta.icon}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs font-medium text-[#475569]">
                      <span className={`font-bold ${detailMeta.color}`}>
                        {detailSubject}
                      </span>
                      {detailMeta.text !== detailSubject && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span>{detailMeta.text}</span>
                        </>
                      )}
                      {selectedResource.destacado_casa && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="inline-flex items-center gap-1 font-bold text-[#B45309]">
                            <Star className="w-3 h-3 fill-[#D97706] text-[#D97706]" />
                            <span>Recomendado</span>
                          </span>
                        </>
                      )}
                    </div>
                    <h3
                      id="recurso-detail-title"
                      className="font-display font-bold text-lg sm:text-xl text-[#0F172A] leading-snug text-balance"
                    >
                      {selectedResource.titulo}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  aria-label="Cerrar detalle del recurso"
                  className="w-11 h-11 rounded-xl bg-[#F7F8FA] border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center justify-center shrink-0 cursor-pointer diario-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cuerpo de guía práctica */}
              <div className="px-5 py-4 space-y-4 overflow-y-auto">
                {/* Tiempo recomendado (solo cuando exista en la descripción) y tipo */}
                {(detailTime || selectedResource.tipo_recurso) && (
                  <div className="flex items-center gap-3 flex-wrap text-xs text-[#475569]">
                    {detailTime && (
                      <span className="inline-flex items-center gap-1.5 font-bold text-[#0F766E] tabular-nums">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>Tiempo recomendado: {detailTime}</span>
                      </span>
                    )}
                    {detailTime && selectedResource.tipo_recurso && (
                      <span aria-hidden="true" className="text-slate-300">·</span>
                    )}
                    {selectedResource.tipo_recurso && (
                      <span className="font-medium text-[#475569]">
                        {selectedResource.tipo_recurso}
                      </span>
                    )}
                    {selectedResource.nivel && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="font-medium text-[#475569]">
                          {selectedResource.nivel}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {detailHasImage && selectedResource.imagen_url && (
                  <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F7F8FA] aspect-[16/9] max-h-48">
                    <img
                      src={selectedResource.imagen_url}
                      alt={selectedResource.titulo}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [selectedResource.id]: true,
                        }))
                      }
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Bloque principal: ¿Qué podemos hacer en casa? */}
                <div className="bg-[#F7F8FA] border border-[#E2E8F0] rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-display text-xs font-bold text-[#0F766E] flex items-center gap-1.5">
                    <Home className="w-3.5 h-3.5 shrink-0" />
                    <span>¿Qué podemos hacer en casa?</span>
                  </h4>
                  <FormattedText
                    text={selectedResource.descripcion}
                    size="base"
                    accent="teal"
                  />
                </div>
              </div>

              {/* Pie con acción externa opcional y cierre */}
              <div className="px-5 py-3.5 border-t border-[#F1F5F9] bg-[#F7F8FA]/60 flex items-center justify-end gap-2.5 flex-wrap">
                {selectedResource.url_recurso && (
                  <a
                    href={selectedResource.url_recurso}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onMarkAsRead?.(detailKey)}
                    className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#F0FDFA] hover:bg-teal-100 text-[#0F766E] border border-teal-200 diario-press cursor-pointer"
                  >
                    {detailDownloadable ? (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar material</span>
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir recurso</span>
                      </>
                    )}
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F766E] hover:bg-[#115E59] text-white font-bold text-sm cursor-pointer diario-press"
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
