import { beforeEach, describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresCodeChunkRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresCodeChunkRepository";

describe("PostgresCodeChunkRepository", () => {
  beforeEach(async () => {
    await postgresPool.query(
      "TRUNCATE TABLE code_chunks, project_files, projects, users RESTART IDENTITY CASCADE",
    );
  });

  async function createProjectFile() {
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

    await postgresPool.query(
      `
      INSERT INTO project_files (
        id,
        project_id,
        path,
        language,
        content,
        size,
        hash,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        "project-file-1",
        "project-1",
        "src/app.ts",
        "typescript",
        ["line 1", "line 2", "line 3"].join("\n"),
        20,
        "file-hash",
        new Date("2026-01-01T00:00:00.000Z"),
      ],
    );
  }

  it("saves and finds code chunks by project file id", async () => {
    const repository = new PostgresCodeChunkRepository(postgresPool);

    await createProjectFile();

    await repository.saveMany([
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: ["line 1", "line 2"].join("\n"),
        startLine: 1,
        endLine: 2,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      {
        id: "chunk-2",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: "line 3",
        startLine: 3,
        endLine: 3,
        index: 1,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    const foundCodeChunks =
      await repository.findByProjectFileId("project-file-1");

    expect(foundCodeChunks).toEqual([
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
        content: "line 3",
        startLine: 3,
        endLine: 3,
        index: 1,
        createdAt: expect.any(Date),
      },
    ]);
  });

  it("deletes code chunks by project file id", async () => {
    const repository = new PostgresCodeChunkRepository(postgresPool);

    await createProjectFile();

    await repository.saveMany([
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: ["line 1", "line 2"].join("\n"),
        startLine: 1,
        endLine: 2,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    await repository.deleteByProjectFileId("project-file-1");

    const foundCodeChunks =
      await repository.findByProjectFileId("project-file-1");

    expect(foundCodeChunks).toEqual([]);
  });

  it("deletes code chunks automatically when the project file is deleted", async () => {
    const repository = new PostgresCodeChunkRepository(postgresPool);

    await createProjectFile();

    await repository.saveMany([
      {
        id: "chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        content: ["line 1", "line 2"].join("\n"),
        startLine: 1,
        endLine: 2,
        index: 0,
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
    ]);

    await postgresPool.query(
      `
    DELETE FROM project_files
    WHERE id = $1
    `,
      ["project-file-1"],
    );

    const foundCodeChunks =
      await repository.findByProjectFileId("project-file-1");

    expect(foundCodeChunks).toEqual([]);
  });
});
