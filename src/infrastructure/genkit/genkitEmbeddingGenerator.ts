import { EmbeddingGenerator } from "../../application/ports/embeddingGenerator";
import type { Delay } from "../../application/ports/delay";
import { TimeoutDelay } from "../timeDelayAdapter/timeoutDelay";
import { retryWithBackoff } from "../retry/retryWithBackoff";
import { EmbeddingProviderUnavailableError } from "../../shared/errors/embeddingProviderUnavailableError";
import { ai, codeEmbeddingEmbedder } from "./ai";

export class GenkitEmbeddingGenerator implements EmbeddingGenerator {
  constructor(
    private readonly delay: Delay = new TimeoutDelay(),
    private readonly maxRetries: number = 3,
    private readonly baseDelayMs: number = 1000,
  ) {}

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddings = await retryWithBackoff(
        () =>
          ai.embed({
            embedder: codeEmbeddingEmbedder,
            content: text,
            options: {
              outputDimensionality: 768,
            },
          }),
        {
          maxRetries: this.maxRetries,
          baseDelayMs: this.baseDelayMs,
          delay: this.delay,
          isRetryable: isTransientGenkitError,
        },
      );

      const firstEmbedding = embeddings[0];

      if (!firstEmbedding) {
        throw new Error("Genkit did not return an embedding");
      }

      return firstEmbedding.embedding;
    } catch (error) {
      // Si tras los reintentos el error sigue siendo un fallo transitorio del
      // proveedor, se traduce al error de dominio tipado (503). Cualquier otro
      // error (p. ej. API key inválida) se relanza tal cual: reintentarlo no
      // lo arreglaría y debe salir como error inesperado.
      if (isTransientGenkitError(error)) {
        throw new EmbeddingProviderUnavailableError(error);
      }

      throw error;
    }
  }
}

// Detecta si un error de Genkit/Gemini es transitorio (merece reintento):
// 503 Service Unavailable (UNAVAILABLE) o 429 Too Many Requests (RESOURCE_EXHAUSTED).
// Se comprueban varias formas del error para ser robustos ante cambios de la librería.
function isTransientGenkitError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as {
    status?: unknown;
    code?: unknown;
    message?: unknown;
  };

  const status = typeof candidate.status === "string" ? candidate.status : "";
  const code = candidate.code;
  const message =
    typeof candidate.message === "string" ? candidate.message : "";

  if (status === "UNAVAILABLE" || status === "RESOURCE_EXHAUSTED") {
    return true;
  }

  if (code === 503 || code === 429) {
    return true;
  }

  return (
    message.includes("503") ||
    message.includes("429") ||
    message.includes("UNAVAILABLE") ||
    message.includes("RESOURCE_EXHAUSTED")
  );
}
