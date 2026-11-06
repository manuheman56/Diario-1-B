import React, { useState } from 'react';
import { AppConfig } from '../types';
import { multimediaAlbums, educationalVideos } from '../data/defaultData';
import {
  ExternalLink,
  ShieldCheck,
  Play,
  FolderOpen,
  Camera,
  Film,
  Lock,
  Sparkles,
  X,
} from 'lucide-react';

interface MultimediaTabProps {
  config: AppConfig;
}

export const MultimediaTab: React.FC<MultimediaTabProps> = ({ config }) => {
  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    videoUrl: string;
    subject: string;
  } | null>(null);

  return (
    <div className="space-y-4 pb-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-lg font-display font-bold text-slate-900">
          Rincón Audiovisual del Aula
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Espacio escolar seguro para consultar fotos de talleres, excursiones y
          recursos multimedia educativos.
        </p>
      </div>

      {/* 1. Google Drive Card */}
      <div className="bg-gradient-to-br from-sky-50 via-blue-50/70 to-indigo-50/60 border border-blue-200/90 rounded-3xl p-4.5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Álbumes de Fotos en Google Drive
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Imágenes de actividades y proyectos de clase
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Lock className="w-2.5 h-2.5" />
            Privado
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-2xl border border-blue-100/80">
          Carpeta en la nube exclusiva para padres y tutores legales de 1º de
          Primaria. Configurada en modo solo lectura para garantizar la máxima
          seguridad.
        </p>

        {/* Album highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {multimediaAlbums.map((alb) => (
            <a
              key={alb.id}
              href={config.driveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-2xs hover:border-blue-300 hover:shadow-xs transition"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden mb-2 bg-slate-100">
                <img
                  src={alb.coverUrl}
                  alt={alb.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded-md">
                  {alb.count}
                </span>
              </div>
              <h4 className="font-bold text-[11px] text-slate-800 truncate">
                {alb.title}
              </h4>
              <p className="text-[10px] text-slate-400">{alb.date}</p>
            </a>
          ))}
        </div>

        <a
          href={config.driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Acceder a la Carpeta de Google Drive</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* 2. YouTube Classroom Channel Card */}
      <div className="bg-gradient-to-br from-rose-50 via-red-50/70 to-amber-50/50 border border-red-200/90 rounded-3xl p-4.5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-red-600 shrink-0 border border-red-100">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Canal Educativo de YouTube
              </h3>
              <p className="text-[11px] text-slate-500">
                Vídeos de apoyo, experimentos y canciones trabajadas
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Sparkles className="w-2.5 h-2.5" />
            Vídeos
          </span>
        </div>

        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {educationalVideos.map((vid) => (
            <div
              key={vid.id}
              onClick={() => setActiveVideo(vid)}
              className="bg-white rounded-2xl p-2.5 border border-slate-200 shadow-2xs hover:border-red-300 hover:shadow-xs transition cursor-pointer group"
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 mb-2">
                <img
                  src={vid.thumbnail}
                  alt={vid.title}
                  className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-300"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {vid.duration}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-red-700 transition">
                {vid.title}
              </h4>
              <span className="text-[10px] text-slate-500">{vid.subject}</span>
            </div>
          ))}
        </div>

        <a
          href={config.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5" />
          <span>Ver Canal Oficial en YouTube</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>

      {/* 3. RGPD & Privacy Shield reminder */}
      <div className="p-4 bg-slate-100/90 border border-slate-200 rounded-3xl flex items-start gap-3 text-slate-700 text-xs leading-relaxed shadow-xs">
        <span className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </span>
        <div>
          <strong className="block text-slate-900 font-bold mb-0.5">
            Compromiso de Privacidad y Normativa RGPD
          </strong>
          Este portal escolar y sus enlaces asociados son para el uso estricto y
          privado de las familias de la clase. Queda terminantemente prohibido
          descargar, difundir o publicar fotos o vídeos de menores en redes
          sociales públicas personales.
        </div>
      </div>

      {/* Video Preview Modal */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl space-y-3">
            <div className="p-4 pb-0 flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm">
                  {activeVideo.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {activeVideo.subject}
                </p>
              </div>
              <button
                onClick={() => setActiveVideo(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black">
              <iframe
                src={`${activeVideo.videoUrl}?autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 pt-1 flex justify-end">
              <button
                onClick={() => setActiveVideo(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800"
              >
                Cerrar reproductor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
