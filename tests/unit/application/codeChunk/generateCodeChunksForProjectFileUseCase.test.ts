import { describe, expect, it } from "vitest";

import { GenerateCodeChunksForProjectFileUseCase } from "../../../../src/application/codeChunk/generateCodeChunksForProjectFileUseCase";
import { FakeCodeChunkRepository } from "../../../fakes/fakeCodeChunkRepository";
import { FakeSequentialIdGenerator } from "../../../fakes/fakeSequentialIdGenerator";

class FakeCodeChunker {
  chunk() {
    return [
      {
        content: ["line 1", "line 2"].join("\n"),
        startLine: 1,
        endLine: 2,
        index: 0,
      },
      {
        content: ["line 3", "line 4"].join("\n"),
        startLine: 3,
        endLine: 4,
        index: 1,
      },
    ];
  }
}

class FakeEmptyCodeChunker {
  chunk() {
    return [];
  }
}

describe("GenerateCodeChunksForProjectFileUseCase", () => {
  it("generates and saves code chunks for a project file", async () => {
    const codeChunkRepository = new FakeCodeChunkRepository();
    const codeChunker = new FakeCodeChunker();
    const idGenerator = new FakeSequentialIdGenerator(["chunk-1", "chunk-2"]);

    const useCase = new GenerateCodeChunksForProjectFileUseCase(
      codeChunkRepository,
      codeChunker,
      idGenerator,
    );

    const projectFile = {
      id: "project-file-1",
      projectId: "project-1",
      path: "src/app.ts",
      language: "typescript",
      content: ["line 1", "line 2", "line 3", "line 4"].join("\n"),
      size: 27,
      hash: "file-hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const result = await useCase.execute({
      projectFile,
    });

    expect(codeChunkRepository.deletedProjectFileIds).toEqual([
      "project-file-1",
    ]);

    expect(codeChunkRepository.codeChunks).toEqual([
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: ["line 1", "line 2"].join("\n"),
        startLine: 1,
        endLine: 2,
        index: 0,
        createdAt: expect.any(Date),
      },
      {
        id: "chunk-2",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: ["line 3", "line 4"].join("\n"),
        startLine: 3,
        endLine: 4,
        index: 1,
        createdAt: expect.any(Date),
      },
    ]);

    expect(result).toEqual({
      projectFileId: "project-file-1",
      chunksCreated: 2,
      chunks: codeChunkRepository.codeChunks,
    });
  });

  it("deletes old chunks and returns zero chunks when the chunker returns no chunks", async () => {
    const codeChunkRepository = new FakeCodeChunkRepository();
    const codeChunker = new FakeEmptyCodeChunker();
    const idGenerator = new FakeSequentialIdGenerator(["chunk-1", "chunk-2"]);

    const useCase = new GenerateCodeChunksForProjectFileUseCase(
      codeChunkRepository,
      codeChunker,
      idGenerator,
    );

    const projectFile = {
      id: "project-file-1",
      projectId: "project-1",
      path: "src/empty.ts",
      language: "typescript",
      content: "",
      size: 0,
      hash: "empty-file-hash",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };

    const result = await useCase.execute({
      projectFile,
    });

    expect(codeChunkRepository.deletedProjectFileIds).toEqual([
      "project-file-1",
    ]);

    expect(codeChunkRepository.codeChunks).toEqual([]);

    expect(result).toEqual({
      projectFileId: "project-file-1",
      chunksCreated: 0,
      chunks: [],
    });
  });
});