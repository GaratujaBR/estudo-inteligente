import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type SessaoGrade } from '../types';

const TIPO_LABEL: Record<SessaoGrade['tipo'], string> = {
  estudo: 'Estudo',
  revisao24h: 'Revisão 24h',
  revisao_cirurgica: 'Revisão Cirúrgica',
};

function escapeCsv(value: string): string {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportarGradeCSV(sessoes: SessaoGrade[]): void {
  const ordenadas = [...sessoes].sort(
    (a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario)
  );

  const header = ['Data', 'Dia', 'Horário', 'Tipo', 'Disciplina', 'Tópico', 'Zona', 'Tempo (min)', 'Concluído'];

  const rows = ordenadas.map((s) => [
    s.data,
    format(parseISO(s.data), 'EEEE', { locale: ptBR }),
    s.horario,
    TIPO_LABEL[s.tipo],
    s.disciplina_nome,
    s.topico_nome,
    s.zona,
    String(s.tempo_min),
    s.concluido ? 'Sim' : 'Não',
  ]);

  const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');

  // UTF-8 BOM so Excel opens accents correctly on Windows
  const BOM = '﻿';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `grade-estudos-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
