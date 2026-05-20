import { type EditalCompleto } from '../types';

export function gerarPromptEditalTexto(textoEdital: string): string {
  return `Você é um especialista em concursos públicos brasileiros. Analise o texto do edital abaixo e extraia as disciplinas e seus tópicos de estudo.

TEXTO DO EDITAL:
---
${textoEdital.slice(0, 8000)}
---

Instruções:
1. Identifique todas as disciplinas/matérias listadas no edital
2. Para cada disciplina, liste os tópicos/conteúdos exigidos
3. Se o edital mencionar o nome do concurso, banca e data da prova, inclua no campo "concurso"
4. Ignore informações administrativas (taxas, datas de inscrição, requisitos de cargo, etc.)
5. Retorne APENAS um JSON válido com a estrutura abaixo. Nenhum texto antes ou depois.

{
  "concurso": {
    "nome": "Nome do concurso (ou null se não encontrado)",
    "banca": "Nome da banca organizadora (ou null se não encontrado)",
    "data_prova": "YYYY-MM-DD (ou null se não encontrado)"
  },
  "disciplinas": [
    {
      "nome": "Nome da disciplina",
      "topicos": [
        "Tópico 1",
        "Tópico 2",
        "Tópico 3"
      ]
    }
  ]
}`;
}

export function gerarPromptIA(edital: EditalCompleto): string {
  const disciplinasTexto = edital.disciplinas
    .map((d) => {
      const topicos = d.topicos.map((t) => `    - ${t.nome}`).join('\n');
      return `  - ${d.nome}:\n${topicos}`;
    })
    .join('\n');

  return `Você é um especialista em concursos públicos brasileiros. Analise as disciplinas e tópicos abaixo e estime o percentual de incidência histórica de cada tópico nas provas desta banca.

Concurso: ${edital.concurso.nome}
Banca: ${edital.concurso.banca}

Disciplinas e tópicos:
${disciplinasTexto}

Retorne APENAS um JSON válido com a estrutura abaixo. Nenhum texto antes ou depois. Distribua os percentuais de modo que a soma dentro de cada disciplina seja próxima a 100.

{
  "disciplinas": [
    {
      "nome": "Nome da disciplina (exatamente como acima)",
      "topicos": [
        { "nome": "Nome do tópico", "percentual": 35 },
        { "nome": "Nome do tópico", "percentual": 25 }
      ]
    }
  ]
}`;
}
