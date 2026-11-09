import React, { useState } from 'react';
import { AppConfig } from '../types';
import { multimediaAlbums, educationalVideos } from '../data/defaultData';
import {
  ShieldCheck,
  Play,
  FolderLock,
  Camera,
  Film,
  Lock,
  X,
  ExternalLink,
  Info,
} from 'lucide-react';

interface MultimediaTabProps {
  config: AppConfig;
}

export const MultimediaTab: React.FC<MultimediaTabProps> = ({ config }) => {
  const [activeVideo, setActiveVideo] = useState<{
    title: string;
    embedUrl: string;
    subject: string;
  } | null>(null);

  const [selectedAlbum, setSelectedAlbum] = useState<typeof multimediaAlbums[0] | null>(null);
  const [showDriveInfoModal, setShowDriveInfoModal] = useState(false);

  // Sanitiza el enlace de Google Drive para garantizar que SOLO apunte a una carpeta específica
  const getAuthorizedFolderUrl = (): string | null => {
    const raw = config.driveFolderUrl || '';
    if (!raw || raw.includes('PEGA_AQUÍ') || raw.startsWith('[')) {
      return null;
    }
    // Si ya es un enlace de carpeta completo
    if (raw.startsWith('http')) {
      return raw;
    }
    // Si es solo el ID de la carpeta
    return `https://drive.google.com/drive/folders/${raw}`;
  };

  const authorizedFolderUrl = getAuthorizedFolderUrl();

  const handleOpenDriveFolder = () => {
    if (authorizedFolderUrl) {
      window.open(authorizedFolderUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowDriveInfoModal(true);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Intro Header */}
      <div>
        <h2 className="text-lg font-display font-bold text-slate-900">
          Rincón Audiovisual del Aula
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Entorno protegido de acceso exclusivo para familias de 1º B.
          Archivos y vídeos restringidos a las carpetas escolares autorizadas.
        </p>
      </div>

      {/* 1. Google Drive Card - Restringido a Carpeta Específica */}
      <div className="bg-gradient-to-br from-sky-50 via-blue-50/70 to-indigo-50/60 border border-blue-200/90 rounded-3xl p-4.5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-blue-600 shrink-0 border border-blue-100">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  Carpeta de Fotos de Clase
                </h3>
              </div>
              <p className="text-[11px] text-slate-500">
                Acceso restringido únicamente a la carpeta del curso
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Lock className="w-2.5 h-2.5" />
            Ruta Segura
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-2xl border border-blue-100/80">
          Por privacidad y seguridad, esta sección está configurada para filtrar
          únicamente la carpeta específica de 1º de Primaria B, sin acceso al
          resto del almacenamiento en la nube.
        </p>

        {/* Álbumes autorizados dentro de la app */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {multimediaAlbums.map((alb) => (
            <div
              key={alb.id}
              onClick={() => setSelectedAlbum(alb)}
              className="group block bg-white rounded-2xl p-2.5 border border-slate-200/70 shadow-2xs hover:border-blue-300 hover:shadow-xs transition cursor-pointer"
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
            </div>
          ))}
        </div>

        {/* Botón único a la carpeta autorizada (sin explorador general de Drive) */}
        <button
          onClick={handleOpenDriveFolder}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition active:scale-98 cursor-pointer"
        >
          <FolderLock className="w-3.5 h-3.5" />
          <span>Abrir Carpeta Autorizada del Aula</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>

      {/* 2. YouTube - Reproductor Seguro en App (Sin enlaces externos al canal general) */}
      <div className="bg-gradient-to-br from-rose-50 via-red-50/70 to-amber-50/50 border border-red-200/90 rounded-3xl p-4.5 shadow-card space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white shadow-xs flex items-center justify-center text-red-600 shrink-0 border border-red-100">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm">
                Vídeos Educativos del Aula
              </h3>
              <p className="text-[11px] text-slate-500">
                Reproducción segura dentro de la app sin acceso a canales personales
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
            <Lock className="w-2.5 h-2.5" />
            Privado
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-2xl border border-red-100/80">
          Los contenidos se reproducen directamente en el visor interno con modo
          de privacidad activa, sin sugerencias de cuentas personales ni enlaces
          al canal principal.
        </p>

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
      </div>

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

      {/* Modal Reproductor de Vídeo Interno Seguro */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
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
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Iframe con privacidad estricta (sin enlaces a cuentas personales) */}
            <div className="relative aspect-video bg-black">
              <iframe
                src={`${activeVideo.embedUrl}&autoplay=1`}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-4 pt-1 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Reproducción en entorno protegido
              </span>
              <button
                onClick={() => setActiveVideo(null)}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 cursor-pointer active:scale-95"
              >
                Cerrar reproductor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Álbum Interno */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-display font-bold text-slate-900 text-sm">
                  {selectedAlbum.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedAlbum.date} · {selectedAlbum.count}
                </p>
              </div>
              <button
                onClick={() => setSelectedAlbum(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedAlbum.coverUrl}
                alt={selectedAlbum.title}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              Fotografías archivadas en la carpeta de aula protegida de 1º B.
              Consulte con el tutor Manuel Herrera si requiere alguna copia para el dosier del alumno/a.
            </p>

            <button
              onClick={() => setSelectedAlbum(null)}
              className="w-full bg-slate-900 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-800"
            >
              Cerrar visualizador
            </button>
          </div>
        </div>
      )}

      {/* Modal informativo si aún no se ha especificado el enlace de carpeta */}
      {showDriveInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
              <FolderLock className="w-5 h-5" />
            </div>
            <div className="text-center">
              <h4 className="font-display font-bold text-slate-900 text-sm">
                Carpeta Protegida de Google Drive
              </h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                El acceso a Google Drive está estrictamente restringido a la
                carpeta específica del curso para proteger el resto del
                almacenamiento.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Ruta Autorizada:</span>
              </div>
              <p className="italic text-slate-500">
                1º de Primaria B - C.E.I.P. Dr. Fleming
              </p>
            </div>
            <button
              onClick={() => setShowDriveInfoModal(false)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl font-bold text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
