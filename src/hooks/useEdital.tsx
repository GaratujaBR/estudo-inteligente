import { createContext, useContext, useReducer, useCallback, useEffect, type ReactNode } from 'react';
import { type EditalCompleto, type Concurso, type Disciplina, type Topico } from '../types';

const STORAGE_KEY = 'edital_completo';

type EditalAction =
  | { type: 'CARREGAR'; payload: EditalCompleto | null }
  | { type: 'SET_CONCURSO'; payload: Concurso }
  | { type: 'ADD_DISCIPLINA'; payload: Disciplina }
  | { type: 'UPDATE_DISCIPLINA'; payload: Disciplina }
  | { type: 'REMOVE_DISCIPLINA'; payload: string }
  | { type: 'ADD_TOPICO'; disciplinaId: string; payload: Topico }
  | { type: 'UPDATE_TOPICO'; disciplinaId: string; payload: Topico }
  | { type: 'REMOVE_TOPICO'; disciplinaId: string; topicoId: string }
  | { type: 'REORDER_TOPICOS'; disciplinaId: string; topicos: Topico[] };

function editalReducer(state: EditalCompleto | null, action: EditalAction): EditalCompleto | null {
  switch (action.type) {
    case 'CARREGAR':
      return action.payload;

    case 'SET_CONCURSO':
      return state
        ? { ...state, concurso: action.payload }
        : { concurso: action.payload, disciplinas: [] };

    case 'ADD_DISCIPLINA':
      return state
        ? { ...state, disciplinas: [...state.disciplinas, action.payload] }
        : null;

    case 'UPDATE_DISCIPLINA': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.map((d) =>
          d.id === action.payload.id ? action.payload : d
        ),
      };
    }

    case 'REMOVE_DISCIPLINA': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.filter((d) => d.id !== action.payload),
      };
    }

    case 'ADD_TOPICO': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.map((d) =>
          d.id === action.disciplinaId
            ? { ...d, topicos: [...d.topicos, action.payload] }
            : d
        ),
      };
    }

    case 'UPDATE_TOPICO': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.map((d) =>
          d.id === action.disciplinaId
            ? {
                ...d,
                topicos: d.topicos.map((t) =>
                  t.id === action.payload.id ? action.payload : t
                ),
              }
            : d
        ),
      };
    }

    case 'REMOVE_TOPICO': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.map((d) =>
          d.id === action.disciplinaId
            ? { ...d, topicos: d.topicos.filter((t) => t.id !== action.topicoId) }
            : d
        ),
      };
    }

    case 'REORDER_TOPICOS': {
      if (!state) return null;
      return {
        ...state,
        disciplinas: state.disciplinas.map((d) =>
          d.id === action.disciplinaId ? { ...d, topicos: action.topicos } : d
        ),
      };
    }

    default:
      return state;
  }
}

interface EditalContextType {
  edital: EditalCompleto | null;
  setConcurso: (concurso: Concurso) => void;
  addDisciplina: (disciplina: Disciplina) => void;
  updateDisciplina: (disciplina: Disciplina) => void;
  removeDisciplina: (id: string) => void;
  addTopico: (disciplinaId: string, topico: Topico) => void;
  updateTopico: (disciplinaId: string, topico: Topico) => void;
  removeTopico: (disciplinaId: string, topicoId: string) => void;
  reorderTopicos: (disciplinaId: string, topicos: Topico[]) => void;
}

const EditalContext = createContext<EditalContextType | null>(null);

export function EditalProvider({ children }: { children: ReactNode }) {
  const [edital, dispatch] = useReducer(editalReducer, null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        dispatch({ type: 'CARREGAR', payload: parsed });
      }
    } catch {
      console.warn('Erro ao carregar edital do localStorage');
    }
  }, []);

  useEffect(() => {
    if (edital) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(edital));
    }
  }, [edital]);

  const setConcurso = useCallback((concurso: Concurso) => {
    dispatch({ type: 'SET_CONCURSO', payload: concurso });
  }, []);

  const addDisciplina = useCallback((disciplina: Disciplina) => {
    dispatch({ type: 'ADD_DISCIPLINA', payload: disciplina });
  }, []);

  const updateDisciplina = useCallback((disciplina: Disciplina) => {
    dispatch({ type: 'UPDATE_DISCIPLINA', payload: disciplina });
  }, []);

  const removeDisciplina = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_DISCIPLINA', payload: id });
  }, []);

  const addTopico = useCallback((disciplinaId: string, topico: Topico) => {
    dispatch({ type: 'ADD_TOPICO', disciplinaId, payload: topico });
  }, []);

  const updateTopico = useCallback((disciplinaId: string, topico: Topico) => {
    dispatch({ type: 'UPDATE_TOPICO', disciplinaId, payload: topico });
  }, []);

  const removeTopico = useCallback((disciplinaId: string, topicoId: string) => {
    dispatch({ type: 'REMOVE_TOPICO', disciplinaId, topicoId });
  }, []);

  const reorderTopicos = useCallback((disciplinaId: string, topicos: Topico[]) => {
    dispatch({ type: 'REORDER_TOPICOS', disciplinaId, topicos });
  }, []);

  return (
    <EditalContext.Provider
      value={{
        edital,
        setConcurso,
        addDisciplina,
        updateDisciplina,
        removeDisciplina,
        addTopico,
        updateTopico,
        removeTopico,
        reorderTopicos,
      }}
    >
      {children}
    </EditalContext.Provider>
  );
}

export function useEdital(): EditalContextType {
  const context = useContext(EditalContext);
  if (!context) {
    throw new Error('useEdital deve ser usado dentro de um EditalProvider');
  }
  return context;
}
