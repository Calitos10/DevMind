import type { SimilarCodeChunk } from "../../domain/repositories/codeChunkEmbeddingRepository";

export interface AnswerGenerator {
  generateAnswer(input: {
    question: string;
    contextChunks: SimilarCodeChunk[];
  }): Promise<string>;
}