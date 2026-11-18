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
      className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-end sm:items-center justify-center p-3 sm:p-4 diario-fade-in"
      onClick={onStay}
    >
      <div
        className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#E2E8F0] space-y-4 diario-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3
              id="exit-confirm-title"
              className="font-display font-bold text-[#0F172A] text-base leading-snug"
            >
              ¿Quieres salir de El Diario del Aula?
            </h3>
            <p className="text-[13.5px] text-[#475569] leading-relaxed">
              Pulsa seguir para continuar consultando la información de clase.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <button
            type="button"
            onClick={onExit}
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#334155] bg-[#F1F5F9] hover:bg-slate-200 diario-press cursor-pointer"
          >
            Salir
          </button>
          <button
            type="button"
            onClick={onStay}
            autoFocus
            className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-[13px] font-bold text-white bg-[#4F46E5] hover:bg-[#4338CA] diario-press cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Seguir en la aplicación</span>
          </button>
        </div>
      </div>
    </div>
  );
};
