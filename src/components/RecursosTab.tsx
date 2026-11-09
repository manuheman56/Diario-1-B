import React, { useState, useEffect } from 'react';
import { AppConfig, SubResourceTab } from '../types';
import { AprendemosTab } from './AprendemosTab';
import { MultimediaTab } from './MultimediaTab';
import { GraduationCap, Film } from 'lucide-react';

interface RecursosTabProps {
  config: AppConfig;
  initialSubView?: SubResourceTab;
}

export const RecursosTab: React.FC<RecursosTabProps> = ({
  config,
  initialSubView = 'aprendemos',
}) => {
  const [subView, setSubView] = useState<SubResourceTab>(initialSubView);

  useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  return (
    <div className="space-y-4 pb-6">
      {/* Top Segmented Switcher */}
      <div className="bg-slate-200/90 p-1 rounded-2xl flex text-xs font-bold shadow-inner">
        <button
          type="button"
          onClick={() => setSubView('aprendemos')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
            subView === 'aprendemos'
              ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap
            className={`w-3.5 h-3.5 ${
              subView === 'aprendemos' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span>Aprendemos (Recursos)</span>
        </button>

        <button
          type="button"
          onClick={() => setSubView('fotos')}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation ${
            subView === 'fotos'
              ? 'bg-white text-indigo-900 shadow-xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Film
            className={`w-3.5 h-3.5 ${
              subView === 'fotos' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          />
          <span>Fotos y Vídeos</span>
        </button>
      </div>

      {/* Content based on subView */}
      {subView === 'aprendemos' ? (
        <AprendemosTab />
      ) : (
        <MultimediaTab config={config} />
      )}
    </div>
  );
};
