import { type Disciplina, type NivelAluno } from '../types';

const MULTIPLICADORES: Record<NivelAluno, number> = {
  1: 1.0,
  2: 0.9,
  3: 0.8,
  4: 0.6,
  5: 0.4,
};

export function getMultiplicador(nivel: NivelAluno): number {
  return MULTIPLICADORES[nivel];
}

export function calcularPesosFinais(disciplinas: Disciplina[]): Disciplina[] {
  const todosParetoZero = disciplinas.every((d) => d.peso_pareto === 0);

  const comPesos = disciplinas.map((d) => ({
    ...d,
    peso_final: (todosParetoZero ? 1 : d.peso_pareto) * getMultiplicador(d.nivel_aluno),
  }));

  const totalPeso = comPesos.reduce((sum, d) => sum + d.peso_final, 0);

  return comPesos.map((d) => ({
    ...d,
    peso_final: totalPeso > 0 ? (d.peso_final / totalPeso) * 100 : 0,
  }));
}

export function calcularTempoSemana(disciplina: Disciplina, horasSemana: number): number {
  return Math.round((disciplina.peso_final / 100) * horasSemana * 60);
}
