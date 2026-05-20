import { useDiagnostico } from '../hooks/useDiagnostico';
import { useEdital } from '../hooks/useEdital';
import { calcularPesosFinais, getMultiplicador, calcularTempoSemana } from '../utils/tempoCalc';
import { calcularPesoPareto } from '../utils/paretoCalc';
import { type NivelAluno } from '../types';

const LABELS_COBERTURA = [
  '1 — Não explico nada sem consulta',
  '2 — Explico poucos tópicos',
  '3 — Explico metade',
  '4 — Explico a maioria',
  '5 — Explico todos',
];

const LABELS_PERFORMANCE = [
  '1 — <30% de acerto',
  '2 — 30–50% de acerto',
  '3 — 50–70% de acerto',
  '4 — 70–85% de acerto',
  '5 — >85% de acerto',
];

export default function DiagnosticoForm() {
  const { edital, updateDisciplina } = useEdital();
  const { setRespostas, getNivel, getRespostas } = useDiagnostico();

  if (!edital || edital.disciplinas.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 text-sm">
        Cadastre disciplinas no edital primeiro.
      </div>
    );
  }

  const disciplinasComPesos = calcularPesosFinais(
    edital.disciplinas.map((d) => ({
      ...d,
      nivel_aluno: getNivel(d.id),
      peso_pareto: calcularPesoPareto(d),
    }))
  );

  const horasSemana = edital.concurso?.horas_semana ?? 10;

  const handleChange = (
    disciplinaId: string,
    campo: 'cobertura' | 'performance',
    valor: string
  ) => {
    const atual = getRespostas(disciplinaId);
    const novas = {
      cobertura: campo === 'cobertura' ? parseInt(valor) : atual.cobertura,
      performance: campo === 'performance' ? parseInt(valor) : atual.performance,
    };
    setRespostas(disciplinaId, novas.cobertura, novas.performance);

    const nivel = Math.round((novas.cobertura + novas.performance) / 2) as NivelAluno;
    const disciplina = edital.disciplinas.find((d) => d.id === disciplinaId);
    if (disciplina) {
      updateDisciplina({ ...disciplina, nivel_aluno: nivel });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Diagnóstico</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          2 perguntas por disciplina. Seja honesto — isso calibra sua grade.
        </p>
      </div>

      <div className="space-y-3">
        {edital.disciplinas.map((disciplina) => {
          const respostas = getRespostas(disciplina.id);
          const nivel = getNivel(disciplina.id);
          return (
            <div
              key={disciplina.id}
              className="bg-white border border-gray-200 rounded-lg p-3 space-y-2"
            >
              <h3 className="font-medium text-gray-900 text-sm">{disciplina.nome}</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cobertura</label>
                  <select
                    value={respostas.cobertura}
                    onChange={(e) => handleChange(disciplina.id, 'cobertura', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LABELS_COBERTURA.map((label, i) => (
                      <option key={i + 1} value={i + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Performance</label>
                  <select
                    value={respostas.performance}
                    onChange={(e) => handleChange(disciplina.id, 'performance', e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LABELS_PERFORMANCE.map((label, i) => (
                      <option key={i + 1} value={i + 1}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Nível: <span className="font-semibold text-gray-700">{nivel}</span>
                {' · '}
                Multiplicador:{' '}
                <span className="font-semibold text-gray-700">{getMultiplicador(nivel)}×</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h3 className="text-sm font-semibold text-gray-900 px-3 py-2 border-b border-gray-100">
          Resumo por disciplina
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Disciplina</th>
                <th className="text-right px-2 py-2 text-gray-500 font-medium">Pareto</th>
                <th className="text-right px-2 py-2 text-gray-500 font-medium">Nível</th>
                <th className="text-right px-2 py-2 text-gray-500 font-medium">Peso</th>
                <th className="text-right px-3 py-2 text-gray-500 font-medium">min/sem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {disciplinasComPesos.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2 text-gray-900 max-w-[110px] truncate">{d.nome}</td>
                  <td className="px-2 py-2 text-right text-gray-600">
                    {d.peso_pareto.toFixed(0)}
                  </td>
                  <td className="px-2 py-2 text-right text-gray-600">{d.nivel_aluno}</td>
                  <td className="px-2 py-2 text-right font-semibold text-gray-900">
                    {d.peso_final.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {calcularTempoSemana(d, horasSemana)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
