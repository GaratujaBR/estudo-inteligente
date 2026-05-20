import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { type RegistroErro } from '../types';

const STORAGE_KEY = 'planilha_erros';

type ErroAction =
  | { type: 'REGISTRAR'; topicoId: string; disciplina: string }
  | { type: 'MARCAR_DOMINADO'; topicoId: string }
  | { type: 'MARCAR_REVISADO'; topicoId: string };

function erroReducer(state: RegistroErro[], action: ErroAction): RegistroErro[] {
  switch (action.type) {
    case 'REGISTRAR': {
      const existing = state.find((e) => e.topico_id === action.topicoId);
      if (existing) {
        return state.map((e) =>
          e.topico_id === action.topicoId
            ? { ...e, vezes_errada: e.vezes_errada + 1, ultimo_erro: new Date().toISOString(), status: 'pendente' }
            : e
        );
      }
      return [
        ...state,
        {
          topico_id: action.topicoId,
          disciplina: action.disciplina,
          vezes_errada: 1,
          ultimo_erro: new Date().toISOString(),
          status: 'pendente',
        },
      ];
    }

    case 'MARCAR_DOMINADO':
      return state.map((e) =>
        e.topico_id === action.topicoId ? { ...e, status: 'dominado' } : e
      );

    case 'MARCAR_REVISADO':
      return state.map((e) =>
        e.topico_id === action.topicoId ? { ...e, status: 'revisado' } : e
      );

    default:
      return state;
  }
}

interface ErrosContextType {
  erros: RegistroErro[];
  registrarErro: (topicoId: string, disciplina: string) => void;
  marcarDominado: (topicoId: string) => void;
  marcarRevisado: (topicoId: string) => void;
  getErrosAtivos: () => RegistroErro[];
  getVezesErrada: (topicoId: string) => number;
}

const ErrosContext = createContext<ErrosContextType | null>(null);

export function ErrosProvider({ children }: { children: ReactNode }) {
  const [erros, dispatch] = useReducer(erroReducer, [], () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(erros));
  }, [erros]);

  const registrarErro = useCallback((topicoId: string, disciplina: string) => {
    dispatch({ type: 'REGISTRAR', topicoId, disciplina });
  }, []);

  const marcarDominado = useCallback((topicoId: string) => {
    dispatch({ type: 'MARCAR_DOMINADO', topicoId });
  }, []);

  const marcarRevisado = useCallback((topicoId: string) => {
    dispatch({ type: 'MARCAR_REVISADO', topicoId });
  }, []);

  const getErrosAtivos = useCallback(
    () => erros.filter((e) => e.status !== 'dominado'),
    [erros]
  );

  const getVezesErrada = useCallback(
    (topicoId: string) => erros.find((e) => e.topico_id === topicoId)?.vezes_errada ?? 0,
    [erros]
  );

  return (
    <ErrosContext.Provider
      value={{ erros, registrarErro, marcarDominado, marcarRevisado, getErrosAtivos, getVezesErrada }}
    >
      {children}
    </ErrosContext.Provider>
  );
}

export function useErros(): ErrosContextType {
  const ctx = useContext(ErrosContext);
  if (!ctx) throw new Error('useErros deve ser usado dentro de ErrosProvider');
  return ctx;
}
