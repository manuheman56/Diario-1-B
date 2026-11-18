import React from 'react';

export type SectionAccentTone = 'indigo' | 'teal' | 'violet' | 'amber' | 'coral';

interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  accent?: SectionAccentTone;
  metaRight?: React.ReactNode;
  actions?: React.ReactNode;
  footerMeta?: React.ReactNode;
}

const TONE_CLASSES: Record<
  SectionAccentTone,
  {
    iconBox: string;
    eyebrow: string;
    accentBar: string;
  }
> = {
  indigo: {
    iconBox: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80',
    eyebrow: 'text-[#4338CA]',
    accentBar: 'from-[#EEF2FF]/70 via-white to-white',
  },
  teal: {
    iconBox: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
    eyebrow: 'text-[#0D9488]',
    accentBar: 'from-[#F0FDFA]/70 via-white to-white',
  },
  violet: {
    iconBox: 'bg-[#F5F3FF] text-[#7C3AED] border border-violet-200/80',
    eyebrow: 'text-[#7C3AED]',
    accentBar: 'from-[#F5F3FF]/70 via-white to-white',
  },
  amber: {
    iconBox: 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/80',
    eyebrow: 'text-[#B45309]',
    accentBar: 'from-[#FEF3C7]/45 via-white to-white',
  },
  coral: {
    iconBox: 'bg-[#FFF1F2] text-[#E11D48] border border-rose-200/80',
    eyebrow: 'text-[#E11D48]',
    accentBar: 'from-[#FFF1F2]/60 via-white to-white',
  },
};

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  eyebrow,
  title,
  description,
  icon,
  accent = 'indigo',
  metaRight,
  actions,
  footerMeta,
}) => {
  const tone = TONE_CLASSES[accent];

  return (
    <section
      className={`diario-card rounded-3xl p-4 sm:p-5 bg-gradient-to-br ${tone.accentBar} space-y-3`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 ${tone.iconBox}`}
          >
            {icon}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className={`text-xs font-bold tracking-tight ${tone.eyebrow}`}>
                {eyebrow}
              </span>
              {metaRight && (
                <>
                  <span aria-hidden="true" className="text-slate-300 text-xs">
                    ·
                  </span>
                  <div className="text-xs font-medium text-[#475569]">{metaRight}</div>
                </>
              )}
            </div>
            <h2 className="font-display font-bold text-xl sm:text-[22px] text-[#0F172A] leading-tight tracking-tight text-balance">
              {title}
            </h2>
          </div>
        </div>
      </div>

      <p className="text-[14px] text-[#334155] leading-relaxed max-w-2xl">
        {description}
      </p>

      {(actions || footerMeta) && (
        <div className="pt-1 flex flex-wrap items-center justify-between gap-2.5">
          {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
          {footerMeta && (
            <div className="text-xs text-[#475569] font-medium flex flex-wrap items-center gap-2">
              {footerMeta}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
