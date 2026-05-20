import { useState } from 'react';
import { X, Copy, Check, AlertCircle, FileText, ChevronRight } from 'lucide-react';
import { useEdital } from '../hooks/useEdital';
import { EditalIASchema } from '../types';
import { gerarPromptEditalTexto } from '../data/defaultPrompt';
import { type Topico, type Disciplina } from '../types';

type Etapa = 'colar-texto' | 'colar-json';

interface EditalImporterProps {
  onClose: () => void;
}

function criarTopico(nome: string): Topico {
  return {
    id: crypto.randomUUID(),
    nome,
    percentual: 0,
    zona: 'C',
    zona_override: false,
    tempo_base_min: 60,
    status: 'pendente',
    erros: 0,
  };
}

function criarDisciplina(nome: string, topicos: string[]): Disciplina {
  return {
    id: crypto.randomUUID(),
    nome,
    topicos: topicos.map(criarTopico),
    nivel_aluno: 1,
    peso_pareto: 0,
    peso_final: 0,
  };
}

export default function EditalImporter({ onClose }: EditalImporterProps) {
  const { edital, setConcurso, addDisciplina } = useEdital();
  const [etapa, setEtapa] = useState<Etapa>('colar-texto');
  const [textoEdital, setTextoEdital] = useState('');
  const [prompt, setPrompt] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [json, setJson] = useState('');
  const [erro, setErro] = useState('');
  const [confirmandoReplace, setConfirmandoReplace] = useState(false);
  const [dadosParaImportar, setDadosParaImportar] = useState<ReturnType<typeof EditalIASchema.parse> | null>(null);

  const temDisciplinas = (edital?.disciplinas.length ?? 0) > 0;

  const handleGerarPrompt = () => {
    if (!textoEdital.trim()) return;
    const p = gerarPromptEditalTexto(textoEdital);
    setPrompt(p);
    setEtapa('colar-json');
  };

  const copiarPrompt = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback silencioso
    }
  };

  const handleAplicar = () => {
    setErro('');
    let parsed: unknown;
    try {
      const limpo = json.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
      parsed = JSON.parse(limpo);
    } catch {
      setErro('O JSON está mal formatado. Verifique se copiou a resposta completa da IA.');
      return;
    }

    const result = EditalIASchema.safeParse(parsed);
    if (!result.success) {
      setErro('O JSON está mal formatado. Verifique se copiou a resposta completa da IA.');
      return;
    }

    if (temDisciplinas) {
      setDadosParaImportar(result.data);
      setConfirmandoReplace(true);
    } else {
      importarDados(result.data);
    }
  };

  const importarDados = (dados: ReturnType<typeof EditalIASchema.parse>) => {
    // Preenche concurso se a IA extraiu e ainda não está preenchido
    if (dados.concurso?.nome && dados.concurso?.banca && !edital?.concurso.nome) {
      setConcurso({
        id: edital?.concurso.id || crypto.randomUUID(),
        nome: dados.concurso.nome,
        banca: dados.concurso.banca,
        data_prova: dados.concurso.data_prova
          ? new Date(dados.concurso.data_prova).toISOString()
          : '',
        horas_semana: edital?.concurso.horas_semana || 20,
        created_at: edital?.concurso.created_at || new Date().toISOString(),
      });
    }

    for (const disc of dados.disciplinas) {
      addDisciplina(criarDisciplina(disc.nome, disc.topicos));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900 text-sm">Importar do edital</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={18} />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-100 shrink-0">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${etapa === 'colar-texto' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
            1. Colar texto
          </span>
          <ChevronRight size={12} className="text-gray-300" />
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${etapa === 'colar-json' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
            2. Colar resposta da IA
          </span>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">

          {etapa === 'colar-texto' && (
            <>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Cole o texto do edital abaixo
                </p>
                <p className="text-xs text-gray-400 mb-2">
                  Abra o PDF no navegador, selecione tudo (Ctrl+A), copie e cole aqui.
                  Os primeiros 8.000 caracteres serão enviados para a IA.
                </p>
                <textarea
                  value={textoEdital}
                  onChange={(e) => setTextoEdital(e.target.value)}
                  className="w-full h-48 px-3 py-2 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Cole aqui o texto copiado do edital em PDF..."
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {textoEdital.length.toLocaleString()} caracteres
                  {textoEdital.length > 8000 && (
                    <span className="text-orange-500 ml-1">(será truncado em 8.000)</span>
                  )}
                </p>
              </div>
            </>
          )}

          {etapa === 'colar-json' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    1. Copie o prompt e envie para a IA
                  </p>
                  <button
                    onClick={copiarPrompt}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    {copiado ? <Check size={12} /> : <Copy size={12} />}
                    {copiado ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
                <pre className="bg-gray-50 border border-gray-200 rounded p-3 text-xs text-gray-600 whitespace-pre-wrap max-h-28 overflow-y-auto leading-relaxed">
                  {prompt}
                </pre>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  2. Cole a resposta JSON da IA aqui
                </p>
                <textarea
                  value={json}
                  onChange={(e) => { setJson(e.target.value); setErro(''); }}
                  className="w-full h-36 px-3 py-2 border border-gray-300 rounded text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={'Cole o JSON aqui:\n{ "disciplinas": [...] }'}
                />
                {erro && (
                  <div className="flex items-start gap-1.5 mt-1.5 text-red-600">
                    <AlertCircle size={13} className="mt-0.5 shrink-0" />
                    <p className="text-xs">{erro}</p>
                  </div>
                )}
              </div>

              {/* Confirmação de replace */}
              {confirmandoReplace && dadosParaImportar && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-800 mb-1">
                    Já existem disciplinas cadastradas
                  </p>
                  <p className="text-xs text-orange-700 mb-3">
                    A importação vai ADICIONAR {dadosParaImportar.disciplinas.length} disciplina(s) às existentes (não substitui).
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmandoReplace(false)}
                      className="flex-1 py-1.5 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => { importarDados(dadosParaImportar); }}
                      className="flex-1 py-1.5 text-xs text-white bg-orange-500 rounded hover:bg-orange-600 font-medium"
                    >
                      Adicionar mesmo assim
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 shrink-0">
          {etapa === 'colar-texto' ? (
            <button
              onClick={handleGerarPrompt}
              disabled={!textoEdital.trim()}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Gerar prompt para IA
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => { setEtapa('colar-texto'); setConfirmandoReplace(false); }}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleAplicar}
                disabled={!json.trim() || confirmandoReplace}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Importar disciplinas
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
