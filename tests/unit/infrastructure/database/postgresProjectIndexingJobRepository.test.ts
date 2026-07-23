import { beforeEach, describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresProjectIndexingJobRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectIndexingJobRepository";

describe("PostgresProjectIndexingJobRepository", () => {
  beforeEach(async () => {
    await postgresPool.query(
      "TRUNCATE TABLE project_indexing_jobs, projects, users RESTART IDENTITY CASCADE",
    );
  });

  async function createProject() {
    await postgresPool.query(
      `
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "user-1",
        "User One",
        "user-1@example.com",
        "hashed-password",
        new Date("2026-01-01T00:00:00.000Z"),
      ],
    );

    await postgresPool.query(
      `
      INSERT INTO projects (id, owner_id, name, description, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "project-1",
        "user-1",
        "Project One",
        "Project description",
        new Date("2026-01-01T00:00:00.000Z"),
      ],
    );
  }

  it("saves and finds an indexing job by project id", async () => {
    const repository = new PostgresProjectIndexingJobRepository(postgresPool);

    await createProject();

    const savedJob = await repository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "pending",
      totalChunks: 10,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const foundJob = await repository.findByProjectId("project-1");

    expect(savedJob).toEqual({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "pending",
      totalChunks: 10,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(foundJob).toEqual({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "pending",
      totalChunks: 10,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
  it("updates an indexing job", async () => {
    const repository = new PostgresProjectIndexingJobRepository(postgresPool);

    await createProject();

    await repository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "pending",
      totalChunks: 10,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const updatedJob = await repository.update({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 10,
      processedChunks: 3,
      failedChunks: 1,
      errorMessage: "One chunk failed",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:10:00.000Z"),
    });

    const foundJob = await repository.findByProjectId("project-1");

    expect(updatedJob).toEqual({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 10,
      processedChunks: 3,
      failedChunks: 1,
      errorMessage: "One chunk failed",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });

    expect(foundJob).toEqual({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "processing",
      totalChunks: 10,
      processedChunks: 3,
      failedChunks: 1,
      errorMessage: "One chunk failed",
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
  it("deletes indexing jobs automatically when the project is deleted", async () => {
    const repository = new PostgresProjectIndexingJobRepository(postgresPool);

    await createProject();

    await repository.save({
      id: "indexing-job-1",
      projectId: "project-1",
      status: "pending",
      totalChunks: 10,
      processedChunks: 0,
      failedChunks: 0,
      errorMessage: undefined,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await postgresPool.query(
      `
    DELETE FROM projects
    WHERE id = $1
    `,
      ["project-1"],
    );

    const foundJob = await repository.findByProjectId("project-1");

    expect(foundJob).toBeNull();
  });
});
