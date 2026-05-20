import { z } from 'zod';

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

export type Zona = 'A' | 'B' | 'C';
export type NivelAluno = 1 | 2 | 3 | 4 | 5;
export type StatusTopico = 'pendente' | 'estudado' | 'revisado';
export type TipoSessao = 'estudo' | 'revisao24h' | 'revisao_cirurgica';
export type StatusErro = 'pendente' | 'revisado' | 'dominado';

export const AnaliseIASchema = z.object({
  disciplinas: z.array(z.object({
    nome: z.string().min(1),
    topicos: z.array(z.object({
      nome: z.string().min(1),
      percentual: z.number().min(0).max(100)
    }))
  }))
});

export const ConcursoSchema = z.object({
  nome: z.string().min(1, 'Nome do concurso é obrigatório'),
  banca: z.string().min(1, 'Nome da banca é obrigatório'),
  data_prova: z.string().min(1, 'Data da prova é obrigatória'),
  horas_semana: z.number().min(1, 'Horas por semana deve ser no mínimo 1').max(168, 'Máximo 168 horas'),
});

export const TopicoSchema = z.object({
  nome: z.string().min(1, 'Nome do tópico não pode estar vazio'),
  percentual: z.number().min(0).max(100).default(0),
  tempo_base_min: z.number().min(1).default(60),
});

export const DisciplinaSchema = z.object({
  nome: z.string().min(1, 'Nome da disciplina é obrigatório'),
  topicos: z.array(TopicoSchema).min(1, 'Adicione pelo menos um tópico'),
});

export const EditalCompletoSchema = z.object({
  concurso: ConcursoSchema,
  disciplinas: z.array(DisciplinaSchema),
});

export const DiagnosticoSchema = z.object({
  cobertura: z.number().min(1).max(5),
  performance: z.number().min(1).max(5),
});

export const EditalIASchema = z.object({
  concurso: z.object({
    nome: z.string().min(1).nullable().optional(),
    banca: z.string().min(1).nullable().optional(),
    data_prova: z.string().nullable().optional(),
  }).nullable().optional(),
  disciplinas: z.array(z.object({
    nome: z.string().min(1),
    topicos: z.array(z.string().min(1)),
  })),
});

export type ConcursoInput = z.infer<typeof ConcursoSchema>;
export type TopicoInput = z.infer<typeof TopicoSchema>;
export type DisciplinaInput = z.infer<typeof DisciplinaSchema>;
export type AnaliseIAInput = z.infer<typeof AnaliseIASchema>;
export type DiagnosticoInput = z.infer<typeof DiagnosticoSchema>;
export type EditalIAInput = z.infer<typeof EditalIASchema>;
