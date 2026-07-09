import type { EmbeddingGenerator } from "../../src/application/ports/embeddingGenerator";

export class FakeEmbeddingGenerator implements EmbeddingGenerator {
  public receivedTexts: string[] = [];

  async generateEmbedding(text: string): Promise<number[]> {
    this.receivedTexts.push(text);

    return [0.1, 0.2, 0.3];
  }
}
