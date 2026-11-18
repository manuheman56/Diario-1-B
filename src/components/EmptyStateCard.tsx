import React from 'react';

interface EmptyStateCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="diario-card rounded-3xl p-8 text-center space-y-3">
      <div className="w-12 h-12 rounded-2xl bg-[#F1F5F9] text-[#475569] border border-[#E2E8F0] flex items-center justify-center mx-auto">
        {icon}
      </div>
      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="font-display font-bold text-[#0F172A] text-base leading-snug">
          {title}
        </h3>
        <p className="text-[13.5px] text-[#475569] leading-relaxed">{description}</p>
      </div>
      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="min-h-[44px] px-5 py-2 rounded-xl text-xs sm:text-[13px] font-bold text-[#4338CA] bg-[#EEF2FF] hover:bg-[#E0E7FF] border border-[#C7D2FE] diario-press cursor-pointer"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
