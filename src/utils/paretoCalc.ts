import { type Topico, type Disciplina, type Zona } from '../types';

export function calcularZonas(topicos: Topico[]): Topico[] {
  if (topicos.length === 0) return topicos;

  const sorted = [...topicos].sort((a, b) => b.percentual - a.percentual);
  const total = sorted.reduce((sum, t) => sum + t.percentual, 0);

  let acumulado = 0;
  return sorted.map((topico) => {
    if (topico.zona_override) {
      acumulado += topico.percentual;
      return topico;
    }
    acumulado += topico.percentual;
    const pct = total > 0 ? (acumulado / total) * 100 : 0;
    const zona: Zona = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
    return { ...topico, zona };
  });
}

export function calcularPesoPareto(disciplina: Disciplina): number {
  return disciplina.topicos.reduce((sum, t) => sum + t.percentual, 0);
}

export function subirZona(zona: Zona): Zona {
  if (zona === 'C') return 'B';
  if (zona === 'B') return 'A';
  return 'A';
}

export function descerZona(zona: Zona): Zona {
  if (zona === 'A') return 'B';
  if (zona === 'B') return 'C';
  return 'C';
}
