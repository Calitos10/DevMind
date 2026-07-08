import type { SimilarCodeChunk } from "../../domain/repository/codeChunkEmbeddingRepository";

export interface AnswerGenerator {
  generateAnswer(input: {
    question: string;
    contextChunks: SimilarCodeChunk[];
  }): Promise<string>;
}