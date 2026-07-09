import { describe, expect, it } from "vitest";

import { CodeChunk } from "../../../../src/domain/entities/codeChunk";
import { GenerateEmbeddingForCodeChunkUseCase } from "../../../../src/application/codeChunkEmbeddings/generateEmbeddingForCodeChunkUseCase";
import { FakeCodeChunkEmbeddingRepository } from "../../../fakes/fakeCodeChunkEmbeddingRepository";
import { FakeEmbeddingGenerator } from "../../../fakes/fakeEmbeddingGenerator";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";

describe("GenerateEmbeddingForCodeChunkUseCase", () => {
  it("generates and stores an embedding for a code chunk", async () => {
    const repository = new FakeCodeChunkEmbeddingRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const idGenerator = new FakeIdGenerator("embedding-1");

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
    const idGenerator = new FakeIdGenerator("embedding-1");

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
