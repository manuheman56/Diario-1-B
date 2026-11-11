import React, { useState } from 'react';
import { educationalResources } from '../data/defaultData';
import { EducationalResource } from '../types';
import {
  GraduationCap,
  BookOpen,
  PenTool,
  Calculator,
  Compass,
  Palette,
  CheckCircle,
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
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const activeList = resources !== undefined ? resources : [];

  const filteredResources = activeList.filter((res) => {
    const matchesCategory =
      activeCategory === 'all' || res.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === '' ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.tips.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

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
            que desarrollamos día a día en el aula con el tutor don Manuel Herrera.
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
            <span>Lectura y Comprensión</span>
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
            <span>Escritura y Trazo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('matematicas')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'matematicas'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Cálculo y Lógica</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveCategory('juegos')}
            className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
              activeCategory === 'juegos'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Talleres y Dinámicas</span>
          </button>
        </div>
      </div>

      {/* 3. Lista de Contenidos y Aprendizajes */}
      <div className="space-y-3.5">
        {filteredResources.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 space-y-2">
            <School className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-800 text-sm">
              No hay contenidos en esta categoría
            </h4>
            <p className="text-xs text-slate-500">
              Prueba a seleccionar otro ámbito de aprendizaje.
            </p>
          </div>
        ) : (
          filteredResources.map((res) => {
            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs space-y-3 hover:border-purple-200 transition"
              >
                {/* Metadatos limpios sin píldoras invasivas */}
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-bold text-purple-800 text-[11px] truncate">
                    <span>{res.badge}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="text-slate-600 font-medium">Contenido de Aula</span>
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
                {res.tips && res.tips.length > 0 && (
                  <div className="bg-slate-50/90 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Cómo acompañar este aprendizaje:
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {res.tips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="leading-tight text-[11px]">{tip}</span>
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
