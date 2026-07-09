import type { CodeChunk } from "../../src/domain/entities/codeChunk";
import type { CodeChunkRepository } from "../../src/domain/repository/codeChunkRepository";

export class FakeCodeChunkRepository implements CodeChunkRepository {
  public codeChunks: CodeChunk[] = [];
  public deletedProjectFileIds: string[] = [];

  async saveMany(codeChunks: CodeChunk[]): Promise<CodeChunk[]> {
    this.codeChunks.push(...codeChunks);

    return codeChunks;
  }

  async findByProjectFileId(projectFileId: string): Promise<CodeChunk[]> {
    return this.codeChunks.filter(
      (codeChunk) => codeChunk.projectFileId === projectFileId,
    );
  }

  async findByProjectId(projectId: string): Promise<CodeChunk[]> {
    return this.codeChunks.filter(
      (codeChunk) => codeChunk.projectId === projectId,
    );
  }

  async deleteByProjectFileId(projectFileId: string): Promise<void> {
    this.deletedProjectFileIds.push(projectFileId);
  }
}
