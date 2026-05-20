import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Check } from 'lucide-react';
import { useGrade } from '../hooks/useGrade';
import ZonaBadge from './ZonaBadge';

function formatMinutos(min: number): string {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
}

export default function Revisao24h() {
  const { sessoes, marcarConcluido } = useGrade();

  const amanha = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const revisoes = sessoes
    .filter((s) => s.tipo === 'revisao24h' && !s.concluido && s.data >= amanha)
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario));

  if (revisoes.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
        <RefreshCw size={14} className="text-blue-400" />
        Revisões agendadas
      </h3>
      <div className="space-y-2">
        {revisoes.slice(0, 5).map((s) => (
          <div
            key={s.id}
            className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-3"
          >
            <button
              onClick={() => marcarConcluido(s.id)}
              className="shrink-0 w-5 h-5 rounded-full border-2 border-blue-300 hover:border-blue-500 flex items-center justify-center transition-colors"
            >
              <Check size={10} className="text-blue-300" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-blue-400">
                  {format(new Date(s.data + 'T00:00:00'), "d MMM", { locale: ptBR })} · {s.horario}
                </span>
                <ZonaBadge zona={s.zona} />
              </div>
              <p className="text-sm text-gray-800 truncate">{s.topico_nome}</p>
              <p className="text-xs text-gray-500">
                {s.disciplina_nome} · {formatMinutos(s.tempo_min)} · active recall
              </p>
            </div>
          </div>
        ))}
        {revisoes.length > 5 && (
          <p className="text-xs text-gray-400 text-center">
            +{revisoes.length - 5} revisões agendadas
          </p>
        )}
      </div>
    </div>
  );
}
