import { useState, useCallback } from 'react';
import { useEdital } from '../hooks/useEdital';
import { ConcursoSchema, type ConcursoInput, type Disciplina, type Topico } from '../types';
import { Plus, Trash2, ChevronUp, ChevronDown, Edit2, Check, X, Sparkles, FileText } from 'lucide-react';
import ZonaBadge from './ZonaBadge';
import ParetoImporter from './ParetoImporter';
import EditalImporter from './EditalImporter';
import { subirZona, descerZona } from '../utils/paretoCalc';

export default function EditalForm() {
  const { edital, setConcurso, addDisciplina, updateDisciplina, removeDisciplina, addTopico, updateTopico, removeTopico, reorderTopicos } = useEdital();

  const [formConcurso, setFormConcurso] = useState<{
    nome: string;
    banca: string;
    data_prova: string;
    horas_semana: string;
  }>({
    nome: edital?.concurso.nome || '',
    banca: edital?.concurso.banca || '',
    data_prova: edital?.concurso.data_prova ? edital.concurso.data_prova.split('T')[0] : '',
    horas_semana: edital?.concurso.horas_semana?.toString() || '',
  });

  const [errosConcurso, setErrosConcurso] = useState<Record<string, string>>({});
  const [novaDisciplina, setNovaDisciplina] = useState('');
  const [disciplinaEditando, setDisciplinaEditando] = useState<string | null>(null);
  const [nomeDisciplinaEdit, setNomeDisciplinaEdit] = useState('');
  const [novoTopico, setNovoTopico] = useState<Record<string, string>>({});
  const [topicoEditando, setTopicoEditando] = useState<{ disciplinaId: string; topicoId: string } | null>(null);
  const [nomeTopicoEdit, setNomeTopicoEdit] = useState('');
  const [showParetoImporter, setShowParetoImporter] = useState(false);
  const [showEditalImporter, setShowEditalImporter] = useState(false);

  const validarCampo = useCallback((campo: keyof ConcursoInput, valor: string | number) => {
    const partial = { ...formConcurso, [campo]: valor };
    const result = ConcursoSchema.safeParse({
      ...partial,
      horas_semana: partial.horas_semana ? parseInt(partial.horas_semana) : 0,
    });
    if (!result.success) {
      const fieldError = result.error.issues.find((e) => e.path[0] === campo);
      setErrosConcurso((prev) => ({ ...prev, [campo]: fieldError?.message || '' }));
      return false;
    }
    setErrosConcurso((prev) => {
      const next = { ...prev };
      delete next[campo];
      return next;
    });
    return true;
  }, [formConcurso]);

  const handleConcursoChange = (campo: keyof typeof formConcurso, valor: string) => {
    setFormConcurso((prev) => ({ ...prev, [campo]: valor }));
    validarCampo(campo as keyof ConcursoInput, valor);
  };

  const salvarConcurso = () => {
    const result = ConcursoSchema.safeParse({
      nome: formConcurso.nome,
      banca: formConcurso.banca,
      data_prova: formConcurso.data_prova,
      horas_semana: parseInt(formConcurso.horas_semana) || 0,
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((e) => {
        if (e.path[0]) errors[e.path[0].toString()] = e.message;
      });
      setErrosConcurso(errors);
      return;
    }

    setConcurso({
      id: edital?.concurso.id || crypto.randomUUID(),
      nome: result.data.nome,
      banca: result.data.banca,
      data_prova: new Date(result.data.data_prova).toISOString(),
      horas_semana: result.data.horas_semana,
      created_at: edital?.concurso.created_at || new Date().toISOString(),
    });
  };

  const handleAddDisciplina = () => {
    if (!novaDisciplina.trim()) return;
    addDisciplina({
      id: crypto.randomUUID(),
      nome: novaDisciplina.trim(),
      topicos: [],
      nivel_aluno: 1,
      peso_pareto: 0,
      peso_final: 0,
    });
    setNovaDisciplina('');
  };

  const handleAddTopico = (disciplinaId: string) => {
    const nome = novoTopico[disciplinaId]?.trim();
    if (!nome) return;
    addTopico(disciplinaId, {
      id: crypto.randomUUID(),
      nome,
      percentual: 0,
      zona: 'C',
      tempo_base_min: 60,
      status: 'pendente',
      erros: 0,
    });
    setNovoTopico((prev) => ({ ...prev, [disciplinaId]: '' }));
  };

  const handleRemoveDisciplina = (id: string) => {
    if (confirm('Tem certeza que deseja remover esta disciplina e todos os seus tópicos?')) {
      removeDisciplina(id);
    }
  };

  const handleRemoveTopico = (disciplinaId: string, topicoId: string) => {
    removeTopico(disciplinaId, topicoId);
  };

  const handleReorderTopico = (disciplinaId: string, index: number, direcao: 'up' | 'down') => {
    const disciplina = edital?.disciplinas.find((d) => d.id === disciplinaId);
    if (!disciplina) return;
    const novosTopicos = [...disciplina.topicos];
    const newIndex = direcao === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= novosTopicos.length) return;
    [novosTopicos[index], novosTopicos[newIndex]] = [novosTopicos[newIndex], novosTopicos[index]];
    reorderTopicos(disciplinaId, novosTopicos);
  };

  const iniciarEditDisciplina = (disciplina: Disciplina) => {
    setDisciplinaEditando(disciplina.id);
    setNomeDisciplinaEdit(disciplina.nome);
  };

  const salvarEditDisciplina = (disciplina: Disciplina) => {
    if (!nomeDisciplinaEdit.trim()) return;
    updateDisciplina({ ...disciplina, nome: nomeDisciplinaEdit.trim() });
    setDisciplinaEditando(null);
    setNomeDisciplinaEdit('');
  };

  const cancelarEditDisciplina = () => {
    setDisciplinaEditando(null);
    setNomeDisciplinaEdit('');
  };

  const iniciarEditTopico = (disciplinaId: string, topico: Topico) => {
    setTopicoEditando({ disciplinaId, topicoId: topico.id });
    setNomeTopicoEdit(topico.nome);
  };

  const salvarEditTopico = (disciplinaId: string, topico: Topico) => {
    if (!nomeTopicoEdit.trim()) return;
    updateTopico(disciplinaId, { ...topico, nome: nomeTopicoEdit.trim() });
    setTopicoEditando(null);
    setNomeTopicoEdit('');
  };

  const cancelarEditTopico = () => {
    setTopicoEditando(null);
    setNomeTopicoEdit('');
  };

  return (
    <div className="space-y-6">
      {showParetoImporter && <ParetoImporter onClose={() => setShowParetoImporter(false)} />}
      {showEditalImporter && <EditalImporter onClose={() => setShowEditalImporter(false)} />}

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados do Concurso</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Concurso</label>
            <input
              type="text"
              value={formConcurso.nome}
              onChange={(e) => handleConcursoChange('nome', e.target.value)}
              onBlur={salvarConcurso}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errosConcurso.nome ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: Concurso TRT 12ª Região"
            />
            {errosConcurso.nome && (
              <p className="text-xs text-red-600 mt-1">{errosConcurso.nome}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banca</label>
            <input
              type="text"
              value={formConcurso.banca}
              onChange={(e) => handleConcursoChange('banca', e.target.value)}
              onBlur={salvarConcurso}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errosConcurso.banca ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: FCC"
            />
            {errosConcurso.banca && (
              <p className="text-xs text-red-600 mt-1">{errosConcurso.banca}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data da Prova</label>
            <input
              type="date"
              value={formConcurso.data_prova}
              onChange={(e) => handleConcursoChange('data_prova', e.target.value)}
              onBlur={salvarConcurso}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errosConcurso.data_prova ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errosConcurso.data_prova && (
              <p className="text-xs text-red-600 mt-1">{errosConcurso.data_prova}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horas Disponíveis por Semana</label>
            <input
              type="number"
              min="1"
              max="168"
              value={formConcurso.horas_semana}
              onChange={(e) => handleConcursoChange('horas_semana', e.target.value)}
              onBlur={salvarConcurso}
              className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errosConcurso.horas_semana ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Ex: 20"
            />
            {errosConcurso.horas_semana && (
              <p className="text-xs text-red-600 mt-1">{errosConcurso.horas_semana}</p>
            )}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Disciplinas e Tópicos</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditalImporter(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 transition-colors"
            >
              <FileText size={13} />
              Importar edital
            </button>
            {edital?.disciplinas && edital.disciplinas.length > 0 && (
              <button
                onClick={() => setShowParetoImporter(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-md text-xs font-medium hover:bg-purple-700 transition-colors"
              >
                <Sparkles size={13} />
                Analisar com IA
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={novaDisciplina}
            onChange={(e) => setNovaDisciplina(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddDisciplina()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nome da nova disciplina"
          />
          <button
            onClick={handleAddDisciplina}
            disabled={!novaDisciplina.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>

        {edital?.disciplinas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Nenhuma disciplina cadastrada.</p>
            <p className="text-xs mt-1">Adicione disciplinas do edital acima.</p>
          </div>
        )}

        <div className="space-y-4">
          {edital?.disciplinas.map((disciplina) => (
            <div key={disciplina.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                {disciplinaEditando === disciplina.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={nomeDisciplinaEdit}
                      onChange={(e) => setNomeDisciplinaEdit(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') salvarEditDisciplina(disciplina);
                        if (e.key === 'Escape') cancelarEditDisciplina();
                      }}
                      autoFocus
                      className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                    />
                    <button onClick={() => salvarEditDisciplina(disciplina)} className="text-green-600 p-1">
                      <Check size={16} />
                    </button>
                    <button onClick={cancelarEditDisciplina} className="text-gray-400 p-1">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-medium text-gray-900">{disciplina.nome}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => iniciarEditDisciplina(disciplina)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveDisciplina(disciplina.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Remover"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                {disciplina.topicos.map((topico, index) => (
                  <div key={topico.id} className="flex items-center gap-2 bg-gray-50 rounded px-2 py-1.5">
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleReorderTopico(disciplina.id, index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        onClick={() => handleReorderTopico(disciplina.id, index, 'down')}
                        disabled={index === disciplina.topicos.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-30 p-0.5"
                      >
                        <ChevronDown size={12} />
                      </button>
                    </div>

                    {topicoEditando?.disciplinaId === disciplina.id && topicoEditando?.topicoId === topico.id ? (
                      <>
                        <input
                          type="text"
                          value={nomeTopicoEdit}
                          onChange={(e) => setNomeTopicoEdit(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') salvarEditTopico(disciplina.id, topico);
                            if (e.key === 'Escape') cancelarEditTopico();
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-blue-300 rounded text-sm"
                        />
                        <button onClick={() => salvarEditTopico(disciplina.id, topico)} className="text-green-600 p-1">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelarEditTopico} className="text-gray-400 p-1">
                          <X size={14} />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm text-gray-700">{topico.nome}</span>
                        {topico.percentual > 0 && (
                          <ZonaBadge
                            zona={topico.zona}
                            percentual={topico.percentual}
                            showControls
                            onSubirZona={() =>
                              updateTopico(disciplina.id, {
                                ...topico,
                                zona: subirZona(topico.zona),
                                zona_override: true,
                              })
                            }
                            onDescerZona={() =>
                              updateTopico(disciplina.id, {
                                ...topico,
                                zona: descerZona(topico.zona),
                                zona_override: true,
                              })
                            }
                          />
                        )}
                        <button
                          onClick={() => iniciarEditTopico(disciplina.id, topico)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleRemoveTopico(disciplina.id, topico.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Remover"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                ))}

                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={novoTopico[disciplina.id] || ''}
                    onChange={(e) => setNovoTopico((prev) => ({ ...prev, [disciplina.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTopico(disciplina.id)}
                    className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Novo tópico"
                  />
                  <button
                    onClick={() => handleAddTopico(disciplina.id)}
                    disabled={!novoTopico[disciplina.id]?.trim()}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
