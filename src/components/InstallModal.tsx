import React from 'react';
import { X, Smartphone, Share, MoreVertical, PlusSquare, Check } from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img
              src="/pwa-192x192.png"
              alt="Icono de la app"
              className="w-10 h-10 rounded-2xl shadow-md border border-slate-200/80 object-cover shrink-0"
            />
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Instalar en la Pantalla de Inicio
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                El Diario del Aula · 1ºB
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Accede directamente desde el icono de tu teléfono como una aplicación
          nativa, sin descargar nada de la tienda ni ocupar memoria.
        </p>

        <div className="space-y-3 text-xs">
          {/* Android Chrome */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-100 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-indigo-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">
                A
              </span>
              <span>En Android (Google Chrome)</span>
            </h4>
            <p className="text-indigo-950 text-[11px] leading-relaxed pl-7">
              1. Toca el menú de los <strong>tres puntos (<MoreVertical className="w-3 h-3 inline text-slate-700" />)</strong> en la esquina superior derecha.<br />
              2. Pulsa en <strong>"Añadir a la pantalla de inicio"</strong> o "Instalar aplicación".
            </p>
          </div>

          {/* iPhone Safari */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-slate-800 text-white flex items-center justify-center text-[10px] font-black">
                i
              </span>
              <span>En iPhone o iPad (Safari)</span>
            </h4>
            <p className="text-slate-700 text-[11px] leading-relaxed pl-7">
              1. Toca el botón <strong>Compartir (<Share className="w-3 h-3 inline text-indigo-600" />)</strong> en la barra inferior de Safari.<br />
              2. Baja por las opciones y elige <strong>"Añadir a pantalla de inicio" (<PlusSquare className="w-3 h-3 inline text-slate-700" />)</strong>.
            </p>
          </div>
        </div>

        <div className="pt-1 flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition cursor-pointer shadow-md"
          >
            ¡Entendido!
          </button>
          <a
            href="/el-diario-del-aula-1b.zip"
            download="el-diario-del-aula-1b.zip"
            className="w-full text-center py-2 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition"
          >
            Descargar código del proyecto (ZIP para GitHub / Netlify)
          </a>
        </div>
      </div>
    </div>
  );
};
