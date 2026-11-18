import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] bg-[#0F172A] text-white px-4 py-2.5 rounded-2xl text-xs sm:text-[13px] font-semibold shadow-lg flex items-center gap-2 border border-slate-700/80 diario-slide-up"
    >
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
      <span className="truncate">{message}</span>
    </div>
  );
};
