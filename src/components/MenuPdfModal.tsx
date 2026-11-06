import React from 'react';
import { X, FileText, Download, Printer, Apple, Check, Shield } from 'lucide-react';
import { weeklyDiningMenu } from '../data/defaultData';

interface MenuPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownloadToast: () => void;
}

export const MenuPdfModal: React.FC<MenuPdfModalProps> = ({
  isOpen,
  onClose,
  onDownloadToast,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm shadow-xs">
              <FileText className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-sm sm:text-base">
                Menú Escolar Saludable - Noviembre 2026
              </h3>
              <p className="text-[10px] text-slate-400">
                CEIP San Juan Bautista · Servicio de Comedor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nutritional Quality Badge */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
          <Apple className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <strong>Plan Nutricional Acreditado:</strong> Elaborado con productos
            de cercanía, aceite de oliva virgen extra y fruta ecológica. Adaptado
            para celiaquía, intolerancia a la lactosa y menús vegetarianos.
          </div>
        </div>

        {/* Weekly Table View */}
        <div className="space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-slate-50/50">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider px-1">
            Menú Semanal Rotativo
          </h4>
          <div className="space-y-2">
            {weeklyDiningMenu.map((m) => (
              <div
                key={m.day}
                className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-indigo-900">{m.day}</span>
                  <span className="text-[10px] text-slate-400">{m.calories}</span>
                </div>
                <p className="text-slate-800 font-medium">
                  <strong>1º:</strong> {m.firstCourse}
                </p>
                <p className="text-slate-800 font-medium">
                  <strong>2º:</strong> {m.secondCourse} ({m.garnish})
                </p>
                <p className="text-emerald-700 font-semibold text-[11px]">
                  <strong>Postre:</strong> {m.dessert}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dinner recommendation */}
        <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-[11px] text-indigo-950 space-y-1">
          <strong className="block text-indigo-900">
            Sugerencia para las cenas en casa:
          </strong>
          <p className="leading-relaxed">
            Si a mediodía se ha consumido pasta o legumbre, se recomienda cenar
            crema de verduras o pescado suave a la plancha para mantener una dieta
            balanceada.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => {
              window.print();
            }}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir</span>
          </button>

          <button
            onClick={() => {
              onDownloadToast();
              onClose();
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
