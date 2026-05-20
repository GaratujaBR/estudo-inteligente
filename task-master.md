# Task Master — MVP Revisão Científica + Pareto para Concursos

> **Instrução de uso:** Use `- [ ]` para tarefas pendentes, `- [~]` para em andamento, `- [x]` para concluídas.
> **Legenda:** `🔗` indica dependência da task listada.

---

## Fase 1: Estrutura e Cadastro

### 1.1 Setup do Projeto
- [ ] Inicializar projeto com Vite + React + TypeScript
- [ ] Instalar dependências: `tailwindcss`, `lucide-react`, `date-fns`, `zod`, `uuid`
- [ ] Configurar Tailwind CSS (`tailwind.config.js`, `src/index.css`)
- [ ] Configurar estrutura de pastas conforme seção 3 do prompt
- **Arquivos:** `package.json`, `vite.config.ts`, `tailwind.config.js`, `src/index.css`
- **Critério de pronto:** `npm run dev` roda sem erros, Tailwind aplicado em componente de teste

### 1.2 Tipos TypeScript
- [ ] Implementar TODAS as interfaces do `types/index.ts` conforme prompt (Concurso, Topico, Disciplina, EditalCompleto, SessaoGrade, RegistroErro, PlanilhaErros)
- [ ] Definir schemas Zod (AnaliseIASchema, EditalSchema, DiagnosticoSchema)
- **Arquivos:** `src/types/index.ts`
- **Critério de pronto:** Compila sem erros, todas interfaces exportadas, Zod valida corretamente

### 1.3 Layout Base + Navegação
- [ ] Criar `Layout.tsx` com header simples + navegação inferior (3 abas)
- [ ] Abas: "📋 Grade" | "📊 Edital" | "😓 Erros"
- [ ] Implementar estado de aba ativa no `App.tsx` (useState simples, sem router)
- [ ] Estilo mobile-first com Tailwind
- **Arquivos:** `src/components/Layout.tsx`, `src/App.tsx`
- **Dependências:** 🔗 1.1, 🔗 1.2
- **Critério de pronto:** Navegação funcional entre 3 abas com componentes placeholder

### 1.4 Hook de Persistência (useEdital)
- [ ] Criar `useEdital.ts` com Context ou hook simples (useReducer)
- [ ] LocalStorage: chave `"edital_completo"`, auto-persist em toda mutação
- [ ] Funções: carregarEdital(), salvarEdital(), addDisciplina(), removeDisciplina(), addTopico(), removeTopico(), updateTopico(), reordenarTopicos()
- [ ] ID generation: `crypto.randomUUID()` (ou uuidv4)
- [ ] Schema Zod para validação antes de salvar
- **Arquivos:** `src/hooks/useEdital.ts`
- **Dependências:** 🔗 1.2
- **Critério de pronto:** Dados persistem no localStorage e sobrevivem a reloads

### 1.5 Formulário de Cadastro do Concurso
- [ ] Criar seção no `EditalForm.tsx`: nome (text), banca (text), data_prova (date), horas_semana (number)
- [ ] Validação Zod em tempo real (onBlur) com mensagens inline
- [ ] Persistência via `useEdital`
- **Arquivos:** `src/components/EditalForm.tsx`
- **Dependências:** 🔗 1.4
- **Critério de pronto:** Concurso salva automaticamente, campos validados, erro mostrado se inválido

### 1.6 CRUD de Disciplinas e Tópicos
- [ ] Extender `EditalForm.tsx` com lista dinâmica de disciplinas
- [ ] Para cada disciplina: lista dinâmica de tópicos (texto livre)
- [ ] Inline edit: renomear disciplina/tópico
- [ ] Reordenar: botões ↑↓ (drag para depois do MVP)
- [ ] Excluir: botão 🗑 com confirmação
- [ ] Validação Zod: sem disciplina sem nome, sem tópico vazio
- **Arquivos:** `src/components/EditalForm.tsx` (extensão)
- **Dependências:** 🔗 1.5
- **Critério de pronto:** CRUD completo funcional, dados persistem, validação ativa

### 1.7 Estados Vazios e Loading
- [ ] Adicionar estados vazios nos componentes principais
- [ ] Skeleton/spinner inline (nunca bloquear UI por mais de 2s)
- [ ] CTA claro em estado vazio (ex: "Cadastre seu edital para começar")
- **Arquivos:** Inline nos componentes `Layout.tsx`, `EditalForm.tsx`
- **Dependências:** 🔗 1.3
- **Critério de pronto:** App nunca mostra tela branca, sempre há contexto para o usuário

---

## Fase 2: Pareto e Diagnóstico

### 2.1 Prompt Pré-formatado
- [ ] Criar `defaultPrompt.ts` com template string
- [ ] Prompt deve montar: nome banca, nome concurso, lista disciplinas/tópicos
- [ ] Instrução de formatação: "Responda apenas em JSON válido com a estrutura..."
- **Arquivos:** `src/data/defaultPrompt.ts`
- **Dependências:** 🔗 1.2
- **Critério de pronto:** Prompt testado manualmente, gera JSON válido quando copiado para IA

### 2.2 Modal de Análise com IA
- [ ] Criar `ParetoImporter.tsx` (modal/dialog)
- [ ] Mostrar prompt pré-formatado em `<pre>`
- [ ] Botão "Copiar prompt" (navigator.clipboard)
- [ ] Área de texto para colar JSON retornado pela IA
- [ ] Botão "Aplicar análise" com validação Zod
- [ ] Erro específico se JSON inválido: "O JSON está mal formatado. Verifique se copiou a resposta completa da IA."
- **Arquivos:** `src/components/ParetoImporter.tsx`
- **Dependências:** 🔗 2.1, 🔗 1.2
- **Critério de pronto:** Fluxo completo (copiar → colar → validar → aplicar) funcional

### 2.3 Algoritmo de Zonas A/B/C
- [ ] Criar `paretoCalc.ts`
- [ ] Função `calcularZonas(topicos: Topico[]): Topico[]`
- [ ] Regras: ordenar por percentual desc, calcular acumulado, classificar A(~80%), B(~95%), C
- [ ] Função `calcularPesoPareto(disciplina: Disciplina): number`
- [ ] Testar com dados mock (incluir no arquivo ou teste manual)
- **Arquivos:** `src/utils/paretoCalc.ts`
- **Dependências:** 🔗 1.2
- **Critério de pronto:** Classificação correta com dados de teste conhecidos

### 2.4 Componente ZonaBadge
- [ ] Criar `ZonaBadge.tsx`
- [ ] Props: zona, percentual (opcional)
- [ ] Cores: A=#fee2e2/#991b1b, B=#fef3c7/#92400e, C=#d1fae5/#065f46
- [ ] Exibir letra + percentual
- [ ] Botões ↑↓ para ajuste manual (atualiza zona_override)
- **Arquivos:** `src/components/ZonaBadge.tsx`
- **Dependências:** 🔗 1.2
- **Critério de pronto:** Badges renderizam corretamente, ajuste manual persiste

### 2.5 Tela de Diagnóstico
- [ ] Criar `DiagnosticoForm.tsx`
- [ ] Para cada disciplina cadastrada: 2 selects (1-5): Cobertura e Performance
- [ ] Nível final = Math.round((cobertura + performance) / 2)
- [ ] Criar `useDiagnostico.ts` com cálculo e persistência
- [ ] Tabela resumo: Disciplina | Peso Pareto | Nível | Multiplicador | Peso Final | Tempo/semana
- **Arquivos:** `src/components/DiagnosticoForm.tsx`, `src/hooks/useDiagnostico.ts`
- **Dependências:** 🔗 2.3, 🔗 1.4
- **Critério de pronto:** Diagnóstico de 10 disciplinas concluído em <2 min, tabela resumo correta

### 2.6 Cálculo de Pesos Finais
- [ ] Criar `tempoCalc.ts`
- [ ] peso_final = peso_pareto × multiplicador (nível)
- [ ] Normalizar para soma de todas disciplinas = 100%
- [ ] Calcular tempo estimado/semana em minutos
- [ ] Tabele de multiplicadores: N1=1.0, N2=0.9, N3=0.8, N4=0.6, N5=0.4
- **Arquivos:** `src/utils/tempoCalc.ts`
- **Dependências:** 🔗 2.5, 🔗 1.2
- **Critério de pronto:** Normalização correta, soma dos pesos_finais = 100

---

## Fase 3: Grade e Revisão 24h

### 3.1 Algoritmo Gerador de Grade
- [ ] Criar `gradeGenerator.ts`
- [ ] Função `gerarGrade(edital: EditalCompleto, dataInicio: Date): SessaoGrade[]`
- [ ] Implementar 7 regras do RF4.1:
  1. Separar tópicos por zona (A, B, C)
  2. Zona A 100% antes de B ou C começar
  3. Alternar disciplinas (máximo 3h seguidas da mesma)
  4. Tempo base por tópico (padrão 60min, configurável)
  5. Tempo final = tempo_base × multiplicador_nível
  6. Distribuir nas horas/semana informadas
  7. Estimativa em semanas até a prova (arredondar para cima)
- [ ] Criar IDs únicos para cada sessão
- **Arquivos:** `src/utils/gradeGenerator.ts`
- **Dependências:** 🔗 2.6, 🔗 2.3
- **Critério de pronto:** Grade gerada respeita todas as regras de negócio, com dados de teste

### 3.2 Hook useGrade
- [ ] Criar `useGrade.ts`
- [ ] Estado: array de `SessaoGrade`
- [ ] Funções: getGradeDoDia(data), marcarConcluido(sessaoId), getSessoesPendentes(), getProximasSessoes()
- [ ] Persistência em localStorage (chave `"grade_semanal"`)
- [ ] Sincronizar com useEdital quando necessário
- **Arquivos:** `src/hooks/useGrade.ts`
- **Dependências:** 🔗 3.1
- **Critério de pronto:** CRUD de sessões funcional, dados persistem

### 3.3 Tela de Grade Diária
- [ ] Criar `GradeDiaria.tsx` — tela principal do app
- [ ] Lista de sessões do dia atual em formato checklist
- [ ] Cada item: horário, badge Zona, disciplina, tópico, tempo estimado, checkbox
- [ ] Checkbox de conclusão com animação visual (riscar, fade out)
- [ ] Estado vazio: ícone + "Gerar minha grade" CTA
- [ ] FAB "😓 Errei" visível em cada sessão
- **Arquivos:** `src/components/GradeDiaria.tsx`
- **Dependências:** 🔗 3.2, 🔗 2.4
- **Critério de pronto:** Checklist funcional, marcar conclusão persiste

### 3.4 Revisão 24h Automática
- [ ] Criar `Revisao24h.tsx` (lista dentro da grade)
- [ ] Ao marcar sessão como "estudado", gerar `SessaoGrade` no dia seguinte:
  - tipo: `'revisao24h'`
  - tempo_min: 25% do tempo original
  - Status: pendente
- [ ] Ícone 🔁 na grade
- [ ] Se não concluída até fim do dia → auto-registrar na planilha de erros
- **Arquivos:** `src/components/Revisao24h.tsx`, extensão `useGrade.ts`
- **Dependências:** 🔗 3.3, 🔗 4.1
- **Critério de pronto:** Revisão aparece automaticamente no dia seguinte, não-concluída gera erro

### 3.5 Hook useErros
- [ ] Criar `useErros.ts`
- [ ] Estado: `PlanilhaErros` (array de `RegistroErro`)
- [ ] Funções: registrarErro(topicoId, disciplina), marcarDominado(topicoId), marcarRevisado(topicoId), getErrosRecentes()
- [ ] Incrementar contador, atualizar ultimo_erro (ISO date)
- [ ] Persistência localStorage
- **Arquivos:** `src/hooks/useErros.ts`
- **Dependências:** 🔗 1.2
- **Critério de pronto:** CRUD de erros funcional, dados persistem

---

## Fase 4: Planilha de Erros e Feedback

### 4.1 Botão de Erro (FAB)
- [ ] Adicionar FAB "😓" em cada sessão da `GradeDiaria.tsx`
- [ ] 2 cliques: clicar → confirmar (ou modal rápido) → registrado
- [ ] Integrar com `useErros.registrarErro()`
- [ ] Feedback visual de confirmação (toast simples ou animação CSS)
- **Arquivos:** `src/components/GradeDiaria.tsx` (extensão)
- **Dependências:** 🔗 3.5, 🔗 3.3
- **Critério de pronto:** Erro registrado em exatamente 2 cliques

### 4.2 Tela Planilha de Erros
- [ ] Criar `PlanilhaErros.tsx`
- [ ] Lista ordenada: vezes_errada (desc) → ultimo_erro (recente)
- [ ] Cada item: tópico, disciplina, badge zona atual, contador de erros
- [ ] Botão "Marcar como dominado" → zera contador, remove da lista
- [ ] Botão "Revisar agora" → adiciona sessão cirúrgica ao dia atual
- [ ] Estado vazio: "Nenhum erro registrado ainda"
- **Arquivos:** `src/components/PlanilhaErros.tsx`
- **Dependências:** 🔗 3.5
- **Critério de pronto:** Lista renderiza corretamente, ações funcionam

### 4.3 Regras de Subida de Zona
- [ ] Implementar em `useErros.ts`
- [ ] Regra: se `vezes_errada >= 3` → tópico sobe de zona (C→B, B→A, A mantém)
- [ ] Atualizar campo `zona` no `Topico` do edital
- [ ] Agendar automaticamente "revisão cirúrgica" de 30 min no próximo dia disponível
- [ ] Dar prioridade máxima a tópicos com erro recente (< 7 dias)
- **Arquivos:** `src/hooks/useErros.ts`, `src/hooks/useEdital.ts`, `src/hooks/useGrade.ts`
- **Dependências:** 🔗 4.1, 🔗 3.2
- **Critério de pronto:** 3 erros no mesmo tópico → zona sobe + revisão cirúrgica aparece na grade

### 4.4 Modal de Reavaliação Periódica
- [ ] Criar componente modal
- [ ] Aparece a cada 14 dias (armazenar data_ultima_reavaliacao no localStorage)
- [ ] Pergunta: "Seu nível de conhecimento mudou?"
- [ ] Link para `DiagnosticoForm` (reavaliação)
- [ ] Botão "Lembrar depois" (não bloqueante)
- **Arquivos:** Novo componente em `src/components/`, chamado no `App.tsx`
- **Dependências:** 🔗 2.5, 🔗 1.4
- **Critério de pronto:** Modal aparece após 14 dias, fecha sem bloquear o app

### 4.5 Exportação de Dados
- [ ] Criar função `exportarDados()`
- [ ] Gera JSON com: `EditalCompleto`, array `SessaoGrade`, `PlanilhaErros`
- [ ] Download automático como arquivo `.json`
- [ ] (Opcional) Importação do mesmo JSON
- **Arquivos:** `src/utils/backup.ts` ou hook
- **Dependências:** 🔗 1.4
- **Critério de pronto:** JSON baixado contém todos os dados do usuário

---

## Fase 5: Polimento e Deploy

### 5.1 Responsividade Mobile
- [ ] Testar todos componentes em viewport 375px (mobile)
- [ ] Garantir touch targets mínimo 44px
- [ ] Ajustar fontes, padding, layout para tela pequena
- [ ] Testar navegação inferior com notch (safe areas)
- [ ] Sem scroll horizontal
- **Arquivos:** Todos componentes
- **Dependências:** Todas as fases anteriores
- **Critério de pronto:** App usável em celular sem zoom

### 5.2 Testes Manuais de Fluxo Completo
- [ ] Executar fluxo principal completo e cronometrar:
  - [ ] Cadastro do edital < 5 minutos
  - [ ] Análise com IA < 3 minutos
  - [ ] Diagnóstico de 10 disciplinas < 2 minutos
  - [ ] Registrar erro ≤ 2 cliques
- [ ] Verificar persistência: fechar navegador e reabrir
- [ ] Verificar revisão 24h aparece no dia seguinte (simular com data futura)
- [ ] Verificar planilha de erros altera priorização após 2 semanas simuladas
- [ ] Verificar offline: app carrega dados em cache sem rede
- **Arquivos:** Checklist manual (documentar no Notion/Markdown)
- **Dependências:** 🔗 5.1
- **Critério de pronto:** Todos critérios de aceitação passam

### 5.3 Deploy na Vercel
- [ ] Criar conta Vercel (ou usar existente)
- [ ] Conectar repositório Git
- [ ] Configurar build output: `dist/`
- [ ] Deploy e testar em produção (URL pública)
- [ ] Testar em dispositivo real (celular)
- **Arquivos:** `vercel.json` (se necessário)
- **Dependências:** 🔗 5.2
- **Critério de pronto:** URL pública funcional, acessível do celular

### 5.4 README e Documentação Mínima
- [ ] Criar `README.md`:
  - Como rodar localmente (`npm install`, `npm run dev`)
  - Stack utilizada
  - Funcionalidades principais
  - Regras de negócio (resumo das 7 regras críticas)
- [ ] Guia rápido de uso (1 página)
- **Arquivos:** `README.md`
- **Dependências:** 🔗 5.3
- **Critério de pronto:** Novo desenvolvedor roda o projeto em 5 minutos seguindo o README

---

## Resumo de Dependências

```
1.1 (Setup)
 └─ 1.2 (Tipos)
     ├─ 1.3 (Layout)
     │   └─ 1.7 (Estados Vazios)
     ├─ 1.4 (useEdital)
     │   ├─ 1.5 (Form Concurso)
     │   │   └─ 1.6 (CRUD Disciplinas)
     │   └─ 2.5 (Diagnóstico)
     │       └─ 2.6 (tempoCalc)
     ├─ 2.1 (defaultPrompt)
     │   └─ 2.2 (ParetoImporter)
     ├─ 2.3 (paretoCalc)
     │   ├─ 2.4 (ZonaBadge)
     │   └─ 2.5 (Diagnóstico)
     │       └─ 2.6 (tempoCalc)
     │           └─ 3.1 (gradeGenerator)
     │               └─ 3.2 (useGrade)
     │                   ├─ 3.3 (GradeDiaria)
     │                   │   ├─ 3.4 (Revisao24h)
     │                   │   │   └─ 4.1 (FAB Erro)
     │                   │   └─ 4.1 (FAB Erro)
     │                   └─ 4.3 (Subida Zona)
     └─ 3.5 (useErros)
         ├─ 4.1 (FAB Erro)
         ├─ 4.2 (PlanilhaErros)
         └─ 4.3 (Subida Zona)

4.4 (Reavaliação) ── depende de 2.5, 1.4
4.5 (Export) ── depende de 1.4

5.1 (Responsividade) ── depende de TODAS as fases
 └─ 5.2 (Testes) ── depende de 5.1
     └─ 5.3 (Deploy) ── depende de 5.2
         └─ 5.4 (README) ── depende de 5.3
```

---

## Inventário de Arquivos

| Arquivo | Descrição | Criado na Task |
|---------|-----------|---------------|
| `package.json` | Dependências do projeto | 1.1 |
| `vite.config.ts` | Configuração do Vite | 1.1 |
| `tailwind.config.js` | Configuração do Tailwind | 1.1 |
| `src/index.css` | Estilos globais + Tailwind | 1.1 |
| `src/types/index.ts` | TODAS interfaces TypeScript + Zod | 1.2 |
| `src/App.tsx` | App principal com roteamento por abas | 1.3 |
| `src/components/Layout.tsx` | Header + navegação inferior | 1.3 |
| `src/hooks/useEdital.ts` | CRUD do edital + persistência | 1.4 |
| `src/components/EditalForm.tsx` | Cadastro concurso/disciplinas/tópicos | 1.5, 1.6 |
| `src/data/defaultPrompt.ts` | Prompt pré-formatado para IA | 2.1 |
| `src/components/ParetoImporter.tsx` | Modal IA (prompt + paste JSON) | 2.2 |
| `src/utils/paretoCalc.ts` | Cálculo de zonas A/B/C | 2.3 |
| `src/components/ZonaBadge.tsx` | Badge visual das zonas | 2.4 |
| `src/hooks/useDiagnostico.ts` | Estado e lógica do diagnóstico | 2.5 |
| `src/components/DiagnosticoForm.tsx` | Tela diagnóstico + resumo | 2.5 |
| `src/utils/tempoCalc.ts` | Cálculo peso_final e tempo | 2.6 |
| `src/utils/gradeGenerator.ts` | Algoritmo de geração da grade | 3.1 |
| `src/hooks/useGrade.ts` | CRUD da grade semanal | 3.2 |
| `src/components/GradeDiaria.tsx` | Checklist do dia (tela principal) | 3.3 |
| `src/components/Revisao24h.tsx` | Lista de revisões pendentes | 3.4 |
| `src/hooks/useErros.ts` | CRUD da planilha de erros | 3.5 |
| `src/components/PlanilhaErros.tsx` | Tela tópicos problemáticos | 4.2 |
| `src/utils/backup.ts` | Exportação/importação JSON | 4.5 |
| `README.md` | Documentação do projeto | 5.4 |

---

## Checklist Final de Validação do MVP

Antes de considerar o projeto "pronto", validar:

- [ ] Usuário configura plano em < 10 min (testar com timer)
- [ ] Grade diária ≤ 5 itens para 3h de estudo
- [ ] Registrar erro ≤ 2 cliques
- [ ] Pareto + erros altera visivelmente a priorização após 2 semanas simuladas
- [ ] App funciona offline após primeiro carregamento
- [ ] Nenhum dado perdido ao fechar navegador
- [ ] Nenhum campo mostra "23,4 dias" (sem precisão falsa)
- [ ] Nunca mais que 3h seguidas da mesma disciplina
- [ ] Zona A sempre completa antes de B ou C começar
- [ ] Revisão 24h gerada automaticamente para TODO tópico estudado

---

*Task Master criado em: 2026-05-18*
*Última atualização: (preencher ao editar)*
