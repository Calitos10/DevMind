import { CodeChunkEmbedding } from "../entities/codeChunkEmbedding";

export interface CodeChunkEmbeddingRepository {
  save(codeChunkEmbedding: CodeChunkEmbedding): Promise<CodeChunkEmbedding>;
  findByCodeChunkId(codeChunkId: string): Promise<CodeChunkEmbedding | null>;
  deleteByCodeChunkId(codeChunkId: string): Promise<void>;
}