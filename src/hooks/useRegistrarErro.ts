import { useCallback } from 'react';
import { format } from 'date-fns';
import { useErros } from './useErros';
import { useEdital } from './useEdital';
import { useGrade } from './useGrade';
import { subirZona } from '../utils/paretoCalc';
import { type SessaoGrade } from '../types';

export function useRegistrarErro() {
  const { registrarErro, getVezesErrada } = useErros();
  const { edital, updateTopico } = useEdital();
  const { addSessao } = useGrade();

  return useCallback(
    (topicoId: string, disciplinaNome: string, disciplinaId: string) => {
      const vezesAntes = getVezesErrada(topicoId);
      registrarErro(topicoId, disciplinaNome);
      const vezesDepois = vezesAntes + 1;

      // 3 erros → sobe zona + agenda revisão cirúrgica
      if (vezesDepois >= 3 && vezesDepois % 3 === 0) {
        const disc = edital?.disciplinas.find((d) => d.id === disciplinaId);
        const topico = disc?.topicos.find((t) => t.id === topicoId);

        if (disc && topico) {
          const novaZona = subirZona(topico.zona);
          updateTopico(disciplinaId, { ...topico, zona: novaZona, zona_override: true });

          const sessaoCircurgica: SessaoGrade = {
            id: crypto.randomUUID(),
            data: format(new Date(), 'yyyy-MM-dd'),
            horario: '19:00',
            tipo: 'revisao_cirurgica',
            disciplina_id: disciplinaId,
            topico_id: topicoId,
            topico_nome: topico.nome,
            disciplina_nome: disc.nome,
            zona: novaZona,
            tempo_min: 30,
            concluido: false,
            origem_erro: true,
          };

          addSessao(sessaoCircurgica);
        }
      }
    },
    [registrarErro, getVezesErrada, edital, updateTopico, addSessao]
  );
}
