import React, { useState, useMemo } from 'react';
import { HomeLearningResource, HomeResourceCategory } from '../types';
import { initialHomeResources } from '../data/defaultData';
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
} from 'lucide-react';

interface RecursosTabProps {
  resources?: HomeLearningResource[];
  isLoadedFromSheets?: boolean;
}

interface CategoryConfig {
  id: HomeResourceCategory | 'all';
  label: string;
  icon: React.ReactNode;
  description: string;
  count: number;
}

export const RecursosTab: React.FC<RecursosTabProps> = ({ resources }) => {
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

  // Filtered resources
  const filteredList = useMemo(() => {
    return activeResources.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.categoria === selectedCategory;
      const matchesFeatured = !onlyFeatured || Boolean(item.destacado_casa);
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.titulo.toLowerCase().includes(query) ||
        item.descripcion.toLowerCase().includes(query) ||
        item.tipo_recurso.toLowerCase().includes(query) ||
        (item.nivel && item.nivel.toLowerCase().includes(query));

      return matchesCategory && matchesFeatured && matchesSearch;
    });
  }, [activeResources, selectedCategory, onlyFeatured, searchQuery]);

  const activeCategoryMeta = categories.find((c) => c.id === selectedCategory);

  const getCategoryBadge = (cat: HomeResourceCategory) => {
    switch (cat) {
      case 'matematicas':
        return { text: 'Matemáticas', color: 'text-emerald-700' };
      case 'lengua_lectura':
        return { text: 'Lengua y Lectura', color: 'text-indigo-700' };
      case 'fichas':
        return { text: 'Fichas y PDF', color: 'text-amber-700' };
      case 'familias':
        return { text: 'Para Familias', color: 'text-purple-700' };
      default:
        return { text: 'Recurso', color: 'text-slate-700' };
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-300">
      {/* 1. Hero Banner Educativo */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-sky-900 p-5 text-white shadow-lg shadow-indigo-950/20">
        <div className="relative z-10 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-200">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-md border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Biblioteca Educativa para Casa
            </span>
            <span className="text-indigo-200">·</span>
            <span>1.º de Primaria B</span>
          </div>

          <h2 className="font-display font-extrabold text-2xl tracking-tight leading-tight text-white">
            Aprender y Reforzar en Familia
          </h2>

          <p className="text-xs text-indigo-100/90 leading-relaxed max-w-lg">
            Selección cuidada de materiales descargables, juegos de lógica y pautas
            de lectura para afianzar en casa las áreas de Lengua Castellana y Matemáticas.
          </p>

          <div className="pt-1 flex items-center gap-3 text-[11px] text-indigo-200 font-medium">
            <span>{activeResources.length} recursos disponibles</span>
            <span>·</span>
            <span>Tutor: Manuel Herrera</span>
            <span>·</span>
            <span className="text-amber-300">Acceso libre y seguro</span>
          </div>
        </div>

        {/* Decorative backdrop shape */}
        <div className="absolute -right-6 -bottom-10 opacity-10 pointer-events-none">
          <BookOpen className="w-52 h-52 text-white" />
        </div>
      </div>

      {/* 2. Barra de Búsqueda y Filtro Rápido */}
      <div className="space-y-2">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por tema, ficha, cálculo o lectura..."
            className="w-full pl-10 pr-9 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
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

        {/* Toggle para Solo Recomendados */}
        <div className="flex items-center justify-between text-xs px-1">
          <span className="text-[11px] text-slate-500 font-medium">
            {activeCategoryMeta?.description}
          </span>
          <button
            type="button"
            onClick={() => setOnlyFeatured(!onlyFeatured)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
              onlyFeatured
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Star
              className={`w-3 h-3 ${
                onlyFeatured ? 'fill-amber-500 text-amber-600' : 'text-slate-400'
              }`}
            />
            <span>Recomendados de casa</span>
          </button>
        </div>
      </div>

      {/* 3. Selector Interactivo de Categorías (Exclusivamente Lengua, Matemáticas, Fichas y Familias) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 -mx-1 px-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`min-h-[44px] px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer touch-manipulation active:scale-95 shrink-0 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                  : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className={isSelected ? 'text-white' : 'text-slate-400'}>
                {cat.icon}
              </span>
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 4. Lista de Recursos Didácticos */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/90 text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-800 text-sm">
              No se han encontrado recursos con estos criterios
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Prueba a cambiar el texto de búsqueda o desactiva el filtro de recomendados.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setOnlyFeatured(false);
              }}
              className="mt-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition cursor-pointer"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filteredList.map((item) => {
            const meta = getCategoryBadge(item.categoria);
            const isDownloadable =
              item.tipo_recurso.toLowerCase().includes('pdf') ||
              item.tipo_recurso.toLowerCase().includes('imprimible') ||
              item.tipo_recurso.toLowerCase().includes('ficha');

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs hover:border-indigo-200 hover:shadow-sm transition space-y-3"
              >
                {/* Cabecera de metadatos limpios sin píldoras invasivas */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-500 text-[11px] truncate">
                    <span className={`font-bold ${meta.color}`}>{meta.text}</span>
                    <span aria-hidden="true" className="text-slate-300">·</span>
                    <span className="truncate">{item.tipo_recurso}</span>
                    {item.nivel && (
                      <>
                        <span aria-hidden="true" className="text-slate-300">·</span>
                        <span className="text-slate-600 font-medium">{item.nivel}</span>
                      </>
                    )}
                  </div>

                  {item.destacado_casa && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      Recomendado
                    </span>
                  )}
                </div>

                {/* Título y Descripción */}
                <div>
                  <h3 className="font-display font-bold text-sm text-slate-900 leading-snug">
                    {item.titulo}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {item.descripcion}
                  </p>
                </div>

                {/* Información complementaria y tiempo estimado */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  {item.tiempo_estimado && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.tiempo_estimado}</span>
                    </span>
                  )}

                  {/* Botón de Acción Directo */}
                  {item.url_recurso ? (
                    <a
                      href={item.url_recurso}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer active:scale-95"
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
                    <span className="ml-auto inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pauta práctica para casa</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. Nota pedagógica de cierre */}
      <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-3xl p-4 text-xs text-indigo-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Acompañamiento en el hogar:</strong> En 1.º de Primaria, 10 a 15 minutos
          de juego educativo o lectura compartida al día tienen un impacto formativo superior
          a largas sesiones de ejercicios. Prioriza siempre el disfrute y el refuerzo positivo.
        </p>
      </div>
    </div>
  );
};
