import { format, parseISO, differenceInDays } from 'date-fns';
import { CheckCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import { useErros } from '../hooks/useErros';
import { useEdital } from '../hooks/useEdital';
import { useGrade } from '../hooks/useGrade';
import ZonaBadge from './ZonaBadge';
import { type SessaoGrade } from '../types';

function diasAtras(isoDate: string): string {
  const diff = differenceInDays(new Date(), parseISO(isoDate));
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'ontem';
  return `${diff} dias atrás`;
}

export default function PlanilhaErros() {
  const { erros, marcarDominado } = useErros();
  const { edital } = useEdital();
  const { addSessao } = useGrade();

  const ativos = erros
    .filter((e) => e.status !== 'dominado')
    .sort((a, b) => {
      if (b.vezes_errada !== a.vezes_errada) return b.vezes_errada - a.vezes_errada;
      return b.ultimo_erro.localeCompare(a.ultimo_erro);
    });

  const handleRevisarAgora = (topicoId: string, disciplinaNome: string, disciplinaId: string) => {
    const disc = edital?.disciplinas.find((d) => d.id === disciplinaId);
    const topico = disc?.topicos.find((t) => t.id === topicoId);

    const sessao: SessaoGrade = {
      id: crypto.randomUUID(),
      data: format(new Date(), 'yyyy-MM-dd'),
      horario: format(new Date(), 'HH:mm'),
      tipo: 'revisao_cirurgica',
      disciplina_id: disciplinaId,
      topico_id: topicoId,
      topico_nome: topico?.nome ?? topicoId,
      disciplina_nome: disciplinaNome,
      zona: topico?.zona ?? 'A',
      tempo_min: 30,
      concluido: false,
      origem_erro: true,
    };

    addSessao(sessao);
  };

  const getTopicoDados = (topicoId: string) => {
    for (const disc of edital?.disciplinas ?? []) {
      const t = disc.topicos.find((t) => t.id === topicoId);
      if (t) return { topico: t, disciplinaId: disc.id };
    }
    return { topico: null, disciplinaId: '' };
  };

  if (ativos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="text-green-400" size={28} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Nenhum erro registrado</h2>
        <p className="text-gray-500 text-sm max-w-xs">
          Quando você marcar 😓 em alguma sessão, o tópico aparece aqui para acompanhamento.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Planilha de erros</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          {ativos.length} tópico{ativos.length !== 1 ? 's' : ''} com dificuldade
        </p>
      </div>

      <div className="space-y-3">
        {ativos.map((erro) => {
          const { topico, disciplinaId } = getTopicoDados(erro.topico_id);
          const recente = differenceInDays(new Date(), parseISO(erro.ultimo_erro)) <= 7;

          return (
            <div
              key={erro.topico_id}
              className={`bg-white border rounded-lg p-3 space-y-2 ${
                recente ? 'border-red-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {topico && <ZonaBadge zona={topico.zona} />}
                    <span
                      className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                        erro.vezes_errada >= 3
                          ? 'bg-red-100 text-red-700'
                          : 'bg-orange-50 text-orange-700'
                      }`}
                    >
                      {erro.vezes_errada}× errado
                    </span>
                    {recente && (
                      <span className="text-xs text-red-500 font-medium">recente</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {topico?.nome ?? erro.topico_id}
                  </p>
                  <p className="text-xs text-gray-500">
                    {erro.disciplina} · {diasAtras(erro.ultimo_erro)}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleRevisarAgora(erro.topico_id, erro.disciplina, disciplinaId)
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  <PlayCircle size={13} />
                  Revisar agora
                </button>
                <button
                  onClick={() => marcarDominado(erro.topico_id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-50 text-green-700 rounded text-xs font-medium hover:bg-green-100 transition-colors"
                >
                  <CheckCircle size={13} />
                  Dominado
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {erros.filter((e) => e.status === 'dominado').length > 0 && (
        <p className="text-xs text-gray-400 text-center">
          {erros.filter((e) => e.status === 'dominado').length} tópico(s) dominado(s) ocultos
        </p>
      )}
    </div>
  );
}
