import React from 'react';
import { Sparkles, ArrowRight, X } from 'lucide-react';
import {
  UnreadCountsBySection,
  UnreadSectionId,
} from '../utils/readStatusService';

interface NovedadesBannerProps {
  totalUnread: number;
  unreadCounts: UnreadCountsBySection;
  firstUnreadSection: UnreadSectionId | null;
  onConsultSection: (section: UnreadSectionId) => void;
  onDismiss: () => void;
}

const SECTION_LABELS: Record<UnreadSectionId, string> = {
  avisos: 'Avisos',
  diario: 'Día a día',
  calendario: 'Calendario',
  aprendemos: 'Aprendemos',
  recursos: 'Recursos',
  multimedia: 'Multimedia',
};

const DISPLAY_ORDER: UnreadSectionId[] = [
  'avisos',
  'diario',
  'calendario',
  'aprendemos',
  'recursos',
  'multimedia',
];

/**
 * Aviso discreto al entrar en la aplicación cuando existen publicaciones nuevas pendientes.
 * Se muestra como máximo una vez por sesión y no tapa contenido ni interrumpe la navegación.
 */
export const NovedadesBanner: React.FC<NovedadesBannerProps> = ({
  totalUnread,
  unreadCounts,
  firstUnreadSection,
  onConsultSection,
  onDismiss,
}) => {
  if (totalUnread <= 0 || !firstUnreadSection) return null;

  const sectionsWithUnread = DISPLAY_ORDER.filter(
    (section) => unreadCounts[section] > 0
  );

  const countText =
    totalUnread === 1
      ? 'Hay 1 publicación nueva pendiente de consultar.'
      : `Hay ${totalUnread} publicaciones nuevas pendientes de consultar.`;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="bg-white rounded-3xl border border-[#C7D2FE] shadow-xs p-4 sm:p-4.5 diario-slide-down"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/90 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" strokeWidth={1.9} />
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display font-bold text-[15px] text-[#0F172A] leading-snug">
              ¡Tenemos novedades en nuestra aula!
            </p>
            <p className="text-[13px] text-[#334155] leading-relaxed">
              {countText}
            </p>

            {/* Accesos rápidos a las secciones con novedades */}
            {sectionsWithUnread.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {sectionsWithUnread.map((section) => (
                  <button
                    key={section}
                    type="button"
                    onClick={() => onConsultSection(section)}
                    className="min-h-[32px] px-2.5 py-1 rounded-xl bg-[#F7F8FA] hover:bg-[#EEF2FF] border border-[#E2E8F0] hover:border-[#C7D2FE] text-[11.5px] font-semibold text-[#334155] hover:text-[#4338CA] inline-flex items-center gap-1.5 cursor-pointer diario-press"
                  >
                    <span>{SECTION_LABELS[section]}</span>
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#4338CA] text-white text-[10px] font-bold tabular-nums inline-flex items-center justify-center">
                      {unreadCounts[section]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => onConsultSection(firstUnreadSection)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer diario-press shadow-xs"
              >
                <span>Consultar novedades</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar aviso de novedades"
          className="min-w-[40px] min-h-[40px] -mt-1 -mr-1 rounded-xl text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] flex items-center justify-center shrink-0 cursor-pointer diario-press"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
