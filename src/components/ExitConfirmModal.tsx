import React, { useEffect } from 'react';
import { LogOut, ArrowLeft } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onStay: () => void;
  onExit: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  onStay,
  onExit,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onStay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onStay]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-confirm-title"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onStay}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="exit-confirm-title"
              className="font-display font-bold text-slate-900 text-sm sm:text-base leading-snug"
            >
              ¿Quieres salir de El Diario del Aula?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pulsa seguir para continuar consultando la información de clase.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <button
            type="button"
            onClick={onExit}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            Salir
          </button>
          <button
            type="button"
            onClick={onStay}
            autoFocus
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Seguir en la aplicación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
