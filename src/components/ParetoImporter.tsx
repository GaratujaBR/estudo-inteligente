import { useState } from 'react';
import { X, Copy, Check, AlertCircle } from 'lucide-react';
import { useEdital } from '../hooks/useEdital';
import { AnaliseIASchema } from '../types';
import { gerarPromptIA } from '../data/defaultPrompt';
import { calcularZonas, calcularPesoPareto } from '../utils/paretoCalc';

interface ParetoImporterProps {
  onClose: () => void;
}

export default function ParetoImporter({ onClose }: ParetoImporterProps) {
  const { edital, updateDisciplina } = useEdital();
  const [copiado, setCopiado] = useState(false);
  const [json, setJson] = useState('');
  const [erro, setErro] = useState('');
  const [aplicado, setAplicado] = useState(false);

  if (!edital) return null;

  const prompt = gerarPromptIA(edital);

  const copiarPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback: selecionar o texto
    }
  };

  const aplicarAnalise = () => {
    setErro('');
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setErro('O JSON está mal formatado. Verifique se copiou a resposta completa da IA.');
      return;
    }

    const result = AnaliseIASchema.safeParse(parsed);
    if (!result.success) {
      setErro('O JSON está mal formatado. Verifique se copiou a resposta completa da IA.');
      return;
    }

    for (const discIA of result.data.disciplinas) {
      const disciplina = edital.disciplinas.find(
        (d) => d.nome.toLowerCase().trim() === discIA.nome.toLowerCase().trim()
      );
      if (!disciplina) continue;

      const topicosAtualizados = disciplina.topicos.map((t) => {
        const topicoIA = discIA.topicos.find(
          (ti) => ti.nome.toLowerCase().trim() === t.nome.toLowerCase().trim()
        );
        return topicoIA ? { ...t, percentual: topicoIA.percentual, zona_override: false as const } : t;
      });

      const comZonas = calcularZonas(topicosAtualizados);
      const pesoPareto = calcularPesoPareto({ ...disciplina, topicos: comZonas });

      updateDisciplina({ ...disciplina, topicos: comZonas, peso_pareto: pesoPareto });
    }

    setAplicado(true);
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="font-semibold text-gray-900 text-sm">Analisar com IA</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">1. Copie o prompt</p>
              <button
                onClick={copiarPrompt}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                {copiado ? <Check size={12} /> : <Copy size={12} />}
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
            <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
              {prompt}
            </pre>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              2. Cole no ChatGPT ou DeepSeek, depois cole a resposta aqui
            </p>
            <textarea
              value={json}
              onChange={(e) => {
                setJson(e.target.value);
                setErro('');
              }}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={'Cole o JSON aqui:\n{ "disciplinas": [...] }'}
            />
            {erro && (
              <div className="flex items-start gap-1.5 mt-1.5 text-red-600">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <p className="text-xs">{erro}</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 shrink-0">
          <button
            onClick={aplicarAnalise}
            disabled={!json.trim() || aplicado}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {aplicado ? '✓ Análise aplicada!' : 'Aplicar análise'}
          </button>
        </div>
      </div>
    </div>
  );
}
