import { CodeChunkEmbedding } from "../entities/codeChunkEmbedding";

export type SimilarCodeChunk = {
  codeChunkId: string;
  projectId: string;
  projectFileId: string;
  path: string;
  content: string;
  startLine: number;
  endLine: number;
  index: number;
  distance: number;
};

export interface CodeChunkEmbeddingRepository {
  save(codeChunkEmbedding: CodeChunkEmbedding): Promise<CodeChunkEmbedding>;
  findByCodeChunkId(codeChunkId: string): Promise<CodeChunkEmbedding | null>;
  deleteByCodeChunkId(codeChunkId: string): Promise<void>;
  findSimilarByProjectId(input: {
    projectId: string;
    embedding: number[];
    limit: number;
  }): Promise<SimilarCodeChunk[]>;
}
