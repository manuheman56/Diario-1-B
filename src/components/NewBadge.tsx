import React from 'react';
import { Check } from 'lucide-react';

export type NewBadgeVariant = 'indigo' | 'coral' | 'amber' | 'violet' | 'teal';

const BADGE_STYLES: Record<NewBadgeVariant, string> = {
  indigo: 'bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]',
  coral: 'bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]',
  amber: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  violet: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
  teal: 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]',
};

interface NewBadgeProps {
  variant?: NewBadgeVariant;
  className?: string;
}

/**
 * Etiqueta discreta y proporcionada para publicaciones pendientes de lectura.
 */
export const NewBadge: React.FC<NewBadgeProps> = ({
  variant = 'indigo',
  className = '',
}) => (
  <span
    aria-label="Publicación nueva sin leer"
    className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider leading-none shrink-0 ${BADGE_STYLES[variant]} ${className}`.trim()}
  >
    NUEVO
  </span>
);

interface MarkAsReadButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  label?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Acción discreta individual para marcar una publicación como leída sin interrumpir la lectura.
 */
export const MarkAsReadButton: React.FC<MarkAsReadButtonProps> = ({
  onClick,
  label = 'Marcar como leída',
  compact = false,
  className = '',
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF]/80 hover:bg-[#EEF2FF] text-[#4338CA] font-semibold cursor-pointer shrink-0 diario-press transition-colors ${
      compact
        ? 'min-h-[34px] px-2.5 py-1 text-[11px]'
        : 'min-h-[38px] px-3 py-1.5 text-xs'
    } ${className}`.trim()}
  >
    <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={2.3} />
    <span>{label}</span>
  </button>
);
