import React, { useMemo, useState } from 'react';
import { AprendemosCategory, EducationalResource } from '../types';
import {
  normalizeAprendemosTips,
  normalizeAprendemosCategory,
  APRENDEMOS_CATEGORY_LABELS,
} from '../services/sheetsService';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import { SectionHeader } from './SectionHeader';
import { EmptyStateCard } from './EmptyStateCard';
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
        bullet: 'bg-[#4338CA]',
        button: 'text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border-[#C7D2FE]',
      };
    case 'escritura':
      return {
        text: 'text-[#0F766E]',
        bullet: 'bg-[#0D9488]',
        button: 'text-[#0F766E] bg-[#F0FDFA] hover:bg-teal-100 border-teal-200',
      };
    case 'calculo':
      return {
        text: 'text-emerald-700',
        bullet: 'bg-emerald-600',
        button: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
      };
    case 'talleres':
      return {
        text: 'text-[#B45309]',
        bullet: 'bg-[#D97706]',
        button: 'text-[#92400E] bg-[#FEF3C7] hover:bg-amber-200/70 border-[#FDE68A]',
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
      {/* 1. Cabecera unificada */}
      <SectionHeader
        eyebrow="Vida y Aprendizajes del Aula"
        metaRight="1.º de Primaria B"
        title="¿Qué estamos trabajando en clase?"
        description="Contenidos curriculares, proyectos activos y pautas prácticas para acompañar desde casa lo que trabajamos día a día con El profe Manolo."
        icon={<School className="w-5 h-5" />}
        accent="violet"
        footerMeta={
          <span className="font-semibold text-[#7C3AED]">Curso escolar 2026/27</span>
        }
      />

      {/* 2. Buscador y filtros por ámbitos */}
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

      {/* 3. Lista de Contenidos y Aprendizajes */}
      <div className="space-y-3.5">
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
          filteredResources.map((res) => {
            const displayTips = normalizeAprendemosTips(res.tips, res.description);
            const itemCategory = normalizeAprendemosCategory(res.categoria || res.category);
            const categoryLabel = APRENDEMOS_CATEGORY_LABELS[itemCategory];
            const accent = getCategoryAccent(itemCategory);
            const itemKey = getPublicationKey('aprendemos', res);
            const isUnread = Boolean(unreadKeys?.has(itemKey));

            return (
              <article
                key={res.id}
                className="diario-card rounded-3xl p-4 sm:p-5 space-y-3.5"
              >
                {/* Metadatos limpios sin píldoras */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className={`font-bold ${accent.text}`}>{categoryLabel}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <span className="text-[#475569] font-medium truncate">
                      {res.badge || 'Contenido de Aula'}
                    </span>
                    {isUnread && <NewBadge variant="violet" />}
                  </div>
                  <span className="text-xs text-[#475569] font-medium shrink-0">
                    {res.level}
                  </span>
                </div>

                {/* Título y explicación */}
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-[16px] text-[#0F172A] leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-[14px] text-[#334155] leading-relaxed">
                    {res.description}
                  </p>
                </div>

                {/* Pautas pedagógicas para las familias */}
                {displayTips.length > 0 && (
                  <div className="bg-[#F7F8FA] rounded-2xl p-4 border border-[#E2E8F0] space-y-3">
                    <h4 className="font-display text-xs font-bold text-[#0F172A] tracking-tight">
                      Cómo acompañar este aprendizaje
                    </h4>
                    <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                      {displayTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-[#334155]"
                        >
                          <span
                            aria-hidden="true"
                            className={`w-2 h-2 rounded-full shrink-0 mt-[0.48rem] ${accent.bullet}`}
                          />
                          <span className="min-w-0 flex-1 break-words">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Enlace opcional a recurso complementario y lectura individual */}
                {(res.externalUrl || isUnread) && (
                  <div className="pt-0.5 flex items-center justify-between flex-wrap gap-2">
                    {res.externalUrl ? (
                      <a
                        href={res.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (isUnread) onMarkAsRead?.(itemKey);
                        }}
                        className={`min-h-[44px] inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border diario-press ${accent.button}`}
                      >
                        <span>{res.externalLabel || 'Ver material del proyecto'}</span>
                        <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                      </a>
                    ) : (
                      <span />
                    )}

                    {isUnread && (
                      <MarkAsReadButton
                        compact
                        onClick={() => onMarkAsRead?.(itemKey)}
                      />
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>

      {/* 4. Referencia a Biblioteca de Recursos */}
      <div className="p-4 bg-[#F5F3FF] border border-violet-200 rounded-3xl flex items-start gap-3">
        <span className="w-9 h-9 rounded-xl bg-white border border-violet-200 flex items-center justify-center text-[#7C3AED] shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <div className="space-y-0.5 text-xs leading-relaxed text-[#334155]">
          <strong className="block font-display text-sm text-[#0F172A]">
            ¿Buscas materiales descargables para practicar en casa?
          </strong>
          <p>
            En la sección <strong>Recursos</strong> encontrarás juegos interactivos, fichas en PDF y orientaciones familiares listas para usar.
          </p>
        </div>
      </div>
    </div>
  );
};
