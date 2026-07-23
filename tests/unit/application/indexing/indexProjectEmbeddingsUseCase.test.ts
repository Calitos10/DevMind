import { describe, expect, it } from "vitest";

import { IndexProjectEmbeddingsUseCase } from "../../../../src/application/indexing/indexProjectEmbeddingsUseCase";
import type { CodeChunk } from "../../../../src/domain/entities/codeChunk";
import { FakeCodeChunkRepository } from "../../../fakes/fakeCodeChunkRepository";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

type ProjectIndexingJobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

type ProjectIndexingJob = {
  id: string;
  projectId: string;
  status: ProjectIndexingJobStatus;
  totalChunks: number;
  processedChunks: number;
  failedChunks: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
};

class FakeProjectIndexingJobRepository {
  public savedJobs: ProjectIndexingJob[] = [];
  public updatedJobs: ProjectIndexingJob[] = [];

  async save(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    this.savedJobs.push(job);

    return job;
  }

  async findByProjectId(projectId: string): Promise<ProjectIndexingJob | null> {
    return (
      [...this.updatedJobs, ...this.savedJobs]
        .reverse()
        .find((job) => job.projectId === projectId) ?? null
    );
  }

  async update(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    this.updatedJobs.push(job);

    return job;
  }
}

class FakeGenerateEmbeddingForCodeChunkUseCase {
  public generatedCodeChunkIds: string[] = [];

  async execute(input: { codeChunk: CodeChunk }) {
    this.generatedCodeChunkIds.push(input.codeChunk.id);

    return {
      codeChunkId: input.codeChunk.id,
      embeddingCreated: true,
      codeChunkEmbedding: {
        id: `embedding-${input.codeChunk.id}`,
        projectId: input.codeChunk.projectId,
        codeChunkId: input.codeChunk.id,
        embedding: [],
        createdAt: new Date(),
      },
    };
  }
}

class FakeFailingGenerateEmbeddingForCodeChunkUseCase {
  public generatedCodeChunkIds: string[] = [];

  async execute(input: { codeChunk: CodeChunk }) {
    this.generatedCodeChunkIds.push(input.codeChunk.id);

    if (input.codeChunk.id === "chunk-2") {
      throw new Error("Gemini quota exceeded");
    }

    return {
      codeChunkId: input.codeChunk.id,
      embeddingCreated: true,
      codeChunkEmbedding: {
        id: `embedding-${input.codeChunk.id}`,
        projectId: input.codeChunk.projectId,
        codeChunkId: input.codeChunk.id,
        embedding: [],
        createdAt: new Date(),
      },
    };
  }
}

class FakeDelay {
  public waitedMilliseconds: number[] = [];

  async wait(milliseconds: number): Promise<void> {
    this.waitedMilliseconds.push(milliseconds);
  }
}

describe("IndexProjectEmbeddingsUseCase", () => {
  it("indexes all project chunks and marks the job as completed", async () => {
    const projectRepository = new FakeProjectRepository();
    const codeChunkRepository = new FakeCodeChunkRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();
    const generateEmbeddingForCodeChunkUseCase =
      new FakeGenerateEmbeddingForCodeChunkUseCase();
    const idGenerator = new FakeIdGenerator("indexing-job-1");
    const delay = new FakeDelay();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind",
      description: "AI project assistant",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    codeChunkRepository.codeChunks = [
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: "export function registerUser() {}",
        startLine: 1,
        endLine: 1,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "chunk-2",
        projectId: "project-1",
        projectFileId: "project-file-2",
        content: "export function loginUser() {}",
        startLine: 1,
        endLine: 1,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];

    const useCase = new IndexProjectEmbeddingsUseCase(
      projectRepository,
      codeChunkRepository,
      projectIndexingJobRepository,
      generateEmbeddingForCodeChunkUseCase,
      idGenerator,
      delay,
      1000,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(generateEmbeddingForCodeChunkUseCase.generatedCodeChunkIds).toEqual([
      "chunk-1",
      "chunk-2",
    ]);

    expect(delay.waitedMilliseconds).toEqual([1000]);

    expect(projectIndexingJobRepository.savedJobs).toHaveLength(1);

    expect(projectIndexingJobRepository.savedJobs[0]).toMatchObject({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 2,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
    });

    expect(projectIndexingJobRepository.updatedJobs).toHaveLength(3);

    expect(projectIndexingJobRepository.updatedJobs[0]).toMatchObject({
      projectId: "project-1",
      status: "processing",
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 0,
    });

    expect(projectIndexingJobRepository.updatedJobs[1]).toMatchObject({
      projectId: "project-1",
      status: "processing",
      totalChunks: 2,
      processedChunks: 2,
      failedChunks: 0,
    });

    expect(projectIndexingJobRepository.updatedJobs[2]).toMatchObject({
      projectId: "project-1",
      status: "completed",
      totalChunks: 2,
      processedChunks: 2,
      failedChunks: 0,
      errorMessage: undefined,
    });

    expect(result).toEqual({
      projectId: "project-1",
      status: "completed",
      totalChunks: 2,
      processedChunks: 2,
      failedChunks: 0,
    });
  });
  it("marks the indexing job as failed when generating an embedding fails", async () => {
    const projectRepository = new FakeProjectRepository();
    const codeChunkRepository = new FakeCodeChunkRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();
    const generateEmbeddingForCodeChunkUseCase =
      new FakeFailingGenerateEmbeddingForCodeChunkUseCase();
    const idGenerator = new FakeIdGenerator("indexing-job-1");

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind",
      description: "AI project assistant",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    codeChunkRepository.codeChunks = [
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: "export function registerUser() {}",
        startLine: 1,
        endLine: 1,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "chunk-2",
        projectId: "project-1",
        projectFileId: "project-file-2",
        content: "export function loginUser() {}",
        startLine: 1,
        endLine: 1,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];

    const useCase = new IndexProjectEmbeddingsUseCase(
      projectRepository,
      codeChunkRepository,
      projectIndexingJobRepository,
      generateEmbeddingForCodeChunkUseCase,
      idGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
      }),
    ).rejects.toThrow("Gemini quota exceeded");

    expect(generateEmbeddingForCodeChunkUseCase.generatedCodeChunkIds).toEqual([
      "chunk-1",
      "chunk-2",
    ]);

    expect(projectIndexingJobRepository.savedJobs).toHaveLength(1);

    expect(projectIndexingJobRepository.savedJobs[0]).toMatchObject({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 2,
      processedChunks: 0,
      failedChunks: 0,
    });

    expect(projectIndexingJobRepository.updatedJobs).toHaveLength(2);

    expect(projectIndexingJobRepository.updatedJobs[0]).toMatchObject({
      projectId: "project-1",
      status: "processing",
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 0,
    });

    expect(projectIndexingJobRepository.updatedJobs[1]).toMatchObject({
      projectId: "project-1",
      status: "failed",
      totalChunks: 2,
      processedChunks: 1,
      failedChunks: 1,
      errorMessage: "Gemini quota exceeded",
    });
  });
  it("throws IndexingAlreadyInProgressError when a job is already processing", async () => {
    const projectRepository = new FakeProjectRepository();
    const codeChunkRepository = new FakeCodeChunkRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();
    const generateEmbeddingForCodeChunkUseCase =
      new FakeGenerateEmbeddingForCodeChunkUseCase();
    const idGenerator = new FakeIdGenerator("indexing-job-1");

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind",
      description: "AI project assistant",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    // Ya existe una indexación en curso para el proyecto.
    await projectIndexingJobRepository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 10,
      processedChunks: 3,
      failedChunks: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    codeChunkRepository.codeChunks = [
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: "export function registerUser() {}",
        startLine: 1,
        endLine: 1,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ];

    const useCase = new IndexProjectEmbeddingsUseCase(
      projectRepository,
      codeChunkRepository,
      projectIndexingJobRepository,
      generateEmbeddingForCodeChunkUseCase,
      idGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
      }),
    ).rejects.toThrow("Indexing is already in progress for this project");

    // No se toca nada: ni se generan embeddings ni se reinicia el job en curso.
    expect(generateEmbeddingForCodeChunkUseCase.generatedCodeChunkIds).toEqual(
      [],
    );
    expect(projectIndexingJobRepository.updatedJobs).toEqual([]);
  });
  it("throws ProjectNotFoundError when the project does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository();
    const codeChunkRepository = new FakeCodeChunkRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();
    const generateEmbeddingForCodeChunkUseCase =
      new FakeGenerateEmbeddingForCodeChunkUseCase();
    const idGenerator = new FakeIdGenerator("indexing-job-1");

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind",
      description: "AI project assistant",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new IndexProjectEmbeddingsUseCase(
      projectRepository,
      codeChunkRepository,
      projectIndexingJobRepository,
      generateEmbeddingForCodeChunkUseCase,
      idGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "other-user",
      }),
    ).rejects.toThrow("Project not found");

    expect(generateEmbeddingForCodeChunkUseCase.generatedCodeChunkIds).toEqual(
      [],
    );

    expect(projectIndexingJobRepository.savedJobs).toEqual([]);
    expect(projectIndexingJobRepository.updatedJobs).toEqual([]);
  });
});
