import { EmbeddingGenerator } from "../../application/ports/embeddingGenerator";
import { ai, codeEmbeddingEmbedder } from "./ai";

export class GenkitEmbeddingGenerator implements EmbeddingGenerator {
  async generateEmbedding(text: string): Promise<number[]> {
    const embeddings = await ai.embed({
      embedder: codeEmbeddingEmbedder,
      content: text,
      options: {
        outputDimensionality: 768,
      },
    });

    const firstEmbedding = embeddings[0];

    if (!firstEmbedding) {
      throw new Error("Genkit did not return an embedding");
    }

    return firstEmbedding.embedding;
  }
}