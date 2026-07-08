import { CodeChunk } from "../entities/codeChunk";

export interface CodeChunkRepository {
  saveMany(codeChunks: CodeChunk[]): Promise<CodeChunk[]>;
  findByProjectFileId(projectFileId: string): Promise<CodeChunk[]>;
  findByProjectId(projectId: string): Promise<CodeChunk[]>;
  deleteByProjectFileId(projectFileId: string): Promise<void>;
}
