import { EmbeddingGenerator } from "../../application/ports/embeddingGenerator";
import type { Delay } from "../../application/ports/delay";
import { TimeoutDelay } from "../timeDelayAdapter/timeoutDelay";
import { retryWithBackoff } from "../retry/retryWithBackoff";
import { EmbeddingProviderUnavailableError } from "../../shared/errors/embeddingProviderUnavailableError";
import { isTransientGenkitError } from "./genkitErrors";
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
