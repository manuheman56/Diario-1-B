import React, { useState } from 'react';
import { PostCategory, PostItem } from '../types';
import { X, PenLine, Sparkles, AlertCircle } from 'lucide-react';

interface NewPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePost: (post: Omit<PostItem, 'id' | 'timestamp'>) => void;
  authorName: string;
}

export const NewPostModal: React.FC<NewPostModalProps> = ({
  isOpen,
  onClose,
  onSavePost,
  authorName,
}) => {
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState<PostCategory>('Aviso');
  const [content, setContent] = useState('');
  const [important, setImportant] = useState(false);
  const [customDate, setCustomDate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const dateStr = customDate
      ? new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'short',
        }).format(new Date(customDate))
      : `Hoy, ${new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`;

    onSavePost({
      title,
      tag,
      content,
      date: dateStr,
      author: authorName || 'Tutor/a',
      important,
      completed: tag === 'Tarea' ? false : undefined,
    });

    // Reset and close
    setTitle('');
    setContent('');
    setTag('Aviso');
    setImportant(false);
    setCustomDate('');
    onClose();
  };

  const applyTemplate = (
    templateTitle: string,
    templateTag: PostCategory,
    templateContent: string,
    isImp = false
  ) => {
    setTitle(templateTitle);
    setTag(templateTag);
    setContent(templateContent);
    setImportant(isImp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm shadow-xs">
              <PenLine className="w-4 h-4" />
            </span>
            <h3 className="font-display font-extrabold text-slate-900 text-base">
              Publicar Aviso o Tarea
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick templates */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" /> Plantillas rápidas:
          </span>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  'Recordatorio de deberes de Matemáticas',
                  'Tarea',
                  'Realizar las actividades 1 y 2 de la ficha azul. Repasar las sumas con llevada.'
                )
              }
              className="text-[11px] bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-xl whitespace-nowrap hover:bg-amber-100 font-semibold cursor-pointer"
            >
              ✏️ Deberes Matemáticas
            </button>
            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  'Autorización y recordatorio de excursión',
                  'Aviso',
                  'Recordad entregar firmado el justificante de la salida antes del viernes.',
                  true
                )
              }
              className="text-[11px] bg-rose-50 text-rose-900 border border-rose-200 px-2.5 py-1 rounded-xl whitespace-nowrap hover:bg-rose-100 font-semibold cursor-pointer"
            >
              📢 Excursión escolar
            </button>
            <button
              type="button"
              onClick={() =>
                applyTemplate(
                  'Traer material reciclado para Plástica',
                  'Actividad',
                  'Para el taller del próximo jueves necesitaremos un brik de leche limpio o un rollo de cartón.'
                )
              }
              className="text-[11px] bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 rounded-xl whitespace-nowrap hover:bg-emerald-100 font-semibold cursor-pointer"
            >
              🎨 Material de Plástica
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título del aviso o tarea *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Actividades de hoy y recordatorio"
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Categoría
              </label>
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value as PostCategory)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="Aviso">📢 Aviso General</option>
                <option value="Tarea">✏️ Tarea / Deberes</option>
                <option value="Actividad">🎨 Actividad en Clase</option>
                <option value="Examen">📝 Examen / Control</option>
                <option value="Urgente">🚨 Mensaje Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Fecha programada
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mensaje explicativo para las familias *
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribe el contenido detallado o recomendaciones de la actividad..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition"
            />
          </div>

          {/* Toggle Important */}
          <label className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-500" /> Marcar como
                aviso prioritario
              </span>
              <span className="text-[10px] text-slate-500 block">
                Destacará con un borde llamativo en el tablón
              </span>
            </div>
          </label>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition cursor-pointer active:scale-98"
            >
              Publicar en el Diario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
