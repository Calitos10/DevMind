import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../../../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";

describe("PostgresProjectRepository", () => {
  it("should save, list, find and delete a project", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);
    const projectRepository = new PostgresProjectRepository(postgresPool);

    const userId = randomUUID();
    const projectId = randomUUID();

    const user = await userRepository.save({
      id: userId,
      name: "User One",
      email: `project-user-${userId}@example.com`,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    const createdProject = await projectRepository.save({
      id: projectId,
      ownerId: user.id,
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    });

    expect(createdProject).toEqual({
      id: projectId,
      ownerId: user.id,
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: expect.any(Date),
    });

    const projectsByOwner = await projectRepository.findByOwnerId(user.id);

    expect(projectsByOwner).toHaveLength(1);
    expect(projectsByOwner[0]).toEqual(createdProject);

    const projectByIdAndOwner = await projectRepository.findByIdAndOwnerId(
      createdProject.id,
      user.id,
    );

    expect(projectByIdAndOwner).toEqual(createdProject);

    await projectRepository.deleteByIdAndOwnerId(createdProject.id, user.id);

    const deletedProject = await projectRepository.findByIdAndOwnerId(
      createdProject.id,
      user.id,
    );

    expect(deletedProject).toBeNull();
  });
});