import React from 'react';
import { AppConfig, MultimediaItem } from '../types';
import { SectionHeader } from './SectionHeader';
import { FormattedText } from './FormattedText';
import { NewBadge, MarkAsReadButton } from './NewBadge';
import { getPublicationKey } from '../utils/readStatusService';
import {
  ShieldCheck,
  Camera,
  ExternalLink,
  PartyPopper,
  Palette,
  FolderOpen,
  Youtube,
  Film,
  Image as ImageIcon,
} from 'lucide-react';

interface MultimediaTabProps {
  config?: AppConfig;
  items?: MultimediaItem[];
  unreadKeys?: ReadonlySet<string>;
  onMarkAsRead?: (publicationKey: string) => void;
}

interface DriveAlbumCard {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  iconBgClass: string;
  accentTextClass: string;
  cardSurfaceClass: string;
}

const DRIVE_ALBUMS: DriveAlbumCard[] = [
  {
    id: 'fotografias-aula',
    title: 'Fotografías del aula',
    description: 'Un recuerdo de nuestras actividades y momentos compartidos en clase',
    url: 'https://drive.google.com/drive/folders/1WZvH8J46ub2uFwT34S2pE2XLWbHzUlNl?usp=drive_link',
    icon: <Camera className="w-5 h-5" />,
    iconBgClass: 'bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80',
    accentTextClass: 'text-[#4338CA]',
    cardSurfaceClass: 'bg-gradient-to-br from-[#EEF2FF]/45 via-white to-white',
  },
  {
    id: 'celebraciones',
    title: 'Celebraciones',
    description: 'Fiestas, acontecimientos y días especiales de nuestra clase',
    url: 'https://drive.google.com/drive/folders/1goiI0L52EvoTcYfyu_MYAUlAdTMDcbLy?usp=drive_link',
    icon: <PartyPopper className="w-5 h-5" />,
    iconBgClass: 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]',
    accentTextClass: 'text-[#B45309]',
    cardSurfaceClass: 'bg-gradient-to-br from-[#FEF3C7]/45 via-white to-white',
  },
  {
    id: 'trabajos-proyectos',
    title: 'Trabajos y proyectos',
    description: 'Una ventana a las creaciones, actividades y proyectos del alumnado',
    url: 'https://drive.google.com/drive/folders/1rO4wE-kdI4m1PiJQw51x3X-MU0kiJZ0a?usp=drive_link',
    icon: <Palette className="w-5 h-5" />,
    iconBgClass: 'bg-[#F0FDFA] text-[#0D9488] border border-teal-200/80',
    accentTextClass: 'text-[#0F766E]',
    cardSurfaceClass: 'bg-gradient-to-br from-[#F0FDFA]/55 via-white to-white',
  },
];

export const MultimediaTab: React.FC<MultimediaTabProps> = ({
  items = [],
  unreadKeys,
  onMarkAsRead,
}) => {
  const handleOpenDriveFolder = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenYoutubeChannel = () => {
    window.open('https://www.youtube.com/@Hormiguitasde1oB', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-6 diario-fade-in">
      {/* 1. Cabecera unificada */}
      <SectionHeader
        eyebrow="Espacio Familiar Seguro"
        metaRight="1.º de Primaria B"
        title="Rincón Audiovisual del Aula"
        description="Entorno protegido de acceso exclusivo para familias de 1.º B. Álbumes compartidos en Google Drive y vídeos educativos del curso."
        icon={<Camera className="w-5 h-5" />}
        accent="indigo"
      />

      {/* 1b. Bloque discreto de publicaciones recientes procedentes de Google Sheets */}
      {items.length > 0 && (
        <section
          aria-labelledby="multimedia-recientes-heading"
          className="diario-card rounded-3xl p-4 sm:p-5 space-y-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="multimedia-recientes-heading"
                className="font-display font-bold text-[#0F172A] text-base leading-snug"
              >
                Publicaciones recientes
              </h3>
              <p className="text-[13.5px] text-[#334155] leading-relaxed mt-0.5">
                Últimas fotografías y vídeos compartidos desde el aula.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {items.map((item) => {
              const itemKey = getPublicationKey('multimedia', item);
              const isUnread = Boolean(unreadKeys?.has(itemKey));
              const isVideo = item.tipo === 'VIDEO';

              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[#E2E8F0] bg-[#F7F8FA]/70 p-3.5 sm:p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        className={`inline-flex items-center gap-1.5 font-bold ${
                          isVideo ? 'text-[#BE123C]' : 'text-[#4338CA]'
                        }`}
                      >
                        {isVideo ? (
                          <Film className="w-3.5 h-3.5" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5" />
                        )}
                        <span>{isVideo ? 'Vídeo' : 'Fotografía'}</span>
                      </span>
                      {item.actividad_relacionada && (
                        <>
                          <span aria-hidden="true" className="text-slate-300">
                            ·
                          </span>
                          <span className="text-[#475569] font-medium truncate">
                            {item.actividad_relacionada}
                          </span>
                        </>
                      )}
                      {isUnread && (
                        <NewBadge variant={isVideo ? 'coral' : 'indigo'} />
                      )}
                    </div>

                    {item.fecha && (
                      <span className="text-xs text-[#475569] font-medium tabular-nums shrink-0">
                        {item.fecha}
                      </span>
                    )}
                  </div>

                  <h4 className="font-display font-bold text-[15px] text-[#0F172A] leading-snug">
                    {item.titulo}
                  </h4>

                  {item.descripcion && (
                    <FormattedText
                      text={item.descripcion}
                      size="sm"
                      accent={isVideo ? 'coral' : 'indigo'}
                    />
                  )}

                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                    {item.url_media ? (
                      <a
                        href={item.url_media}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (isUnread) onMarkAsRead?.(itemKey);
                        }}
                        className={`min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border diario-press ${
                          isVideo
                            ? 'bg-white hover:bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]'
                            : 'bg-white hover:bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]'
                        }`}
                      >
                        <span>{isVideo ? 'Ver vídeo' : 'Abrir fotografía'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span />
                    )}

                    {isUnread && (
                      <MarkAsReadButton
                        compact
                        onClick={() => onMarkAsRead?.(itemKey)}
                      />
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Galería de fotografías - Tres carpetas en Google Drive */}
      <section
        aria-labelledby="galeria-fotografias-heading"
        className="diario-card rounded-3xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] text-[#4338CA] border border-[#C7D2FE]/80 flex items-center justify-center shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="galeria-fotografias-heading"
              className="font-display font-bold text-[#0F172A] text-base leading-snug"
            >
              Galería de fotografías
            </h3>
            <p className="text-[14px] text-[#334155] leading-relaxed mt-1">
              Compartimos con vosotros los mejores momentos de nuestra clase organizados por temáticas. Pulsa en cualquier tarjeta para abrir su álbum directamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {DRIVE_ALBUMS.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => handleOpenDriveFolder(album.url)}
              aria-label={`${album.title}: abrir carpeta en Google Drive en una nueva pestaña`}
              className={`group w-full text-left rounded-2xl p-4 diario-card-interactive diario-press cursor-pointer flex flex-col justify-between ${album.cardSurfaceClass}`}
            >
              <div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${album.iconBgClass}`}
                >
                  {album.icon}
                </div>

                <h4 className="font-display font-bold text-[15px] text-[#0F172A] mt-3 leading-snug">
                  {album.title}
                </h4>
                <p className="text-[13.5px] text-[#334155] leading-relaxed mt-1.5">
                  {album.description}
                </p>
              </div>

              <div
                className={`mt-4 pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs font-bold ${album.accentTextClass}`}
              >
                <span>Abrir en Google Drive</span>
                <ExternalLink className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Vídeos del aula en YouTube */}
      <section
        aria-labelledby="videos-youtube-heading"
        className="diario-card rounded-3xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#FFF1F2] text-[#E11D48] border border-[#FECDD3] flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="videos-youtube-heading"
              className="font-display font-bold text-[#0F172A] text-base leading-snug"
            >
              Vídeos del aula en YouTube
            </h3>
            <p className="text-[14px] text-[#334155] leading-relaxed mt-1">
              Accede directamente al canal de clase para disfrutar en familia de los vídeos y actividades de nuestra aula.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenYoutubeChannel}
          aria-label="Nuestro canal de YouTube: abrir canal en una nueva pestaña"
          className="group w-full text-left rounded-2xl p-4 sm:p-5 diario-card-interactive diario-press cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#FFF1F2]/60 via-white to-white"
        >
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-[#E11D48] text-white shadow-xs">
              <Youtube className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-display font-bold text-[15px] text-[#0F172A] leading-snug">
                Canal «Las Hormiguitas de 1.º B»
              </h4>
              <p className="text-[13.5px] text-[#334155] leading-relaxed mt-1.5">
                Visita nuestro canal para ver vídeos de actividades, canciones y proyectos del aula.
              </p>
            </div>
          </div>

          <span className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-[#FECDD3] text-[#BE123C] text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0">
            <span>Abrir canal en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </button>
      </section>

      {/* 4. Aviso de Privacidad y Protección de Datos */}
      <footer className="p-4 sm:p-5 bg-[#F1F5F9] border border-[#E2E8F0] rounded-3xl flex items-start gap-3.5 text-[#334155] text-xs leading-relaxed">
        <span className="w-10 h-10 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-[#4338CA] shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </span>
        <div className="space-y-1.5 min-w-0">
          <strong className="block font-display text-sm text-[#0F172A] font-bold">
            Aviso de privacidad y protección de datos
          </strong>
          <FormattedText
            size="sm"
            accent="indigo"
            text={
              'Este material audiovisual es de uso privado y exclusivo para el alumnado y las familias de 1.º de Primaria B.\nQueda prohibida su descarga o difusión en redes sociales personales.'
            }
          />
        </div>
      </footer>
    </div>
  );
};
