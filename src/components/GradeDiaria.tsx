import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClipboardList, RefreshCw, Frown, Check, ChevronRight } from 'lucide-react';
import { useEdital } from '../hooks/useEdital';
import { useGrade } from '../hooks/useGrade';
import { useRegistrarErro } from '../hooks/useRegistrarErro';
import { gerarGrade, estimarSemanas } from '../utils/gradeGenerator';
import ZonaBadge from './ZonaBadge';
import { type SessaoGrade } from '../types';

function formatMinutos(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

function SessaoItem({
  sessao,
  onConcluir,
  onErro,
  confirmingId,
  setConfirmingId,
}: {
  sessao: SessaoGrade;
  onConcluir: (id: string) => void;
  onErro: (sessao: SessaoGrade) => void;
  confirmingId: string | null;
  setConfirmingId: (id: string | null) => void;
}) {
  const confirming = confirmingId === sessao.id;
  const isRevisao = sessao.tipo === 'revisao24h' || sessao.tipo === 'revisao_cirurgica';

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
        sessao.concluido
          ? 'bg-gray-50 border-gray-100 opacity-60'
          : 'bg-white border-gray-200'
      }`}
    >
      <button
        onClick={() => !sessao.concluido && onConcluir(sessao.id)}
        className="shrink-0 flex items-center justify-center w-10 h-10 -ml-1 -mt-1"
      >
        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          sessao.concluido
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-400'
        }`}>
          {sessao.concluido && <Check size={11} />}
        </span>
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-gray-400 font-mono">{sessao.horario}</span>
          <ZonaBadge zona={sessao.zona} />
          {isRevisao && (
            <span className="text-xs text-blue-500 flex items-center gap-0.5">
              <RefreshCw size={10} />
              revisão
            </span>
          )}
        </div>
        <p
          className={`text-sm font-medium mt-0.5 ${
            sessao.concluido ? 'line-through text-gray-400' : 'text-gray-900'
          }`}
        >
          {sessao.topico_nome}
        </p>
        <p className="text-xs text-gray-500">
          {sessao.disciplina_nome} · {formatMinutos(sessao.tempo_min)}
        </p>

        {confirming && (
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setConfirmingId(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onErro(sessao);
                setConfirmingId(null);
              }}
              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded font-medium hover:bg-red-200"
            >
              Confirmar erro
            </button>
          </div>
        )}
      </div>

      {!sessao.concluido && !confirming && (
        <button
          onClick={() => setConfirmingId(sessao.id)}
          className="shrink-0 flex items-center justify-center w-10 h-10 -mr-1 text-gray-300 hover:text-red-400 transition-colors"
          title="Errei / Não entendi"
        >
          <Frown size={18} />
        </button>
      )}
    </div>
  );
}

export default function GradeDiaria() {
  const { edital } = useEdital();
  const { sessoes, definirGrade, marcarConcluido, getGradeDoDia, processarRevisoesAtrasadas } =
    useGrade();
  const registrarErroCompleto = useRegistrarErro();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR });

  // Processa revisões atrasadas ao montar — auto-registra como erro
  useEffect(() => {
    const atrasadas = processarRevisoesAtrasadas();
    atrasadas.forEach((s) =>
      registrarErroCompleto(s.topico_id, s.disciplina_nome, s.disciplina_id)
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sessoesHoje = getGradeDoDia(hoje).sort((a, b) => a.horario.localeCompare(b.horario));
  const pendentes = sessoesHoje.filter((s) => !s.concluido);
  const concluidas = sessoesHoje.filter((s) => s.concluido);

  const handleGerarGrade = () => {
    if (!edital) return;
    const novas = gerarGrade(edital, new Date());
    definirGrade(novas);
  };

  const handleErro = (sessao: SessaoGrade) => {
    registrarErroCompleto(sessao.topico_id, sessao.disciplina_nome, sessao.disciplina_id);
  };

  // Estado vazio: sem grade gerada
  if (sessoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <ClipboardList className="text-blue-400" size={28} />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Nenhuma grade gerada</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          Configure o edital e o diagnóstico na aba Edital, depois gere sua grade aqui.
        </p>
        {edital && edital.disciplinas.length > 0 ? (
          <button
            onClick={handleGerarGrade}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Gerar minha grade
          </button>
        ) : (
          <button
            onClick={() => {
              const btn = document.querySelector('[data-aba="edital"]') as HTMLButtonElement;
              btn?.click();
            }}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Configurar edital
          </button>
        )}
      </div>
    );
  }

  // Grade existe mas sem sessões hoje
  if (sessoesHoje.length === 0) {
    const proximas = sessoes
      .filter((s) => s.data > hoje && !s.concluido)
      .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))
      .slice(0, 3);

    return (
      <div className="space-y-4">
        <div>
          <p className="text-xs text-gray-400 capitalize">{hojeLabel}</p>
          <h2 className="text-lg font-semibold text-gray-900">Sem sessões hoje</h2>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
          <p className="text-green-700 text-sm font-medium">Dia livre! Descanse bem.</p>
        </div>
        {proximas.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Próximas sessões</h3>
            <div className="space-y-2">
              {proximas.map((s) => (
                <div key={s.id} className="bg-white border border-gray-100 rounded-lg p-3 flex items-center gap-3">
                  <ChevronRight size={14} className="text-gray-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">
                      {format(parseISO(s.data), "d MMM", { locale: ptBR })} · {s.horario}
                    </p>
                    <p className="text-sm text-gray-800 truncate">{s.topico_nome}</p>
                    <p className="text-xs text-gray-500">{s.disciplina_nome}</p>
                  </div>
                  <ZonaBadge zona={s.zona} />
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleGerarGrade}
          className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          Regenerar grade
        </button>
      </div>
    );
  }

  const totalHoje = sessoesHoje.reduce((sum, s) => sum + s.tempo_min, 0);
  const concluidasMin = concluidas.reduce((sum, s) => sum + s.tempo_min, 0);
  const progresso = totalHoje > 0 ? Math.round((concluidasMin / totalHoje) * 100) : 0;
  const semanas = estimarSemanas(sessoes, new Date());

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 capitalize">{hojeLabel}</p>
          <h2 className="text-lg font-semibold text-gray-900">Grade de hoje</h2>
        </div>
        {semanas > 0 && (
          <span className="text-xs text-gray-400 mt-1">
            ~{semanas} sem. até zerar
          </span>
        )}
      </div>

      {/* Barra de progresso */}
      <div>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{concluidas.length}/{sessoesHoje.length} sessões</span>
          <span>{progresso}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progresso}%` }}
          />
        </div>
      </div>

      {/* Sessões pendentes */}
      {pendentes.length > 0 && (
        <div className="space-y-2">
          {pendentes.map((sessao) => (
            <SessaoItem
              key={sessao.id}
              sessao={sessao}
              onConcluir={marcarConcluido}
              onErro={handleErro}
              confirmingId={confirmingId}
              setConfirmingId={setConfirmingId}
            />
          ))}
        </div>
      )}

      {/* Sessões concluídas */}
      {concluidas.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-2">Concluídas</p>
          <div className="space-y-2">
            {concluidas.map((sessao) => (
              <SessaoItem
                key={sessao.id}
                sessao={sessao}
                onConcluir={marcarConcluido}
                onErro={handleErro}
                confirmingId={confirmingId}
                setConfirmingId={setConfirmingId}
              />
            ))}
          </div>
        </div>
      )}

      {pendentes.length === 0 && concluidas.length > 0 && (
        <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-center">
          <p className="text-green-700 text-sm font-medium">🎉 Todas as sessões de hoje concluídas!</p>
        </div>
      )}

      <button
        onClick={handleGerarGrade}
        className="w-full py-2 border border-gray-200 rounded-lg text-xs text-gray-400 hover:bg-gray-50 flex items-center justify-center gap-1.5"
      >
        <RefreshCw size={12} />
        Regenerar grade
      </button>
    </div>
  );
}
