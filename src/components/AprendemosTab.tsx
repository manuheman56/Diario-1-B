import React, { useEffect, useMemo, useState } from 'react';
import { AprendemosCategory, EducationalResource } from '../types';
import {
  normalizeAprendemosTips,
  normalizeAprendemosCategory,
  APRENDEMOS_CATEGORY_LABELS,
} from '../services/sheetsService';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import { toReadablePreviewText } from '../utils/textFormatUtils';
import { SectionHeader } from './SectionHeader';
import { EmptyStateCard } from './EmptyStateCard';
import { FormattedText } from './FormattedText';
import { NewBadge, MarkAsReadButton } from './NewBadge';
import { getPublicationKey } from '../utils/readStatusService';
import {
  BookOpen,
  PenTool,
  Calculator,
  Palette,
  ExternalLink,
  Sparkles,
  School,
  Search,
  X,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';

interface AprendemosTabProps {
  resources?: EducationalResource[];
  unreadKeys?: ReadonlySet<string>;
  onMarkAsRead?: (publicationKey: string) => void;
}

function getCategoryAccent(cat: AprendemosCategory) {
  switch (cat) {
    case 'lectura':
      return {
        text: 'text-[#4338CA]',
        headerBg: 'bg-[#EEF2FF]/55',
        iconBox: 'bg-white text-[#4338CA] border border-[#C7D2FE]',
        bullet: 'bg-[#4338CA]',
        button: 'text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border-[#C7D2FE]',
        formattedAccent: 'indigo' as const,
        icon: <BookOpen className="w-4 h-4" />,
      };
    case 'escritura':
      return {
        text: 'text-[#0F766E]',
        headerBg: 'bg-[#F0FDFA]/70',
        iconBox: 'bg-white text-[#0D9488] border border-teal-200',
        bullet: 'bg-[#0D9488]',
        button: 'text-[#0F766E] bg-[#F0FDFA] hover:bg-teal-100 border-teal-200',
        formattedAccent: 'teal' as const,
        icon: <PenTool className="w-4 h-4" />,
      };
    case 'calculo':
      return {
        text: 'text-emerald-700',
        headerBg: 'bg-emerald-50/65',
        iconBox: 'bg-white text-emerald-700 border border-emerald-200',
        bullet: 'bg-emerald-600',
        button: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
        formattedAccent: 'teal' as const,
        icon: <Calculator className="w-4 h-4" />,
      };
    case 'talleres':
      return {
        text: 'text-[#B45309]',
        headerBg: 'bg-[#FEF3C7]/45',
        iconBox: 'bg-white text-[#B45309] border border-[#FDE68A]',
        bullet: 'bg-[#D97706]',
        button: 'text-[#92400E] bg-[#FEF3C7] hover:bg-amber-200/70 border-[#FDE68A]',
        formattedAccent: 'amber' as const,
        icon: <Palette className="w-4 h-4" />,
      };
  }
}

export const AprendemosTab: React.FC<AprendemosTabProps> = ({
  resources,
  unreadKeys,
  onMarkAsRead,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | AprendemosCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResource, setSelectedResource] = useState<EducationalResource | null>(null);
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

  const handleOpenResource = (res: EducationalResource) => {
    const itemKey = getPublicationKey('aprendemos', res);
    onMarkAsRead?.(itemKey);
    setSelectedResource(res);
  };

  const activeList = useMemo(
    () => (resources !== undefined ? resources : []),
    [resources]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<AprendemosCategory, number> = {
      lectura: 0,
      escritura: 0,
      calculo: 0,
      talleres: 0,
    };
    activeList.forEach((res) => {
      const catKey = normalizeAprendemosCategory(res.categoria || res.category);
      counts[catKey]++;
    });
    return counts;
  }, [activeList]);

  const filteredResources = activeList.filter((res) => {
    const normalizedTips = normalizeAprendemosTips(res.tips, res.description);
    const itemCategory = normalizeAprendemosCategory(res.categoria || res.category);
    const categoryLabel = APRENDEMOS_CATEGORY_LABELS[itemCategory];
    const matchesCategory =
      activeCategory === 'all' || itemCategory === activeCategory;
    const matchesSearch = matchesNormalizedSearch(searchQuery, [
      res.title,
      res.description,
      normalizedTips,
      categoryLabel,
      res.badge,
      res.level,
    ]);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-4 pb-8 diario-fade-in">
      {/* 1. Cabecera didáctica */}
      <SectionHeader
        eyebrow="Ventana a Nuestro Aprendizaje"
        metaRight="1.º de Primaria B"
        title="¿Qué estamos trabajando en clase?"
        description="Contenidos curriculares, proyectos activos y pautas prácticas para acompañar desde casa lo que trabajamos día a día con El profe Manolo."
        icon={<School className="w-5 h-5" />}
        accent="violet"
        footerMeta={
          <>
            <span className="font-semibold text-[#7C3AED]">Curso escolar 2026/27</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="tabular-nums">
              {activeList.length} {activeList.length === 1 ? 'ficha didáctica' : 'fichas didácticas'}
            </span>
          </>
        }
      />

      {/* 2. Buscador y selector de ámbitos curriculares */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#475569] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar contenidos, proyectos o pautas de clase..."
            className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-white rounded-2xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#64748B] shadow-xs focus:border-[#7C3AED] transition"
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

        {/* Botones de ámbitos oficiales (4 categorías oficiales + Todos) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
              activeCategory === 'all'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <span>Todos los ámbitos</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeCategory === 'all'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {activeList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('lectura')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
              activeCategory === 'lectura'
                ? 'bg-[#4338CA] text-white shadow-xs'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.lectura}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeCategory === 'lectura'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {categoryCounts.lectura}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('escritura')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
              activeCategory === 'escritura'
                ? 'bg-[#0D9488] text-white shadow-xs'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.escritura}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeCategory === 'escritura'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {categoryCounts.escritura}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('calculo')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
              activeCategory === 'calculo'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.calculo}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeCategory === 'calculo'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {categoryCounts.calculo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('talleres')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation shrink-0 diario-press ${
              activeCategory === 'talleres'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F1F5F9]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.talleres}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-full tabular-nums ${
                activeCategory === 'talleres'
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F1F5F9] text-[#475569]'
              }`}
            >
              {categoryCounts.talleres}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Boletines y fichas estructuradas de aprendizaje */}
      {filteredResources.length === 0 ? (
        <EmptyStateCard
          icon={<School className="w-6 h-6" />}
          title={
            searchQuery.trim()
              ? 'No se encontraron aprendizajes con esa búsqueda'
              : 'No hay contenidos en esta categoría'
          }
          description={
            searchQuery.trim()
              ? 'Prueba con otras palabras o limpia la búsqueda actual.'
              : 'Prueba a seleccionar otro ámbito de aprendizaje.'
          }
          actionLabel={
            activeCategory !== 'all' || searchQuery.trim() !== ''
              ? 'Ver todos los ámbitos'
              : undefined
          }
          onAction={
            activeCategory !== 'all' || searchQuery.trim() !== ''
              ? () => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          {filteredResources.map((res) => {
            const displayTips = normalizeAprendemosTips(res.tips, res.description);
            const previewTips = displayTips.slice(0, 3);
            const extraTipsCount = displayTips.length - previewTips.length;
            const itemCategory = normalizeAprendemosCategory(res.categoria || res.category);
            const categoryLabel = APRENDEMOS_CATEGORY_LABELS[itemCategory];
            const accent = getCategoryAccent(itemCategory);
            const itemKey = getPublicationKey('aprendemos', res);
            const isUnread = Boolean(unreadKeys?.has(itemKey));
            const hasImage = Boolean(res.imagen_url) && !failedImages[res.id];

            return (
              <article
                key={res.id}
                onClick={() => {
                  if (typeof window !== 'undefined' && window.getSelection()?.toString().trim()) {
                    return;
                  }
                  handleOpenResource(res);
                }}
                className="diario-card rounded-3xl overflow-hidden flex flex-col transition hover:border-[#DDD6FE] hover:shadow-sm cursor-pointer"
              >
                {/* Banda superior pedagógica: Área / Asignatura + Nivel */}
                <div
                  className={`px-4 sm:px-5 py-3 border-b border-[#E2E8F0]/80 flex items-center justify-between gap-2.5 ${accent.headerBg}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${accent.iconBox}`}
                    >
                      {accent.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-xs font-bold ${accent.text} truncate`}>
                          {categoryLabel}
                        </span>
                        {isUnread && <NewBadge variant="violet" />}
                      </div>
                      <p className="text-[11.5px] text-[#475569] font-medium truncate">
                        {res.badge || 'Contenido de Aula'}
                        {res.level ? ` · ${res.level}` : ''}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cuerpo estructurado de la ficha didáctica */}
                <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Título del contenido */}
                    <h3 className="font-display font-bold text-[17px] text-[#0F172A] leading-snug text-balance">
                      {res.title}
                    </h3>

                    {/* Imagen o material ilustrativo relacionado (solo si existe) */}
                    {hasImage && res.imagen_url && (
                      <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F7F8FA] aspect-[16/9] max-h-48">
                        <img
                          src={res.imagen_url}
                          alt={res.title}
                          referrerPolicy="no-referrer"
                          onError={() =>
                            setFailedImages((prev) => ({ ...prev, [res.id]: true }))
                          }
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    {/* Bloque estructurado: Qué estamos aprendiendo */}
                    <div className="space-y-1.5">
                      <p className="text-[11.5px] font-bold text-[#475569] flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#7C3AED] shrink-0" />
                        <span>Qué estamos aprendiendo</span>
                      </p>
                      <p className="text-[14px] text-[#334155] leading-relaxed line-clamp-4">
                        {toReadablePreviewText(res.description)}
                      </p>
                    </div>

                    {/* Claves y habilidades trabajadas (compacto para no alargar en móvil) */}
                    {previewTips.length > 0 && (
                      <div className="pt-3 border-t border-[#F1F5F9] space-y-2">
                        <h4 className="text-[11.5px] font-bold text-[#0F172A]">
                          Claves del aprendizaje
                        </h4>
                        <ul className="flex flex-col gap-2 list-none p-0 m-0">
                          {previewTips.map((tip, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#334155]"
                            >
                              <span
                                aria-hidden="true"
                                className={`w-1.5 h-1.5 rounded-full shrink-0 mt-[0.52rem] ${accent.bullet}`}
                              />
                              <span className="min-w-0 flex-1 break-words line-clamp-2">
                                {tip}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {extraTipsCount > 0 && (
                          <p className="text-[11.5px] font-semibold text-[#6D28D9]">
                            + {extraTipsCount}{' '}
                            {extraTipsCount === 1
                              ? 'orientación adicional en la ficha'
                              : 'orientaciones adicionales en la ficha'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pie de la ficha didáctica */}
                  <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${accent.text}`}>
                      <span>Ver ficha completa</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isUnread && (
                        <MarkAsReadButton
                          compact
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead?.(itemKey);
                          }}
                        />
                      )}
                      {res.externalUrl && (
                        <a
                          href={res.externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkAsRead?.(itemKey);
                          }}
                          className={`min-h-[40px] inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border diario-press ${accent.button}`}
                        >
                          <span>{res.externalLabel || 'Material'}</span>
                          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 4. Referencia a Guía de Recursos para casa */}
      <div className="p-4 bg-[#F5F3FF]/70 border border-violet-200 rounded-3xl flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-white border border-violet-200 flex items-center justify-center text-[#7C3AED] shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <div className="space-y-0.5 text-xs leading-relaxed text-[#334155]">
          <strong className="block font-display text-sm text-[#0F172A]">
            ¿Quieres ideas prácticas para acompañar desde casa?
          </strong>
          <p>
            En la sección <strong>Recursos</strong> tienes propuestas breves y sencillas para compartir momentos de aprendizaje en familia.
          </p>
        </div>
      </div>

      {/* Ficha detallada del contenido de clase */}
      {selectedResource && (() => {
        const detailTips = normalizeAprendemosTips(
          selectedResource.tips,
          selectedResource.description
        );
        const detailCategory = normalizeAprendemosCategory(
          selectedResource.categoria || selectedResource.category
        );
        const detailLabel = APRENDEMOS_CATEGORY_LABELS[detailCategory];
        const detailAccent = getCategoryAccent(detailCategory);
        const detailKey = getPublicationKey('aprendemos', selectedResource);
        const detailHasImage =
          Boolean(selectedResource.imagen_url) && !failedImages[selectedResource.id];

        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="aprendemos-detail-title"
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs diario-fade-in"
            onClick={() => setSelectedResource(null)}
          >
            <div
              className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#E2E8F0] shadow-xl max-h-[88dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />
              <div className={`px-5 pt-4 sm:pt-5 pb-4 border-b border-[#E2E8F0]/80 flex items-start justify-between gap-3 ${detailAccent.headerBg}`}>
                <div className="flex items-start gap-3 min-w-0">
                  <span
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${detailAccent.iconBox}`}
                  >
                    {detailAccent.icon}
                  </span>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap text-xs">
                      <span className={`font-bold ${detailAccent.text}`}>{detailLabel}</span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="text-[#475569] font-medium">
                        {selectedResource.badge || 'Contenido de Aula'}
                      </span>
                      {selectedResource.level && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">·</span>
                          <span className="text-[#475569] font-medium">{selectedResource.level}</span>
                        </>
                      )}
                    </div>
                    <h3
                      id="aprendemos-detail-title"
                      className="font-display font-bold text-lg sm:text-xl text-[#0F172A] leading-snug text-balance"
                    >
                      {selectedResource.title}
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
                  aria-label="Cerrar contenido de clase"
                  className="w-11 h-11 rounded-xl bg-white border border-[#E2E8F0] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] flex items-center justify-center shrink-0 cursor-pointer diario-press"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4 overflow-y-auto">
                {detailHasImage && selectedResource.imagen_url && (
                  <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#F7F8FA] aspect-[16/9] max-h-60">
                    <img
                      src={selectedResource.imagen_url}
                      alt={selectedResource.title}
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

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-[#475569] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-[#7C3AED] shrink-0" />
                    <span>Qué estamos aprendiendo</span>
                  </h4>
                  <FormattedText
                    text={selectedResource.description}
                    size="base"
                    accent={detailAccent.formattedAccent}
                  />
                </div>

                {detailTips.length > 0 && (
                  <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                    <h4 className="font-display text-xs font-bold text-[#0F172A] tracking-tight">
                      Cómo acompañar este aprendizaje
                    </h4>
                    <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                      {detailTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[#334155]"
                        >
                          <span
                            aria-hidden="true"
                            className={`w-2 h-2 rounded-full shrink-0 mt-[0.48rem] ${detailAccent.bullet}`}
                          />
                          <span className="min-w-0 flex-1 break-words">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="px-5 py-3.5 border-t border-[#F1F5F9] bg-[#F7F8FA]/60 flex items-center justify-end gap-2.5 flex-wrap">
                {selectedResource.externalUrl && (
                  <a
                    href={selectedResource.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onMarkAsRead?.(detailKey)}
                    className={`min-h-[44px] inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border diario-press ${detailAccent.button}`}
                  >
                    <span>{selectedResource.externalLabel || 'Ver material del proyecto'}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedResource(null)}
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
