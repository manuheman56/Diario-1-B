import React, { useState } from 'react';
import { educationalResources } from '../data/defaultData';
import { EducationalResource } from '../types';
import {
  GraduationCap,
  BookOpen,
  PenTool,
  Calculator,
  Gamepad2,
  CheckCircle,
  ExternalLink,
  Sparkles,
  Search,
  Lightbulb,
} from 'lucide-react';

export const AprendemosTab: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = educationalResources.filter((res) => {
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
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-700 to-sky-700 rounded-3xl p-5 text-white shadow-lg shadow-purple-900/20 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/20 text-purple-100 backdrop-blur-md">
            <GraduationCap className="w-3.5 h-3.5 text-purple-200" />
            Recursos Educativos para Familias
          </span>

          <h2 className="font-display font-extrabold text-xl leading-tight">
            Aprendemos en Familia · 1.º Primaria
          </h2>
          <p className="text-xs text-purple-100/90 leading-relaxed max-w-sm">
            Estrategias pedagógicas, pautas para casa y actividades de refuerzo lúdico
            en lectura, caligrafía y cálculo matemático.
          </p>
        </div>

        {/* Decorative backdrop */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-44 h-44 text-white" />
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeCategory === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todos ({educationalResources.length})
        </button>

        <button
          onClick={() => setActiveCategory('lectura')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeCategory === 'lectura'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Lectura
        </button>

        <button
          onClick={() => setActiveCategory('escritura')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeCategory === 'escritura'
              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <PenTool className="w-3 h-3" />
          Escritura
        </button>

        <button
          onClick={() => setActiveCategory('matematicas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeCategory === 'matematicas'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Calculator className="w-3 h-3" />
          Matemáticas
        </button>

        <button
          onClick={() => setActiveCategory('juegos')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            activeCategory === 'juegos'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Gamepad2 className="w-3 h-3" />
          Juegos
        </button>
      </div>

      {/* 3. Resources List */}
      <div className="space-y-3.5">
        {filteredResources.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-slate-400 space-y-2">
            <Lightbulb className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-700">No se encontraron recursos</p>
            <p className="text-[11px] text-slate-400">Prueba a seleccionar otra categoría.</p>
          </div>
        ) : (
          filteredResources.map((res) => {
            let badgeBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
            if (res.category === 'escritura') badgeBg = 'bg-teal-50 text-teal-800 border-teal-200';
            if (res.category === 'matematicas') badgeBg = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            if (res.category === 'juegos') badgeBg = 'bg-amber-50 text-amber-800 border-amber-200';
            if (res.category === 'refuerzo') badgeBg = 'bg-purple-50 text-purple-800 border-purple-200';

            return (
              <div
                key={res.id}
                className="bg-white rounded-3xl p-4.5 border border-slate-200/80 shadow-xs space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                    {res.badge}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
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

                {/* Practical Tips List */}
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Pautas recomendadas para casa:
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

                {/* External Action Button if applicable */}
                {res.externalUrl && (
                  <div className="pt-1">
                    <a
                      href={res.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition"
                    >
                      <span>{res.externalLabel || 'Consultar recurso externo'}</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 4. Pedagogical note */}
      <div className="p-4 bg-sky-50/80 border border-sky-200/80 rounded-3xl text-xs text-sky-900 flex items-start gap-3">
        <Sparkles className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Recuerda que cada alumno/a de 1.º de Primaria tiene su propio ritmo madurativo. El
          acompañamiento positivo, el juego y la lectura compartida son los pilares más eficaces
          durante este primer curso.
        </p>
      </div>
    </div>
  );
};
