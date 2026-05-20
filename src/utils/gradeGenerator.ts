import { addDays, format } from 'date-fns';
import { type EditalCompleto, type SessaoGrade } from '../types';
import { getMultiplicador } from './tempoCalc';

export function gerarGrade(edital: EditalCompleto, dataInicio: Date): SessaoGrade[] {
  const minutesPorDia = Math.max(30, Math.floor((edital.concurso.horas_semana * 60) / 7));

  // Fila por disciplina: A antes de B antes de C (regra de negócio crítica)
  const filas = edital.disciplinas
    .map((d) => ({
      disciplina: d,
      topicos: [
        ...d.topicos.filter((t) => t.status === 'pendente' && t.zona === 'A'),
        ...d.topicos.filter((t) => t.status === 'pendente' && t.zona === 'B'),
        ...d.topicos.filter((t) => t.status === 'pendente' && t.zona === 'C'),
      ],
      cursor: 0,
    }))
    .filter((f) => f.topicos.length > 0)
    .sort((a, b) => b.disciplina.peso_final - a.disciplina.peso_final);

  if (filas.length === 0) return [];

  const sessoes: SessaoGrade[] = [];
  let currentDate = new Date(dataInicio);
  let minutesUsedToday = 0;
  let currentHour = 8;
  let currentMin = 0;
  let lastDisciplinaId: string | null = null;
  let consecutiveMin = 0;
  let roundRobin = 0;

  while (filas.some((f) => f.cursor < f.topicos.length)) {
    // Encontra próxima disciplina elegível (respeitando limite de 3h consecutivas)
    let fila: (typeof filas)[0] | null = null;
    let attempts = 0;

    while (attempts < filas.length) {
      const idx = roundRobin % filas.length;
      const candidate = filas[idx];

      if (candidate.cursor >= candidate.topicos.length) {
        roundRobin++;
        attempts++;
        continue;
      }

      if (lastDisciplinaId === candidate.disciplina.id && consecutiveMin >= 180) {
        roundRobin++;
        attempts++;
        continue;
      }

      fila = candidate;
      break;
    }

    if (!fila) break;

    const topico = fila.topicos[fila.cursor];
    const mult = getMultiplicador(fila.disciplina.nivel_aluno);
    const tempoMin = Math.max(15, Math.round(topico.tempo_base_min * mult));

    // Tópico não cabe hoje → avança dia
    if (minutesUsedToday > 0 && minutesUsedToday + tempoMin > minutesPorDia) {
      currentDate = addDays(currentDate, 1);
      minutesUsedToday = 0;
      currentHour = 8;
      currentMin = 0;
      lastDisciplinaId = null;
      consecutiveMin = 0;
    }

    sessoes.push({
      id: crypto.randomUUID(),
      data: format(currentDate, 'yyyy-MM-dd'),
      horario: `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`,
      tipo: 'estudo',
      disciplina_id: fila.disciplina.id,
      topico_id: topico.id,
      topico_nome: topico.nome,
      disciplina_nome: fila.disciplina.nome,
      zona: topico.zona,
      tempo_min: tempoMin,
      concluido: false,
    });

    const totalMin = currentHour * 60 + currentMin + tempoMin;
    currentHour = Math.floor(totalMin / 60);
    currentMin = totalMin % 60;
    minutesUsedToday += tempoMin;

    if (lastDisciplinaId === fila.disciplina.id) {
      consecutiveMin += tempoMin;
    } else {
      lastDisciplinaId = fila.disciplina.id;
      consecutiveMin = tempoMin;
    }

    fila.cursor++;
    roundRobin++;
  }

  return sessoes;
}

export function estimarSemanas(sessoes: SessaoGrade[], dataInicio: Date): number {
  if (sessoes.length === 0) return 0;
  const lastData = sessoes.reduce((max, s) => (s.data > max ? s.data : max), sessoes[0].data);
  const diffMs = new Date(lastData + 'T00:00:00').getTime() - dataInicio.getTime();
  const diffDias = diffMs / (1000 * 60 * 60 * 24);
  return Math.ceil(diffDias / 7);
}
