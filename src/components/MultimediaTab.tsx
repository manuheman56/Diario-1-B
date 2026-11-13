import React from 'react';
import { AppConfig, MultimediaItem } from '../types';
import {
  ShieldCheck,
  Camera,
  ExternalLink,
  PartyPopper,
  Palette,
  FolderOpen,
  Youtube,
} from 'lucide-react';

interface MultimediaTabProps {
  config?: AppConfig;
  items?: MultimediaItem[];
}

interface DriveAlbumCard {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  cardClass: string;
  iconBgClass: string;
  footerClass: string;
}

const DRIVE_ALBUMS: DriveAlbumCard[] = [
  {
    id: 'fotografias-aula',
    title: 'Fotografías del aula',
    description: 'Un recuerdo de nuestras actividades y momentos compartidos en clase',
    url: 'https://drive.google.com/drive/folders/1WZvH8J46ub2uFwT34S2pE2XLWbHzUlNl?usp=drive_link',
    icon: <Camera className="w-5 h-5" />,
    cardClass:
      'bg-gradient-to-br from-sky-50 via-blue-50/60 to-white border-sky-200/90 hover:border-sky-300 focus-visible:ring-sky-500',
    iconBgClass: 'bg-sky-100 text-sky-700 border border-sky-200/80',
    footerClass: 'text-sky-700 border-sky-200/60',
  },
  {
    id: 'celebraciones',
    title: 'Celebraciones',
    description: 'Fiestas, acontecimientos y días especiales de nuestra clase',
    url: 'https://drive.google.com/drive/folders/1goiI0L52EvoTcYfyu_MYAUlAdTMDcbLy?usp=drive_link',
    icon: <PartyPopper className="w-5 h-5" />,
    cardClass:
      'bg-gradient-to-br from-amber-50 via-orange-50/50 to-white border-amber-200/90 hover:border-amber-300 focus-visible:ring-amber-500',
    iconBgClass: 'bg-amber-100 text-amber-700 border border-amber-200/80',
    footerClass: 'text-amber-700 border-amber-200/60',
  },
  {
    id: 'trabajos-proyectos',
    title: 'Trabajos y proyectos',
    description: 'Una ventana a las creaciones, actividades y proyectos del alumnado',
    url: 'https://drive.google.com/drive/folders/1rO4wE-kdI4m1PiJQw51x3X-MU0kiJZ0a?usp=drive_link',
    icon: <Palette className="w-5 h-5" />,
    cardClass:
      'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border-emerald-200/90 hover:border-emerald-300 focus-visible:ring-emerald-500',
    iconBgClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200/80',
    footerClass: 'text-emerald-700 border-emerald-200/60',
  },
];

export const MultimediaTab: React.FC<MultimediaTabProps> = () => {
  const handleOpenDriveFolder = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenYoutubeChannel = () => {
    window.open('https://www.youtube.com/@Hormiguitasde1oB', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-lg font-display font-bold text-slate-900">
          Rincón Audiovisual del Aula
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Entorno protegido de acceso exclusivo para familias de 1.º B.
          Álbumes compartidos y vídeos educativos del curso.
        </p>
      </div>

      {/* 1. Galería de fotografías - Tres carpetas independientes en Google Drive */}
      <section
        aria-labelledby="galeria-fotografias-heading"
        className="@container bg-white border border-slate-200/80 rounded-3xl p-4.5 shadow-card space-y-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-700 border border-sky-100 shadow-2xs flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="galeria-fotografias-heading"
                className="font-display font-bold text-slate-900 text-base leading-snug"
              >
                Galería de fotografías
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Compartimos con vosotros los mejores momentos de nuestra clase organizados por temáticas. Pulsad en cualquier tarjeta para abrir su álbum directamente en Google Drive.
              </p>
            </div>
          </div>
        </div>

        {/* Distribución vertical en móvil y adaptable en pantallas mayores */}
        <div className="grid grid-cols-1 @xl:grid-cols-3 gap-3">
          {DRIVE_ALBUMS.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => handleOpenDriveFolder(album.url)}
              aria-label={`${album.title}: abrir carpeta en Google Drive en una nueva pestaña`}
              className={`group w-full text-left rounded-2xl p-4 border shadow-2xs transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${album.cardClass}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105 ${album.iconBgClass}`}
                  >
                    {album.icon}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-600 border border-slate-200/80 shadow-2xs">
                    <span>Google Drive</span>
                  </span>
                </div>

                <h4 className="font-display font-bold text-sm text-slate-900 mt-3 leading-snug">
                  {album.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">
                  {album.description}
                </p>
              </div>

              <div
                className={`mt-3.5 pt-2.5 border-t flex items-center justify-between text-[11px] font-bold ${album.footerClass}`}
              >
                <span>Abrir álbum en Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 2. Vídeos del aula en YouTube */}
      <section
        aria-labelledby="videos-youtube-heading"
        className="bg-white border border-slate-200/80 rounded-3xl p-4.5 shadow-card space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-red-600 border border-rose-100 shadow-2xs flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3
              id="videos-youtube-heading"
              className="font-display font-bold text-slate-900 text-base leading-snug"
            >
              Vídeos del aula en YouTube
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              Acceded directamente al canal de clase para disfrutar en familia de los vídeos y actividades de nuestra aula.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenYoutubeChannel}
          aria-label="Nuestro canal de YouTube: abrir canal en una nueva pestaña"
          className="group w-full text-left rounded-2xl p-4 border shadow-2xs transition-all duration-200 cursor-pointer flex flex-col justify-between bg-gradient-to-br from-rose-50 via-red-50/60 to-white border-rose-200/90 hover:border-rose-300 active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-500"
        >
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs transition-transform duration-200 group-hover:scale-105 bg-red-600 text-white border border-red-500">
                <Youtube className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-red-700 border border-rose-200/80 shadow-2xs">
                <span>YouTube</span>
              </span>
            </div>

            <h4 className="font-display font-bold text-sm text-slate-900 mt-3 leading-snug">
              Nuestro canal de YouTube
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mt-1">
              ¡Visita nuestro canal, disfruta de nuestras actividades y suscríbete para no perderte ningún vídeo!
            </p>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-rose-200/60 flex items-center justify-between text-[11px] font-bold text-red-700">
            <span>Abrir canal en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </button>
      </section>

      {/* 3. RGPD & Privacy Shield reminder */}
      <div className="p-4 bg-slate-100/90 border border-slate-200 rounded-3xl flex items-start gap-3 text-slate-700 text-xs leading-relaxed shadow-xs">
        <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div>
          <strong className="block text-slate-900 font-bold mb-0.5">
            Aviso de Privacidad y Protección de Datos
          </strong>
          Este material audiovisual es de uso privado y exclusivo para el
          alumnado y familias de 1º de Primaria B del C.E.I.P. Dr. Fleming. Queda
          prohibida su descarga o difusión en redes sociales personales.
        </div>
      </div>

    </div>
  );
};
