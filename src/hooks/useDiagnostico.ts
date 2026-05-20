import { useCallback, useEffect, useState } from 'react';
import { type NivelAluno } from '../types';

const STORAGE_KEY = 'diagnostico';

interface DiagnosticoDisciplina {
  cobertura: number;
  performance: number;
}

type DiagnosticoMap = Record<string, DiagnosticoDisciplina>;

export function useDiagnostico() {
  const [diagnostico, setDiagnostico] = useState<DiagnosticoMap>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(diagnostico));
  }, [diagnostico]);

  const setRespostas = useCallback(
    (disciplinaId: string, cobertura: number, performance: number) => {
      setDiagnostico((prev) => ({ ...prev, [disciplinaId]: { cobertura, performance } }));
    },
    []
  );

  const getNivel = useCallback(
    (disciplinaId: string): NivelAluno => {
      const d = diagnostico[disciplinaId];
      if (!d) return 1;
      return Math.round((d.cobertura + d.performance) / 2) as NivelAluno;
    },
    [diagnostico]
  );

  const getRespostas = useCallback(
    (disciplinaId: string): DiagnosticoDisciplina => {
      return diagnostico[disciplinaId] ?? { cobertura: 1, performance: 1 };
    },
    [diagnostico]
  );

  return { setRespostas, getNivel, getRespostas };
}
