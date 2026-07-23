import type { CodeChunkEmbedding } from "../../src/domain/entities/codeChunkEmbedding";
import type {
  CodeChunkEmbeddingRepository,
  SimilarCodeChunk,
} from "../../src/domain/repositories/codeChunkEmbeddingRepository";

export class FakeCodeChunkEmbeddingRepository
  implements CodeChunkEmbeddingRepository
{
  public embeddings: CodeChunkEmbedding[] = [];
  public similarCodeChunks: SimilarCodeChunk[] = [];
  public receivedFindSimilarInputs: Array<{
    projectId: string;
    embedding: number[];
    limit: number;
  }> = [];

  async save(
    codeChunkEmbedding: CodeChunkEmbedding,
  ): Promise<CodeChunkEmbedding> {
    this.embeddings.push(codeChunkEmbedding);
    return codeChunkEmbedding;
  }

  async findByCodeChunkId(
    codeChunkId: string,
  ): Promise<CodeChunkEmbedding | null> {
    return (
      this.embeddings.find(
        (embedding) => embedding.codeChunkId === codeChunkId,
      ) ?? null
    );
  }

  async deleteByCodeChunkId(codeChunkId: string): Promise<void> {
    this.embeddings = this.embeddings.filter(
      (embedding) => embedding.codeChunkId !== codeChunkId,
    );
  }

  async findSimilarByProjectId(input: {
    projectId: string;
    embedding: number[];
    limit: number;
  }): Promise<SimilarCodeChunk[]> {
    this.receivedFindSimilarInputs.push(input);

    return this.similarCodeChunks;
  }
}
