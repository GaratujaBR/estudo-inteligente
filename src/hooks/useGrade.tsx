import { createContext, useCallback, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { format, addDays, isBefore, parseISO } from 'date-fns';
import { type SessaoGrade } from '../types';

const STORAGE_KEY = 'grade_semanal';

type GradeAction =
  | { type: 'DEFINIR'; payload: SessaoGrade[] }
  | { type: 'MARCAR_CONCLUIDO'; id: string }
  | { type: 'ADD_SESSAO'; payload: SessaoGrade }
  | { type: 'REGISTRAR_REVISOES_ATRASADAS'; hoje: string };

function gradeReducer(state: SessaoGrade[], action: GradeAction): SessaoGrade[] {
  switch (action.type) {
    case 'DEFINIR':
      return action.payload;

    case 'MARCAR_CONCLUIDO': {
      const sessao = state.find((s) => s.id === action.id);
      if (!sessao || sessao.concluido) return state;

      const revisao: SessaoGrade = {
        id: crypto.randomUUID(),
        data: format(addDays(parseISO(sessao.data), 1), 'yyyy-MM-dd'),
        horario: sessao.horario,
        tipo: 'revisao24h',
        disciplina_id: sessao.disciplina_id,
        topico_id: sessao.topico_id,
        topico_nome: sessao.topico_nome,
        disciplina_nome: sessao.disciplina_nome,
        zona: sessao.zona,
        tempo_min: Math.max(10, Math.round(sessao.tempo_min * 0.25)),
        concluido: false,
      };

      return [
        ...state.map((s) => (s.id === action.id ? { ...s, concluido: true } : s)),
        revisao,
      ];
    }

    case 'ADD_SESSAO':
      return [...state, action.payload];

    case 'REGISTRAR_REVISOES_ATRASADAS':
      // Revisões 24h não concluídas de dias anteriores → marca como concluída (falha)
      // O chamador trata o registro de erro externamente
      return state.map((s) => {
        if (
          s.tipo === 'revisao24h' &&
          !s.concluido &&
          isBefore(parseISO(s.data), parseISO(action.hoje))
        ) {
          return { ...s, concluido: true, origem_erro: true };
        }
        return s;
      });

    default:
      return state;
  }
}

interface GradeContextType {
  sessoes: SessaoGrade[];
  definirGrade: (sessoes: SessaoGrade[]) => void;
  marcarConcluido: (id: string) => void;
  addSessao: (sessao: SessaoGrade) => void;
  getGradeDoDia: (data: string) => SessaoGrade[];
  getSessoesPendentes: () => SessaoGrade[];
  getRevisoesAtrasadas: () => SessaoGrade[];
  processarRevisoesAtrasadas: () => SessaoGrade[];
}

const GradeContext = createContext<GradeContextType | null>(null);

export function GradeProvider({ children }: { children: ReactNode }) {
  const [sessoes, dispatch] = useReducer(gradeReducer, [], () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessoes));
  }, [sessoes]);

  const definirGrade = useCallback((novasSessoes: SessaoGrade[]) => {
    dispatch({ type: 'DEFINIR', payload: novasSessoes });
  }, []);

  const marcarConcluido = useCallback((id: string) => {
    dispatch({ type: 'MARCAR_CONCLUIDO', id });
  }, []);

  const addSessao = useCallback((sessao: SessaoGrade) => {
    dispatch({ type: 'ADD_SESSAO', payload: sessao });
  }, []);

  const getGradeDoDia = useCallback(
    (data: string) => sessoes.filter((s) => s.data === data),
    [sessoes]
  );

  const getSessoesPendentes = useCallback(
    () => sessoes.filter((s) => !s.concluido),
    [sessoes]
  );

  // Revisões 24h não concluídas de dias passados (para auto-registrar como erro)
  const getRevisoesAtrasadas = useCallback(() => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    return sessoes.filter(
      (s) => s.tipo === 'revisao24h' && !s.concluido && s.data < hoje
    );
  }, [sessoes]);

  // Processa atrasadas e retorna a lista para o chamador registrar como erros
  const processarRevisoesAtrasadas = useCallback((): SessaoGrade[] => {
    const hoje = format(new Date(), 'yyyy-MM-dd');
    const atrasadas = sessoes.filter(
      (s) => s.tipo === 'revisao24h' && !s.concluido && s.data < hoje
    );
    if (atrasadas.length > 0) {
      dispatch({ type: 'REGISTRAR_REVISOES_ATRASADAS', hoje });
    }
    return atrasadas;
  }, [sessoes]);

  return (
    <GradeContext.Provider
      value={{
        sessoes,
        definirGrade,
        marcarConcluido,
        addSessao,
        getGradeDoDia,
        getSessoesPendentes,
        getRevisoesAtrasadas,
        processarRevisoesAtrasadas,
      }}
    >
      {children}
    </GradeContext.Provider>
  );
}

export function useGrade(): GradeContextType {
  const ctx = useContext(GradeContext);
  if (!ctx) throw new Error('useGrade deve ser usado dentro de GradeProvider');
  return ctx;
}
