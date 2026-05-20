# Prompt Técnico de Implementação — Sistema de Revisão Científica + Pareto para Concursos

> **Instrução para a LLM implementadora:** Você é um engenheiro de software sênior especializado em aplicações web educacionais. Sua tarefa é implementar o MVP descrito abaixo seguindo estritamente as especificações, priorizando velocidade de entrega, simplicidade de código e ausência de dependências desnecessárias. Não adicione funcionalidades fora do escopo. Não implemente dashboards complexos. O foco é: cadastro rápido, checklist diário, e feedback de erros em 2 cliques.

---

## 1. Contexto e Objetivo

Aplicativo web para estudantes de concursos públicos que:
1. Recebe o edital manualmente do usuário
2. Usa IA externa (DeepSeek/ChatGPT via copy-paste de prompt) para análise Pareto de provas passadas
3. Aplica auto-diagnóstico de 2 perguntas por disciplina para redistribuir tempo de estudo
4. Gera uma grade semanal factível (checklist diário)
5. Implementa revisão 24h automática e planilha de erros com feedback loop

**Filosofia:** Menos é mais. O app é um organizador inteligente, não um gerador de IA. A IA pesada fica fora do app.

---

## 2. Stack Técnica Sugerida (pode adaptar se justificado)

- **Frontend:** React 18+ + Vite + TypeScript
- **Estado:** React Context + useReducer (evitar Redux/Zustand desnecessários no MVP)
- **Persistência:** Firebase Firestore (ou LocalStorage + JSON export/import se offline-first for prioridade)
- **Autenticação:** Firebase Auth (anônima ou e-mail, mínimo viável)
- **Deploy:** Vercel ou Render
- **Estilização:** Tailwind CSS ou CSS Modules (sem biblioteca de componentes pesada)
- **Ícones:** Lucide React
- **Datas:** date-fns
- **Validação:** Zod para schemas de entrada

**Restrição:** Não use bibliotecas de calendário complexas. A grade é uma lista diária simples, não um calendário mensal visual.

---

## 3. Estrutura de Diretórios Esperada

```
src/
├── components/
│   ├── Layout.tsx              # Header + navegação inferior (3 abas)
│   ├── EditalForm.tsx          # Cadastro de concurso/disciplinas/tópicos
│   ├── ParetoImporter.tsx      # Prompt para IA + colagem de JSON
│   ├── DiagnosticoForm.tsx     # 2 perguntas por disciplina
│   ├── GradeDiaria.tsx         # Checklist do dia (componente principal)
│   ├── Revisao24h.tsx          # Lista de revisões pendentes
│   ├── PlanilhaErros.tsx       # Tópicos problemáticos
│   └── ZonaBadge.tsx           # Componente visual A/B/C
├── hooks/
│   ├── useEdital.ts            # CRUD do edital
│   ├── usePareto.ts            # Cálculo de zonas
│   ├── useDiagnostico.ts       # Nível e multiplicadores
│   ├── useGrade.ts             # Geração e agendamento
│   └── useErros.ts             # Registro e regras de erro
├── types/
│   └── index.ts                # Todas as interfaces TypeScript
├── utils/
│   ├── paretoCalc.ts           # Cálculo de zonas A/B/C
│   ├── gradeGenerator.ts       # Algoritmo de geração da grade
│   └── tempoCalc.ts            # Multiplicadores de tempo
├── data/
│   └── defaultPrompt.ts        # Prompt pré-formatado para IA externa
├── App.tsx
└── main.tsx
```

---

## 4. Requisitos Funcionais Detalhados

### MÓDULO 1 — Cadastro e Edital (Manual)

**RF1.1:** Tela inicial com formulário: nome do concurso, banca, data da prova (date picker), horas disponíveis por semana (number input).

**RF1.2:** Lista dinâmica de disciplinas. Usuário adiciona uma a uma. Para cada disciplina, lista dinâmica de tópicos (texto livre, nível de bloco).

**RF1.3:** Persistência imediata no Firestore/LocalStorage após cada alteração. Não esperar botão "Salvar".

**RF1.4:** Edição inline: usuário pode renomear disciplinas e tópicos, reordenar (drag opcional, pode ser botões ↑↓ no MVP), e excluir.

**RF1.5:** Schema de validação (Zod) para garantir que não existam disciplinas sem nome ou tópicos vazios.

**Critério de aceitação:** Usuário configura o edital em menos de 5 minutos.

---

### MÓDULO 2 — Análise Pareto (via IA Externa)

**RF2.1:** Botão "Analisar com IA" abre modal com:
- Prompt pré-formatado contendo: nome da banca, nome do concurso, lista de disciplinas/tópicos do edital
- Botão "Copiar prompt"
- Área de texto para colar o JSON retornado pela IA externa
- Botão "Aplicar análise"

**RF2.2:** Validação do JSON colado (Zod schema). Se inválido, mostrar erro específico: "O JSON está mal formatado. Verifique se copiou a resposta completa da IA."

**RF2.3:** Ao aplicar, para cada disciplina:
1. Ordenar tópicos por `percentual` decrescente
2. Calcular acumulado
3. Classificar em Zonas:
   - **Zona A:** primeiros tópicos até somar ~80% do peso total da disciplina
   - **Zona B:** próximos até somar ~95%
   - **Zona C:** restantes

**RF2.4:** Exibir tópicos com badges coloridas: A (vermelho/urgente), B (amarelo), C (verde). Mostrar percentual e zona.

**RF2.5:** Permitir ajuste manual: botões para subir/descer um tópico de zona. Persistir override do usuário.

**RF2.6:** Calcular `peso_pareto` da disciplina = soma dos percentuais de seus tópicos (ou média, definir consistentemente).

**Critério de aceitação:** Fluxo completo (copiar prompt → colar JSON → ver zonas) leva menos de 3 minutos.

---

### MÓDULO 3 — Auto-diagnóstico Rápido

**RF3.1:** Para cada disciplina cadastrada, exibir 2 inputs:
1. **Cobertura:** Select 1-5 (1 = nenhum tópico explico sem consulta, 5 = explico todos)
2. **Performance:** Select 1-5 (1 = <30% acerto, 5 = >85% acerto)

**RF3.2:** Nível final = `Math.round((cobertura + performance) / 2)`

**RF3.3:** Multiplicadores de tempo por nível:
| Nível | Multiplicador |
|-------|---------------|
| 1     | 1.0           |
| 2     | 0.9           |
| 3     | 0.8           |
| 4     | 0.6           |
| 5     | 0.4           |

**RF3.4:** Calcular `peso_final` de cada disciplina:
```
peso_final = peso_pareto × multiplicador
// Normalizar para que a soma de todos os pesos_finais = 100%
```

**RF3.5:** Exibir tabela resumo: Disciplina | Peso Pareto | Nível | Multiplicador | Peso Final | Tempo estimado/semana

**Critério de aceitação:** Diagnóstico de 10 disciplinas leva menos de 2 minutos.

---

### MÓDULO 4 — Grade, Revisão 24h e Planilha de Erros

#### 4.1 Geração da Grade Semanal

**RF4.1:** Algoritmo de geração (executado ao clicar "Gerar Grade" ou automaticamente após diagnóstico):

```typescript
// Regras do algoritmo (implementar exatamente assim):
// 1. Separar tópicos por zona (A, B, C)
// 2. Zona A deve ser 100% concluída antes de qualquer B ou C começar
// 3. Dentro de uma semana, alternar disciplinas (máximo 3h seguidas da mesma)
// 4. Tempo base por tópico: padrão 60 min (configurável por tópico no cadastro)
// 5. Tempo final = tempo_base × multiplicador_nível
// 6. Distribuir nas horas/semana informadas no cadastro
// 7. Mostrar estimativa em semanas até a prova (arredondar para cima, sem precisão falsa)
```

**RF4.2:** A grade é uma lista de **dias**, e cada dia é uma lista de **sessões** ordenadas por horário.

**RF4.3:** Cada sessão na grade exibe:
- Horário (calculado sequencialmente, usuário pode ajustar)
- Badge da Zona (A/B/C)
- Nome da disciplina
- Nome do tópico
- Tempo estimado
- Checkbox de conclusão

#### 4.2 Revisão 24h

**RF4.4:** Automaticamente, ao marcar um tópico como "estudado", criar uma sessão de revisão no dia seguinte:
- Tempo = 20-30% do tempo original do tópico (padrão: 25%)
- Método: texto fixo "Active recall + 3 questões sem consulta"
- Status inicial: "pendente"

**RF4.5:** A revisão 24h aparece na grade do dia seguinte com ícone 🔁 e pode ser marcada como concluída.

**RF4.6:** Se o usuário falha na revisão (não marca como concluída até o fim do dia), o tópico é automaticamente registrado na planilha de erros com contador +1.

#### 4.3 Planilha de Erros (Feedback Loop)

**RF4.7:** Botão "😓 Errei / Não entendi" disponível em:
- Cada sessão de estudo (durante ou após)
- Cada questão praticada (se houver módulo de questões no futuro)

**RF4.8:** Ao clicar, registrar:
```json
{
  "topico_id": "string",
  "disciplina": "string",
  "vezes_errada": "number (incrementa)",
  "ultimo_erro": "ISO date",
  "status": "pendente | revisado | dominado"
}
```

**RF4.9:** Regras automáticas:
- Se `vezes_errada` >= 3 → tópico sobe automaticamente uma zona (C→B, B→A)
- Ao subir de zona, agendar automaticamente uma "revisão cirúrgica" de 30 min no próximo dia disponível
- Tópicos com erro recente (últimos 7 dias) recebem prioridade máxima no agendamento

**RF4.10:** Tela da planilha de erros mostra:
- Lista de tópicos problemáticos ordenados por `vezes_errada` (decrescente) e `ultimo_erro` (recente primeiro)
- Badge da zona atual
- Botão "Marcar como dominado" (remove da lista, zera contador)
- Botão "Revisar agora" (cria sessão imediata na grade de hoje)

**RF4.11:** Reavaliação periódica: a cada 14 dias, exibir modal perguntando se o nível de alguma disciplina mudou (opcional, não bloqueante).

**Critério de aceitação:** Registrar um erro leva no máximo 2 cliques. A planilha de erros muda visivelmente a priorização após 2 semanas de uso.

---

## 5. Estruturas de Dados (TypeScript Interfaces)

Implementar EXATAMENTE estas interfaces. Não adicionar campos desnecessários.

```typescript
// types/index.ts

export interface Concurso {
  id: string;
  nome: string;
  banca: string;
  data_prova: string; // ISO date
  horas_semana: number;
  created_at: string;
}

export interface Topico {
  id: string;
  nome: string;
  percentual: number;        // 0-100, vindo da IA ou manual
  zona: 'A' | 'B' | 'C';
  zona_override?: boolean;   // true se usuário ajustou manualmente
  tempo_base_min: number;    // padrão 60
  status: 'pendente' | 'estudado' | 'revisado';
  erros: number;
  data_ultimo_estudo?: string;
  data_ultima_revisao?: string;
}

export interface Disciplina {
  id: string;
  nome: string;
  topicos: Topico[];
  nivel_aluno: 1 | 2 | 3 | 4 | 5;
  peso_pareto: number;       // soma dos percentuais dos tópicos
  peso_final: number;        // normalizado, soma de todas disciplinas = 100
}

export interface EditalCompleto {
  concurso: Concurso;
  disciplinas: Disciplina[];
}

export interface SessaoGrade {
  id: string;
  data: string;              // ISO date
  horario: string;           // "HH:MM"
  tipo: 'estudo' | 'revisao24h' | 'revisao_cirurgica';
  disciplina_id: string;
  topico_id: string;
  topico_nome: string;
  disciplina_nome: string;
  zona: 'A' | 'B' | 'C';
  tempo_min: number;
  concluido: boolean;
  origem_erro?: boolean;    // true se foi gerado por erro
}

export interface RegistroErro {
  topico_id: string;
  disciplina: string;
  vezes_errada: number;
  ultimo_erro: string;     // ISO date
  status: 'pendente' | 'revisado' | 'dominado';
}

export interface PlanilhaErros {
  topicos_problematicos: RegistroErro[];
}

// Schema Zod para validação do JSON da IA
export const AnaliseIASchema = z.object({
  disciplinas: z.array(z.object({
    nome: z.string(),
    topicos: z.array(z.object({
      nome: z.string(),
      percentual: z.number().min(0).max(100)
    }))
  }))
});
```

---

## 6. Fluxos de Usuário (User Flows)

### Fluxo Principal (First Use)
```
Tela Inicial
  → Cadastrar Concurso (nome, banca, data, horas/semana)
  → Adicionar Disciplinas + Tópicos
  → [Opcional] Analisar com IA (copiar prompt → colar JSON → aplicar)
  → Responder Diagnóstico (2 perguntas/disciplina)
  → Gerar Grade
  → Ver Grade Diária (checklist)
```

### Fluxo Diário (Use Recorrente)
```
Abrir App → Grade de Hoje
  → Clicar em sessão → Marcar como concluída ✅
  → Se errou: clicar "😓 Errei" → Registrado na planilha
  → Revisões 24h aparecem automaticamente no dia seguinte
  → Fim do dia: revisões não feitas → Auto-registradas como erro
```

### Fluxo de Ajuste
```
Planilha de Erros
  → Ver tópicos com erro
  → Clicar "Revisar agora" → Sessão cirúrgica adicionada à grade de hoje
  → Após dominar: "Marcar como dominado" → Zera contador
```

---

## 7. Regras de Negócio Críticas (Implementar Literalmente)

1. **Zona A primeiro:** Nunca agendar tópico Zona B ou C se existir Zona A pendente na mesma disciplina.
2. **Alternância de disciplinas:** Não mais que 3h seguidas da mesma disciplina na grade semanal.
3. **Tempo proporcional ao nível:** Nível 5 = 40% do tempo base. Nível 1 = 100% do tempo base.
4. **Erro sobe zona:** 3 erros em um tópico → zona aumenta (C→B, B→A). Se já for A, permanece A mas ganha revisão cirúrgica.
5. **Revisão 24h é obrigatória:** Todo tópico estudado GERA automaticamente uma revisão no dia seguinte. Não é opcional.
6. **Persistência local primeiro:** Toda ação deve persistir imediatamente. O usuário não pode perder dados por fechar o app.
7. **Sem precisão falsa:** Estimativas de semanas são arredondadas para cima. Não mostrar "23,4 dias".

---

## 8. UI/UX Guidelines

- **Layout mobile-first:** O uso principal será no celular durante estudos.
- **Navegação inferior:** 3 abas principais — "📋 Grade" | "📊 Edital" | "😓 Erros"
- **Checklist visual:** Grade diária deve parecer uma lista de tarefas (Todoist simplificado).
- **Cores das zonas:** A = vermelho suave (#fee2e2 texto #991b1b), B = amarelo suave (#fef3c7 texto #92400e), C = verde suave (#d1fae5 texto #065f46).
- **Botão de erro flutuante:** Durante sessão de estudo, FAB (Floating Action Button) com emoji 😓 no canto inferior direito.
- **Estados vazios:** Se não houver grade gerada, mostrar ilustração/ícone + CTA claro "Gerar minha grade".
- **Loading:** Nunca bloquear UI por mais de 2 segundos. Usar skeletons ou spinners inline.

---

## 9. Plano de Implementação por Fases (para a LLM)

### Fase 1 — Estrutura e Cadastro (Semana 1)
- [ ] Setup do projeto (Vite + React + TS + Tailwind)
- [ ] Configurar Firebase (Auth + Firestore) ou LocalStorage fallback
- [ ] Implementar tipos TypeScript (types/index.ts)
- [ ] Implementar tela de cadastro do concurso
- [ ] Implementar CRUD de disciplinas e tópicos
- [ ] Persistência automática

### Fase 2 — Pareto e Diagnóstico (Semana 1-2)
- [ ] Tela de Análise com IA (modal com prompt + paste JSON)
- [ ] Validação Zod do JSON
- [ ] Algoritmo de cálculo de zonas A/B/C
- [ ] Tela de auto-diagnóstico (2 perguntas/disciplina)
- [ ] Cálculo de pesos finais e normalização

### Fase 3 — Grade e Revisão (Semana 2-3)
- [ ] Algoritmo de geração da grade semanal
- [ ] Tela de grade diária (checklist)
- [ ] Lógica de revisão 24h automática
- [ ] Marcação de conclusão e persistência de status

### Fase 4 — Planilha de Erros e Feedback (Semana 3-4)
- [ ] Botão de erro durante estudo
- [ ] Tela da planilha de erros
- [ ] Regras de subida de zona após 3 erros
- [ ] Agendamento de revisão cirúrgica
- [ ] Reavaliação periódica (modal a cada 14 dias)

### Fase 5 — Polimento e Deploy (Semana 4-6)
- [ ] Responsividade mobile
- [ ] Testes manuais de fluxo completo
- [ ] Deploy na Vercel/Render
- [ ] Exportação de dados (JSON backup)

---

## 10. Critérios de Sucesso do MVP (Validar antes de entregar)

- [ ] Usuário consegue configurar o plano em menos de 10 minutos (testar com timer)
- [ ] A cada dia, a grade está clara e factível (checklist com no máximo 5 itens para 3h de estudo)
- [ ] Registrar um erro leva no máximo 2 cliques (contar clicks no fluxo)
- [ ] O Pareto + planilha de erros muda visivelmente a priorização após 2 semanas de uso simulado
- [ ] App funciona offline após primeiro carregamento (dados em cache/local)
- [ ] Nenhum dado é perdido ao fechar o navegador

---

## 11. O que NÃO Implementar (Escopo Negativo)

- ❌ OCR ou NLP de edital PDF
- ❌ Web scraping de provas
- ❌ Cálculo próprio de Índice de Aproveitamento/Item de Concurso
- ❌ Revisão acumulada (múltiplas revisões espaçadas)
- ❌ Revisão fatiada (dividir tópico em partes)
- ❌ Heatmaps, gráficos complexos, dashboards analíticos
- ❌ Comparação com outros usuários
- ❌ Sistema de amigos/ranking
- ❌ Notificações push nativas (pode usar lembrete visual no app)
- ❌ Importação automática de questões de bancos de dados
- ❌ Modo escuro (pode vir depois)
- ❌ PWA complexo (service worker básico opcional)

---

## 12. Prompt de Inicialização para a LLM Implementadora

```
Você acabou de receber o documento de especificação acima. 

Sua primeira tarefa é implementar a Fase 1 completa: setup do projeto, tipos TypeScript, e o Módulo 1 (Cadastro e Edital Manual). 

Regras:
1. Use React + Vite + TypeScript + Tailwind CSS
2. Use LocalStorage para persistência no MVP (Firebase pode ser adicionado depois)
3. Não instale bibliotecas desnecessárias
4. Crie os componentes na estrutura de pastas definida na seção 3
5. Valide todas as entradas com Zod
6. O código deve ser simples, legível e bem comentado em português
7. Entregue o código completo, arquivo por arquivo, pronto para rodar com `npm run dev`

Comece agora.
```

---

*Documento gerado para implementação imediata. Não altere a filosofia do MVP: menos funcionalidades, muito bem executadas.*
