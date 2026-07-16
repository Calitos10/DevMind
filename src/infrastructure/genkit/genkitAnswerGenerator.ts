import type { AnswerGenerator } from "../../application/ports/answerGenerator";
import type { SimilarCodeChunk } from "../../domain/repositories/codeChunkEmbeddingRepository";
import { ai } from "./ai";

type GenkitLikeAi = {
  generate(input: { prompt: string }): Promise<{
    text: string | (() => string);
  }>;
};

export class GenkitAnswerGenerator implements AnswerGenerator {
  constructor(
    private readonly aiClient: GenkitLikeAi = ai as unknown as GenkitLikeAi,
  ) {}

  async generateAnswer(input: {
    question: string;
    contextChunks: SimilarCodeChunk[];
  }): Promise<string> {
    const prompt = this.buildPrompt(input.question, input.contextChunks);

    const response = await this.aiClient.generate({
      prompt,
    });

    const answer =
      typeof response.text === "function" ? response.text() : response.text;

    if (!answer.trim()) {
      return "No he podido generar una respuesta con el contexto disponible.";
    }

    return answer;
  }

  private buildPrompt(
    question: string,
    contextChunks: SimilarCodeChunk[],
  ): string {
    const context = contextChunks
      .map(
        (chunk) => `
Archivo: ${chunk.path}
líneas ${chunk.startLine}-${chunk.endLine}

${chunk.content}
`,
      )
      .join("\n---\n");

    return `
Eres DevMind, un asistente que responde preguntas sobre un proyecto software usando únicamente el contexto proporcionado.

Instrucciones:
- Responde en español.
- No inventes información que no esté en el contexto.
- Si el contexto no contiene la respuesta, dilo claramente.
- Sé claro, directo y útil.

Contexto del proyecto:
${context}

Pregunta del usuario:
${question}
`;
  }
}
