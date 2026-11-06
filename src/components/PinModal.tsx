import React, { useState, useEffect } from 'react';
import { Lock, X, Delete, ShieldAlert, KeyRound } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);
      setErrorMsg('');

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    setErrorMsg('');
  };

  const verifyPin = (pinToTest: string) => {
    if (pinToTest === correctPin) {
      setError(false);
      onSuccess();
      onClose();
    } else {
      setError(true);
      setErrorMsg('PIN incorrecto. Inténtalo de nuevo.');
      setTimeout(() => {
        setPin('');
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xs rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100 text-center relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
          <KeyRound className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-display font-extrabold text-slate-900 text-base">
            Acceso Modo Docente
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Introduce el código PIN de 4 dígitos para acceder al panel de profesorado.
          </p>
        </div>

        {/* PIN Dots Display */}
        <div className={`flex justify-center gap-3 py-2 ${error ? 'animate-bounce' : ''}`}>
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled
                    ? error
                      ? 'bg-rose-500 border-rose-500 scale-110'
                      : 'bg-indigo-600 border-indigo-600 scale-110'
                    : 'border-slate-300 bg-slate-100'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <p className="text-xs font-bold text-rose-600 flex items-center justify-center gap-1 animate-in fade-in">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{errorMsg}</span>
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-bold text-lg border border-slate-200/80 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs border border-slate-200 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
          >
            Borrar
          </button>

          {/* Zero Button */}
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-50 hover:bg-indigo-50 active:bg-indigo-100 text-slate-800 hover:text-indigo-900 font-bold text-lg border border-slate-200/80 transition-all flex items-center justify-center shadow-2xs active:scale-95 cursor-pointer"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handleDelete}
            className="h-12 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 font-bold border border-slate-200 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
            title="Borrar dígito"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Helper Tip */}
        <div className="pt-2 text-[10px] text-slate-400 bg-slate-50 py-1.5 px-2 rounded-xl border border-slate-100">
          <span className="font-semibold text-slate-600">PIN por defecto:</span> 1234 (Modificable en Ajustes)
        </div>
      </div>
    </div>
  );
};
