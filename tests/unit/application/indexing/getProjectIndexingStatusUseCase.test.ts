import { describe, expect, it } from "vitest";

import { GetProjectIndexingStatusUseCase } from "../../../../src/application/indexing/getProjectIndexingStatusUseCase";
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

  async save(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    this.savedJobs.push(job);

    return job;
  }

  async findByProjectId(projectId: string): Promise<ProjectIndexingJob | null> {
    return this.savedJobs.find((job) => job.projectId === projectId) ?? null;
  }

  async update(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    return job;
  }
}

async function saveOwnedProject(projectRepository: FakeProjectRepository) {
  await projectRepository.save({
    id: "project-1",
    ownerId: "user-1",
    name: "DevMind",
    description: "AI project assistant",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
}

describe("GetProjectIndexingStatusUseCase", () => {
  it("returns a pending status with zeroed counters when no job exists yet", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();

    await saveOwnedProject(projectRepository);

    const useCase = new GetProjectIndexingStatusUseCase(
      projectRepository,
      projectIndexingJobRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toEqual({
      projectId: "project-1",
      status: "pending",
      totalChunks: 0,
      processedChunks: 0,
      failedChunks: 0,
      progress: 0,
    });
  });

  it("reports progress for a job that is still processing", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();

    await saveOwnedProject(projectRepository);

    // 3 de 8 chunks procesados → progreso redondeado a 38 %.
    await projectIndexingJobRepository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 8,
      processedChunks: 3,
      failedChunks: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new GetProjectIndexingStatusUseCase(
      projectRepository,
      projectIndexingJobRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toEqual({
      projectId: "project-1",
      status: "processing",
      totalChunks: 8,
      processedChunks: 3,
      failedChunks: 0,
      progress: 38,
    });
  });

  it("reports 100% progress for a completed job", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();

    await saveOwnedProject(projectRepository);

    await projectIndexingJobRepository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "completed",
      totalChunks: 5,
      processedChunks: 5,
      failedChunks: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new GetProjectIndexingStatusUseCase(
      projectRepository,
      projectIndexingJobRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toMatchObject({
      status: "completed",
      totalChunks: 5,
      processedChunks: 5,
      progress: 100,
    });
  });

  it("reports the failed status while keeping the partial progress", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();

    await saveOwnedProject(projectRepository);

    await projectIndexingJobRepository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "failed",
      totalChunks: 4,
      processedChunks: 1,
      failedChunks: 1,
      errorMessage: "Gemini quota exceeded",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new GetProjectIndexingStatusUseCase(
      projectRepository,
      projectIndexingJobRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toEqual({
      projectId: "project-1",
      status: "failed",
      totalChunks: 4,
      processedChunks: 1,
      failedChunks: 1,
      progress: 25,
    });
  });

  it("throws ProjectNotFoundError when the project does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectIndexingJobRepository = new FakeProjectIndexingJobRepository();

    await saveOwnedProject(projectRepository);

    const useCase = new GetProjectIndexingStatusUseCase(
      projectRepository,
      projectIndexingJobRepository,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "other-user",
      }),
    ).rejects.toThrow("Project not found");
  });
});
