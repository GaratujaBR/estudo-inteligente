import { useState, useEffect } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { X, BarChart2 } from 'lucide-react';

const STORAGE_KEY = 'data_ultima_reavaliacao';
const INTERVALO_DIAS = 14;

interface ModalReavaliacaoProps {
  onIrParaDiagnostico: () => void;
}

export default function ModalReavaliacao({ onIrParaDiagnostico }: ModalReavaliacaoProps) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return; // Não mostra no primeiro uso — espera ter histórico

    const diasPassados = differenceInDays(new Date(), parseISO(stored));
    if (diasPassados >= INTERVALO_DIAS) {
      setVisivel(true);
    }
  }, []);

  const dispensar = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisivel(false);
  };

  const irParaDiagnostico = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setVisivel(false);
    onIrParaDiagnostico();
  };

  if (!visivel) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
            <BarChart2 size={20} className="text-blue-500" />
          </div>
          <button onClick={dispensar} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-1">
          Hora de reavaliar?
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Faz {INTERVALO_DIAS} dias desde seu último diagnóstico. Seu nível em alguma disciplina mudou?
        </p>

        <div className="flex flex-col gap-2">
          <button
            onClick={irParaDiagnostico}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Atualizar diagnóstico
          </button>
          <button
            onClick={dispensar}
            className="w-full py-2 text-gray-500 text-sm hover:text-gray-700"
          >
            Lembrar depois
          </button>
        </div>
      </div>
    </div>
  );
}

// Registra data quando usuário completa o diagnóstico pela primeira vez
export function registrarDiagnosticoConcluido(): void {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}
