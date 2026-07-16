import type { AnswerGenerator } from "../../application/ports/answerGenerator";
import type { SimilarCodeChunk } from "../../domain/repositories/codeChunkEmbeddingRepository";
import type { Delay } from "../../application/ports/delay";
import { TimeoutDelay } from "../timeDelayAdapter/timeoutDelay";
import { retryWithBackoff } from "../retry/retryWithBackoff";
import { isTransientGenkitError } from "./genkitErrors";
import { AnswerProviderUnavailableError } from "../../shared/errors/answerProviderUnavailableError";
import { ai } from "./ai";

type GenkitLikeAi = {
  generate(input: { prompt: string }): Promise<{
    text: string | (() => string);
  }>;
};

export class GenkitAnswerGenerator implements AnswerGenerator {
  constructor(
    private readonly aiClient: GenkitLikeAi = ai as unknown as GenkitLikeAi,
    private readonly delay: Delay = new TimeoutDelay(),
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 1000,
  ) {}

  async generateAnswer(input: {
    question: string;
    contextChunks: SimilarCodeChunk[];
  }): Promise<string> {
    const prompt = this.buildPrompt(input.question, input.contextChunks);

    try {
      // Se reintenta ante fallos transitorios del proveedor (503/429), igual
      // que en la generación de embeddings.
      const response = await retryWithBackoff(
        () => this.aiClient.generate({ prompt }),
        {
          maxRetries: this.maxRetries,
          baseDelayMs: this.baseDelayMs,
          delay: this.delay,
          isRetryable: isTransientGenkitError,
        },
      );

      const answer =
        typeof response.text === "function" ? response.text() : response.text;

      if (!answer.trim()) {
        return "No he podido generar una respuesta con el contexto disponible.";
      }

      return answer;
    } catch (error) {
      // Si tras los reintentos sigue siendo un fallo transitorio del proveedor,
      // se traduce al error de dominio tipado (503). Cualquier otro error se
      // relanza tal cual (reintentarlo no lo arreglaría).
      if (isTransientGenkitError(error)) {
        throw new AnswerProviderUnavailableError(error);
      }

      throw error;
    }
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
