import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";
import { PostgresConversationRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresConversationRepository";

describe("PostgresConversationRepository", () => {
  it("saves conversation entries and lists them by project ordered by date", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);
    const projectRepository = new PostgresProjectRepository(postgresPool);
    const conversationRepository = new PostgresConversationRepository(
      postgresPool,
    );

    const userId = randomUUID();
    const projectId = randomUUID();

    await userRepository.save({
      id: userId,
      name: "User One",
      email: `conversation-user-${userId}@example.com`,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    await projectRepository.save({
      id: projectId,
      ownerId: userId,
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    });

    const firstEntry = await conversationRepository.save({
      id: randomUUID(),
      projectId,
      question: "¿Primera pregunta?",
      answer: "Primera respuesta.",
      sources: [{ path: "src/app.ts", startLine: 1, endLine: 5 }],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const secondEntry = await conversationRepository.save({
      id: randomUUID(),
      projectId,
      question: "¿Segunda pregunta?",
      answer: "Segunda respuesta.",
      sources: [],
      createdAt: new Date("2026-01-02T00:00:00.000Z"),
    });

    expect(firstEntry).toMatchObject({
      projectId,
      question: "¿Primera pregunta?",
      answer: "Primera respuesta.",
      sources: [{ path: "src/app.ts", startLine: 1, endLine: 5 }],
    });

    const history = await conversationRepository.findByProjectId(projectId);

    expect(history).toHaveLength(2);
    expect(history.map((entry) => entry.id)).toEqual([
      firstEntry.id,
      secondEntry.id,
    ]);
    expect(history[0].sources).toEqual([
      { path: "src/app.ts", startLine: 1, endLine: 5 },
    ]);
    expect(history[1].sources).toEqual([]);
  });

  it("returns an empty history for a project without conversations", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);
    const projectRepository = new PostgresProjectRepository(postgresPool);
    const conversationRepository = new PostgresConversationRepository(
      postgresPool,
    );

    const userId = randomUUID();
    const projectId = randomUUID();

    await userRepository.save({
      id: userId,
      name: "User Two",
      email: `conversation-empty-${userId}@example.com`,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    await projectRepository.save({
      id: projectId,
      ownerId: userId,
      name: "Empty project",
      description: "No conversations yet",
      createdAt: new Date(),
    });

    const history = await conversationRepository.findByProjectId(projectId);

    expect(history).toEqual([]);
  });
});
