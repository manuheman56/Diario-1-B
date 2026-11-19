import React, { useState, useMemo } from 'react';
import { HomeLearningResource, HomeResourceCategory } from '../types';
import { matchesNormalizedSearch } from '../utils/searchUtils';
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
  Sparkles,
  Download,
  Clock,
  Layers,
  Star,
  CheckCircle2,
  X,
  GraduationCap,
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

export const RecursosTab: React.FC<RecursosTabProps> = ({
  resources,
  unreadKeys,
  onMarkAsRead,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<HomeResourceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFeatured, setOnlyFeatured] = useState(false);

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
      label: 'Todos',
      icon: <Layers className="w-3.5 h-3.5" />,
      description: 'Biblioteca integral de refuerzo educativo para 1.º B',
      count: counts.all,
    },
    {
      id: 'matematicas',
      label: 'Matemáticas',
      icon: <Calculator className="w-3.5 h-3.5" />,
      description: 'Numeración, amigos del 10, cálculo mental, problemas y razonamiento lógico',
      count: counts.matematicas,
    },
    {
      id: 'lengua_lectura',
      label: 'Lengua y lectura',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      description: 'Cuentos, comprensión, caligrafía, grafomotricidad y conciencia fonológica',
      count: counts.lengua_lectura,
    },
    {
      id: 'fichas',
      label: 'Fichas y materiales',
      icon: <FileText className="w-3.5 h-3.5" />,
      description: 'PDF imprimibles, cuadrículas, dominós y actividades para descargar',
      count: counts.fichas,
    },
    {
      id: 'familias',
      label: 'Orientaciones familias',
      icon: <HeartHandshake className="w-3.5 h-3.5" />,
      description: 'Hábitos de estudio en 1.º, lectura compartida y pautas educativas de apoyo',
      count: counts.familias,
    },
  ];

  const getCategoryBadge = (cat: HomeResourceCategory) => {
    switch (cat) {
      case 'matematicas':
        return { text: 'Matemáticas', color: 'text-[#0F766E]' };
      case 'lengua_lectura':
        return { text: 'Lengua y Lectura', color: 'text-[#4338CA]' };
      case 'fichas':
        return { text: 'Fichas y PDF', color: 'text-[#B45309]' };
      case 'familias':
        return { text: 'Para Familias', color: 'text-[#6D28D9]' };
      default:
        return { text: 'Recurso', color: 'text-[#334155]' };
    }
  };

  const filteredList = useMemo(() => {
    return activeResources.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.categoria === selectedCategory;
      const matchesFeatured = !onlyFeatured || Boolean(item.destacado_casa);
      const badgeText = getCategoryBadge(item.categoria).text;
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
      {/* 1. Cabecera unificada */}
      <SectionHeader
        eyebrow="Biblioteca Educativa para Casa"
        metaRight="1.º de Primaria B"
        title="Aprender y Reforzar en Familia"
        description="Selección cuidada de materiales descargables, juegos de lógica y pautas de lectura para afianzar en casa las áreas de Lengua Castellana y Matemáticas."
        icon={<GraduationCap className="w-5 h-5" />}
        accent="indigo"
        footerMeta={
          <>
            <span className="tabular-nums">{activeResources.length} recursos disponibles</span>
            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span>Acceso libre y seguro</span>
          </>
        }
      />

      {/* 2. Barra de búsqueda y filtro rápido */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#475569] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema, ficha, cálculo o lectura..."
            className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-white rounded-2xl border border-[#E2E8F0] text-[14px] text-[#0F172A] placeholder:text-[#64748B] shadow-xs focus:border-[#4F46E5] transition"
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
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer diario-press ${
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
                  ? 'bg-[#4338CA] text-white shadow-xs'
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

      {/* 4. Rejilla de Recursos Didácticos */}
      {filteredList.length === 0 ? (
        <EmptyStateCard
          icon={<Search className="w-6 h-6" />}
          title="No se han encontrado recursos con estos criterios"
          description="Prueba a cambiar el texto de búsqueda o desactiva el filtro de recomendados."
          actionLabel="Restablecer filtros"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
            setOnlyFeatured(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredList.map((item) => {
            const meta = getCategoryBadge(item.categoria);
            const isDownloadable =
              item.tipo_recurso.toLowerCase().includes('pdf') ||
              item.tipo_recurso.toLowerCase().includes('imprimible') ||
              item.tipo_recurso.toLowerCase().includes('ficha');
            const itemKey = getPublicationKey('recursos', item);
            const isUnread = Boolean(unreadKeys?.has(itemKey));

            return (
              <article
                key={item.id}
                className="diario-card rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3.5"
              >
                <div className="space-y-2.5">
                  {/* Metadatos limpios */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap font-medium text-[#475569] min-w-0">
                      <span className={`font-bold ${meta.color}`}>{meta.text}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="truncate">{item.tipo_recurso}</span>
                      {item.nivel && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="shrink-0">{item.nivel}</span>
                        </>
                      )}
                      {isUnread && <NewBadge variant="teal" />}
                    </div>

                    {item.destacado_casa && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                        <span>Recomendado</span>
                      </span>
                    )}
                  </div>

                  {/* Título y descripción */}
                  <div className="space-y-1.5">
                    <h3 className="font-display font-bold text-[16px] text-[#0F172A] leading-snug">
                      {item.titulo}
                    </h3>
                    <FormattedText text={item.descripcion} accent="indigo" />
                  </div>
                </div>

                {/* Pie alineado con tiempo estimado, lectura individual y acción */}
                <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2 text-xs text-[#475569]">
                  {item.tiempo_estimado ? (
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                      <span>{item.tiempo_estimado}</span>
                    </span>
                  ) : (
                    <span />
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {isUnread && (
                      <MarkAsReadButton
                        compact
                        onClick={() => onMarkAsRead?.(itemKey)}
                      />
                    )}
                    {item.url_recurso ? (
                      <a
                        href={item.url_recurso}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (isUnread) onMarkAsRead?.(itemKey);
                        }}
                        className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4338CA] border border-[#C7D2FE] diario-press cursor-pointer"
                      >
                        {isDownloadable ? (
                          <>
                            <Download className="w-3.5 h-3.5" />
                            <span>Descargar material</span>
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                            <span>Abrir actividad</span>
                          </>
                        )}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[#0F766E] text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                        <span>Pauta práctica para casa</span>
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 5. Nota pedagógica de cierre */}
      <footer className="bg-[#EEF2FF]/70 border border-[#C7D2FE] rounded-3xl p-4 sm:p-5 flex items-start gap-3.5">
        <span className="w-9 h-9 rounded-xl bg-white border border-[#C7D2FE] flex items-center justify-center text-[#4338CA] shrink-0">
          <Sparkles className="w-4 h-4" />
        </span>
        <p className="text-xs sm:text-[13px] text-[#334155] leading-relaxed">
          <strong className="text-[#0F172A]">Acompañamiento en el hogar:</strong> En 1.º de Primaria, 10 a 15 minutos de juego educativo o lectura compartida al día tienen un impacto formativo superior a largas sesiones de ejercicios. Prioriza siempre el disfrute y el refuerzo positivo.
        </p>
      </footer>
    </div>
  );
};
