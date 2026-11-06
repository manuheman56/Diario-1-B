import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { X, Sliders, RotateCcw, Save, KeyRound, Table, HelpCircle, CheckCircle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
  onRestoreDefaults: () => void;
  onTestSheetsUrl?: (url: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onRestoreDefaults,
}) => {
  const [formData, setFormData] = useState<AppConfig>(config);
  const [pinError, setPinError] = useState<string>('');

  useEffect(() => {
    setFormData(config);
    setPinError('');
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate PIN (must be 4 digits)
    if (!/^\d{4}$/.test(formData.teacherPin)) {
      setPinError('El PIN docente debe tener exactamente 4 números.');
      return;
    }

    onSaveConfig(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center text-sm shadow-xs">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="font-display font-extrabold text-slate-900 text-base">
              Ajustes del Aula & Centro
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Configura los datos del aula, el PIN de seguridad docente y la sincronización con Google Sheets.
        </p>

        {/* Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Section 1: Seguridad PIN Docente */}
          <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-purple-900 flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-purple-700" />
              <span>PIN de Seguridad Docente (4 dígitos) *</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                value={formData.teacherPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setFormData({ ...formData, teacherPin: val });
                  if (val.length === 4) setPinError('');
                }}
                placeholder="1234"
                className="w-28 text-center tracking-widest font-mono text-base font-bold px-3 py-2 rounded-xl border border-purple-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <span className="text-[11px] text-purple-800 leading-tight">
                Protege el cambio al modo profesor. Por defecto es <strong>1234</strong>.
              </span>
            </div>
            {pinError && (
              <p className="text-[11px] font-bold text-rose-600">{pinError}</p>
            )}
          </div>

          {/* Section 2: Sincronización con Google Sheets */}
          <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-emerald-950 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Table className="w-4 h-4 text-emerald-700" />
                <span>URL de Google Sheets (Publicada en la web)</span>
              </span>
              <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-semibold">
                CSV / JSON
              </span>
            </label>
            <input
              type="url"
              value={formData.sheetsUrl}
              onChange={(e) =>
                setFormData({ ...formData, sheetsUrl: e.target.value })
              }
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              className="w-full text-xs px-3 py-2 rounded-xl border border-emerald-300 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono text-[11px]"
            />
            <div className="text-[10px] text-emerald-900/90 leading-relaxed bg-white/70 p-2 rounded-xl border border-emerald-200/60">
              <span className="font-bold flex items-center gap-1 mb-0.5">
                <HelpCircle className="w-3 h-3 text-emerald-600" />
                Cómo publicar tu hoja de cálculo:
              </span>
              En Google Sheets: <em>Archivo &gt; Compartir &gt; Publicar en la web &gt; Seleccionar "Valores separados por comas (.csv)" &gt; Publicar</em>.
              Columnas requeridas: <code className="bg-emerald-100 px-1 rounded">fecha</code>, <code className="bg-emerald-100 px-1 rounded">categoria</code>, <code className="bg-emerald-100 px-1 rounded">titulo</code>, <code className="bg-emerald-100 px-1 rounded">mensaje</code>, <code className="bg-emerald-100 px-1 rounded">icono</code>.
            </div>
          </div>

          {/* Section 3: Datos de la Clase */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Curso / Grupo
            </label>
            <input
              type="text"
              required
              value={formData.classTitle}
              onChange={(e) =>
                setFormData({ ...formData, classTitle: e.target.value })
              }
              placeholder="Ej: 1º Primaria A"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del Colegio / Centro Escolar
            </label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={(e) =>
                setFormData({ ...formData, schoolName: e.target.value })
              }
              placeholder="Ej: CEIP San Juan Bautista"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de la Tutora/Docente
              </label>
              <input
                type="text"
                required
                value={formData.teacherName}
                onChange={(e) =>
                  setFormData({ ...formData, teacherName: e.target.value })
                }
                placeholder="Ej: Elena Ramos (Tutora)"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Teléfono de Secretaría
              </label>
              <input
                type="tel"
                required
                value={formData.schoolPhone}
                onChange={(e) =>
                  setFormData({ ...formData, schoolPhone: e.target.value })
                }
                placeholder="Ej: 912 345 678"
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Correo Electrónico de Tutoría
            </label>
            <input
              type="email"
              required
              value={formData.teacherEmail}
              onChange={(e) =>
                setFormData({ ...formData, teacherEmail: e.target.value })
              }
              placeholder="Ej: profesora1a@sanjuan.es"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Horario Habitual de Tutorías
            </label>
            <input
              type="text"
              required
              value={formData.tutoriaScheduleText}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tutoriaScheduleText: e.target.value,
                })
              }
              placeholder="Ej: Martes de 16:00 a 17:30 h (Previa cita)"
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enlace a Google Drive (Álbum de Fotos)
            </label>
            <input
              type="url"
              required
              value={formData.driveUrl}
              onChange={(e) =>
                setFormData({ ...formData, driveUrl: e.target.value })
              }
              placeholder="https://drive.google.com/..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Enlace al Canal de YouTube
            </label>
            <input
              type="url"
              required
              value={formData.youtubeUrl}
              onChange={(e) =>
                setFormData({ ...formData, youtubeUrl: e.target.value })
              }
              placeholder="https://youtube.com/..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>

            <button
              type="button"
              onClick={onRestoreDefaults}
              className="text-xs text-rose-600 font-semibold py-1.5 hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer datos y avisos de ejemplo iniciales</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
