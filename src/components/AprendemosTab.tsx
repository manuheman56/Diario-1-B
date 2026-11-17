import React, { useMemo, useState } from 'react';
import { AprendemosCategory, EducationalResource } from '../types';
import {
  normalizeAprendemosTips,
  normalizeAprendemosCategory,
  APRENDEMOS_CATEGORY_LABELS,
} from '../services/sheetsService';
import { matchesNormalizedSearch } from '../utils/searchUtils';
import {
  GraduationCap,
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
}

export const AprendemosTab: React.FC<AprendemosTabProps> = ({ resources }) => {
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
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* 1. Hero Header - Qué trabajamos en clase */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-800 via-purple-900 to-indigo-900 p-5 text-white shadow-lg shadow-purple-950/20">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/10">
              <School className="w-3.5 h-3.5 text-purple-200" />
              Vida y Aprendizajes del Aula
            </span>
            <span className="text-purple-200">·</span>
            <span>1.º de Primaria B</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-white">
            ¿Qué estamos trabajando en clase?
          </h2>

          <p className="text-xs text-purple-100/90 leading-relaxed max-w-lg">
            Contenidos curriculares, proyectos activos y experiencias educativas
            que desarrollamos día a día en el aula con El profe Manolo.
          </p>

          <div className="pt-1 flex items-center gap-3 text-[11px] text-purple-200 font-medium">
            <span>Sincronizado desde la pestaña APRENDEMOS</span>
            <span>·</span>
            <span className="text-amber-300">Curso escolar 2026/27</span>
          </div>
        </div>

        {/* Decorative backdrop */}
        <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
          <GraduationCap className="w-52 h-52 text-white" />
        </div>
      </div>

      {/* 2. Buscador y Filtros por Áreas de Aprendizaje */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar contenidos, proyectos o pautas de clase..."
            className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              title="Borrar búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'all'
                ? 'bg-purple-700 text-white shadow-sm ring-2 ring-purple-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <span>Todos los ámbitos</span>
            <span className="text-[10px] bg-black/10 px-1.5 py-0.2 rounded-full">
              {activeList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('lectura')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'lectura'
                ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.lectura}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'lectura'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {categoryCounts.lectura}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('escritura')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'escritura'
                ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.escritura}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'escritura'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {categoryCounts.escritura}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('calculo')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'calculo'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.calculo}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'calculo'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {categoryCounts.calculo}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('talleres')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'talleres'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{APRENDEMOS_CATEGORY_LABELS.talleres}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === 'talleres'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-500'
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
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 space-y-2">
            <School className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-800 text-sm">
              {searchQuery.trim()
                ? 'No se encontraron aprendizajes con esa búsqueda'
                : 'No hay contenidos en esta categoría'}
            </h4>
            <p className="text-xs text-slate-500">
              {searchQuery.trim()
                ? 'Prueba con otras palabras o limpia la búsqueda actual.'
                : 'Prueba a seleccionar otro ámbito de aprendizaje.'}
            </p>
            {(activeCategory !== 'all' || searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setActiveCategory('all');
                  setSearchQuery('');
                }}
                className="mt-1 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition cursor-pointer"
              >
                Ver todos los ámbitos
              </button>
            )}
          </div>
        ) : (
          filteredResources.map((res) => {
            const displayTips = normalizeAprendemosTips(res.tips, res.description);
            const itemCategory = normalizeAprendemosCategory(res.categoria || res.category);
            const categoryLabel = APRENDEMOS_CATEGORY_LABELS[itemCategory];
            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs space-y-3 hover:border-purple-200 transition"
              >
                {/* Metadatos limpios sin píldoras invasivas */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800 text-[11px] truncate">
                    <span>{categoryLabel}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-600 font-medium truncate">
                      {res.badge || 'Contenido de Aula'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">
                    {res.level}
                  </span>
                </div>

                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                    {res.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {res.description}
                  </p>
                </div>

                {/* Pautas pedagógicas para el seguimiento en familia */}
                {displayTips.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 space-y-3">
                    <h4 className="text-xs font-bold text-slate-800 tracking-tight">
                      Cómo acompañar este aprendizaje
                    </h4>
                    <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                      {displayTips.map((tip, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs leading-relaxed text-slate-700"
                        >
                          <span
                            aria-hidden="true"
                            className="w-2 h-2 rounded-full bg-purple-600 shrink-0 mt-[0.42rem]"
                          />
                          <span className="min-w-0 flex-1 break-words">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Enlace opcional a recurso complementario */}
                {res.externalUrl && (
                  <div className="pt-1">
                    <a
                      href={res.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3.5 py-1.5 rounded-xl border border-purple-200 transition"
                    >
                      <span>{res.externalLabel || 'Ver material del proyecto'}</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Enlace cruzado intuitivo hacia la Biblioteca de Recursos */}
      <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-3xl text-xs text-purple-950 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-[11px] leading-relaxed">
          <strong>¿Buscas materiales descargables para practicar en casa?</strong>
          <p className="text-purple-800">
            En la sección <strong>Recursos</strong> encontrarás juegos interactivos,
            fichas en PDF y orientaciones familiares organizadas en cinco áreas prácticas.
          </p>
        </div>
      </div>
    </div>
  );
};
