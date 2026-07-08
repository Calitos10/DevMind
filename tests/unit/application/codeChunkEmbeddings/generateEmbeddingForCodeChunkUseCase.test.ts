import { describe, expect, it } from "vitest";

import { CodeChunk } from "../../../../src/domain/entities/codeChunk";
import { CodeChunkEmbedding } from "../../../../src/domain/entities/codeChunkEmbedding";
import { CodeChunkEmbeddingRepository } from "../../../../src/domain/repository/codeChunkEmbeddingRepository";
import { IdGenerator } from "../../../../src/application/ports/idGeneratorPort";
import { GenerateEmbeddingForCodeChunkUseCase } from "../../../../src/application/codeChunkEmbeddings/generateEmbeddingForCodeChunkUseCase";
import { SimilarCodeChunk } from "../../../../src/domain/repository/codeChunkEmbeddingRepository";

class FakeCodeChunkEmbeddingRepository implements CodeChunkEmbeddingRepository {
  public embeddings: CodeChunkEmbedding[] = [];

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
  async findSimilarByProjectId(): Promise<SimilarCodeChunk[]> {
    return [];
  }
}

class FakeEmbeddingGenerator {
  public receivedTexts: string[] = [];

  async generateEmbedding(text: string): Promise<number[]> {
    this.receivedTexts.push(text);

    return [0.1, 0.2, 0.3];
  }
}

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return "embedding-1";
  }
}

describe("GenerateEmbeddingForCodeChunkUseCase", () => {
  it("generates and stores an embedding for a code chunk", async () => {
    const repository = new FakeCodeChunkEmbeddingRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const idGenerator = new FakeIdGenerator();

    const useCase = new GenerateEmbeddingForCodeChunkUseCase(
      repository,
      embeddingGenerator,
      idGenerator,
    );

    const codeChunk: CodeChunk = {
      id: "code-chunk-1",
      projectId: "project-1",
      projectFileId: "project-file-1",
      content: "export const hello = 'world';",
      startLine: 1,
      endLine: 1,
      index: 0,
      createdAt: new Date(),
    };

    const result = await useCase.execute({
      codeChunk,
    });

    expect(embeddingGenerator.receivedTexts).toEqual([
      "export const hello = 'world';",
    ]);

    expect(repository.embeddings).toHaveLength(1);

    expect(repository.embeddings[0]).toMatchObject({
      id: "embedding-1",
      projectId: "project-1",
      codeChunkId: "code-chunk-1",
      embedding: [0.1, 0.2, 0.3],
    });

    expect(result).toMatchObject({
      codeChunkId: "code-chunk-1",
      embeddingCreated: true,
    });
  });
  it("replaces an existing embedding for the same code chunk", async () => {
    const repository = new FakeCodeChunkEmbeddingRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const idGenerator = new FakeIdGenerator();

    repository.embeddings.push({
      id: "old-embedding",
      projectId: "project-1",
      codeChunkId: "code-chunk-1",
      embedding: [9, 9, 9],
      createdAt: new Date(),
    });

    const useCase = new GenerateEmbeddingForCodeChunkUseCase(
      repository,
      embeddingGenerator,
      idGenerator,
    );

    const codeChunk: CodeChunk = {
      id: "code-chunk-1",
      projectId: "project-1",
      projectFileId: "project-file-1",
      content: "export const hello = 'updated world';",
      startLine: 1,
      endLine: 1,
      index: 0,
      createdAt: new Date(),
    };

    const result = await useCase.execute({
      codeChunk,
    });

    expect(repository.embeddings).toHaveLength(1);

    expect(repository.embeddings[0]).toMatchObject({
      id: "embedding-1",
      projectId: "project-1",
      codeChunkId: "code-chunk-1",
      embedding: [0.1, 0.2, 0.3],
    });

    expect(result).toMatchObject({
      codeChunkId: "code-chunk-1",
      embeddingCreated: true,
    });
  });
});
