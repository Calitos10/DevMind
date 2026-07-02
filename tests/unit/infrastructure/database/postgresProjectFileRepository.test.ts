import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";
import { PostgresProjectFileRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectFileRepository";

describe("PostgresProjectFileRepository", () => {
  it("should save, list, find and delete a project file", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);
    const projectRepository = new PostgresProjectRepository(postgresPool);
    const projectFileRepository = new PostgresProjectFileRepository(
      postgresPool,
    );

    const userId = randomUUID();
    const projectId = randomUUID();
    const projectFileId = randomUUID();

    const user = await userRepository.save({
      id: userId,
      name: "User One",
      email: `project-file-user-${userId}@example.com`,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    const project = await projectRepository.save({
      id: projectId,
      ownerId: user.id,
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    });

    const content = "console.log('hello');";

    const createdProjectFile = await projectFileRepository.save({
      id: projectFileId,
      projectId: project.id,
      path: "src/app.ts",
      language: "typescript",
      content,
      size: content.length,
      hash: "fake-hash-for-test",
      createdAt: new Date(),
    });

    expect(createdProjectFile).toEqual({
      id: projectFileId,
      projectId: project.id,
      path: "src/app.ts",
      language: "typescript",
      content,
      size: content.length,
      hash: "fake-hash-for-test",
      createdAt: expect.any(Date),
    });

    const projectFiles = await projectFileRepository.findByProjectId(
      project.id,
    );

    expect(projectFiles).toHaveLength(1);
    expect(projectFiles[0]).toEqual(createdProjectFile);

    const projectFileById = await projectFileRepository.findByIdAndProjectId(
      createdProjectFile.id,
      project.id,
    );

    expect(projectFileById).toEqual(createdProjectFile);

    await projectFileRepository.deleteByIdAndProjectId(
      createdProjectFile.id,
      project.id,
    );

    const deletedProjectFile = await projectFileRepository.findByIdAndProjectId(
      createdProjectFile.id,
      project.id,
    );

    expect(deletedProjectFile).toBeNull();
  });
});
