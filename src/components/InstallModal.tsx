import React from 'react';
import {
  X,
  Smartphone,
  Share,
  MoreVertical,
  PlusSquare,
  Compass,
} from 'lucide-react';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 diario-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl border border-[#E2E8F0] diario-slide-up pb-[max(env(safe-area-inset-bottom),1.25rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/pwa-192x192.png"
              alt="Mascota de El Diario del Aula 1.º B"
              className="w-11 h-11 rounded-2xl border border-[#E2E8F0] object-cover shrink-0 shadow-xs"
            />
            <div className="min-w-0">
              <h3
                id="install-modal-title"
                className="font-display font-bold text-[#0F172A] text-base leading-tight truncate"
              >
                Instalar en la pantalla de inicio
              </h3>
              <span className="text-xs text-[#475569] font-medium block mt-0.5">
                El Diario del Aula · 1.º B
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones de instalación"
            className="min-w-[44px] min-h-[44px] text-[#475569] hover:text-[#0F172A] rounded-xl hover:bg-[#F1F5F9] flex items-center justify-center cursor-pointer diario-press shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[14px] text-[#334155] leading-relaxed">
          Accede directamente desde el icono en tu teléfono como una aplicación,
          sin descargar nada de la tienda ni ocupar memoria adicional.
        </p>

        <div className="space-y-3">
          {/* Android Chrome */}
          <div className="p-4 bg-[#EEF2FF]/70 border border-[#C7D2FE]/80 rounded-2xl space-y-2">
            <h4 className="font-display font-bold text-[#0F172A] text-sm flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[#F0FDFA] text-[#0D9488] border border-teal-200 flex items-center justify-center shrink-0">
                <Smartphone className="w-4 h-4" />
              </span>
              <span>En Android (Google Chrome)</span>
            </h4>
            <p className="text-[13px] text-[#334155] leading-relaxed pl-9">
              1. Toca el menú de los <strong>tres puntos (<MoreVertical className="w-3.5 h-3.5 inline text-[#0F172A]" />)</strong> arriba a la derecha.
              <br />
              2. Pulsa en <strong>«Añadir a la pantalla de inicio»</strong> o «Instalar aplicación».
            </p>
          </div>

          {/* iPhone Safari */}
          <div className="p-4 bg-[#F7F8FA] border border-[#E2E8F0] rounded-2xl space-y-2">
            <h4 className="font-display font-bold text-[#0F172A] text-sm flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-white text-[#4338CA] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </span>
              <span>En iPhone o iPad (Safari)</span>
            </h4>
            <p className="text-[13px] text-[#334155] leading-relaxed pl-9">
              1. Toca el botón <strong>Compartir (<Share className="w-3.5 h-3.5 inline text-[#4F46E5]" />)</strong> en la barra de Safari.
              <br />
              2. Desliza las opciones y elige <strong>«Añadir a pantalla de inicio» (<PlusSquare className="w-3.5 h-3.5 inline text-[#0F172A]" />)</strong>.
            </p>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={onClose}
            className="w-full min-h-[44px] bg-[#4F46E5] hover:bg-[#4338CA] text-white font-bold text-sm py-2.5 rounded-xl diario-press cursor-pointer shadow-xs"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
};
