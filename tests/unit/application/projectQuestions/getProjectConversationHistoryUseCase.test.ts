import { describe, expect, it } from "vitest";

import { GetProjectConversationHistoryUseCase } from "../../../../src/application/projectQuestions/getProjectConversationHistoryUseCase";
import { FakeConversationRepository } from "../../../fakes/fakeConversationRepository";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

async function saveOwnedProject(projectRepository: FakeProjectRepository) {
  projectRepository.projects.push({
    id: "project-1",
    ownerId: "user-1",
    name: "DevMind API",
    description: "Backend con IA para consultar proyectos software",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  });
}

describe("GetProjectConversationHistoryUseCase", () => {
  it("returns the conversation history of a project ordered chronologically", async () => {
    const projectRepository = new FakeProjectRepository();
    const conversationRepository = new FakeConversationRepository();

    await saveOwnedProject(projectRepository);

    conversationRepository.entries = [
      {
        id: "conversation-2",
        projectId: "project-1",
        question: "¿Segunda pregunta?",
        answer: "Segunda respuesta.",
        sources: [],
        createdAt: new Date("2026-01-02T00:00:00.000Z"),
      },
      {
        id: "conversation-1",
        projectId: "project-1",
        question: "¿Primera pregunta?",
        answer: "Primera respuesta.",
        sources: [{ path: "src/app.ts", startLine: 1, endLine: 5 }],
        createdAt: new Date("2026-01-01T00:00:00.000Z"),
      },
      // Entrada de otro proyecto: no debe aparecer.
      {
        id: "conversation-3",
        projectId: "project-2",
        question: "¿De otro proyecto?",
        answer: "No debería salir.",
        sources: [],
        createdAt: new Date("2026-01-03T00:00:00.000Z"),
      },
    ];

    const useCase = new GetProjectConversationHistoryUseCase(
      projectRepository,
      conversationRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      userId: "user-1",
    });

    expect(result.map((entry) => entry.id)).toEqual([
      "conversation-1",
      "conversation-2",
    ]);

    expect(result[0]).toMatchObject({
      id: "conversation-1",
      projectId: "project-1",
      question: "¿Primera pregunta?",
      answer: "Primera respuesta.",
      sources: [{ path: "src/app.ts", startLine: 1, endLine: 5 }],
    });
  });

  it("returns an empty history when the project has no conversations", async () => {
    const projectRepository = new FakeProjectRepository();
    const conversationRepository = new FakeConversationRepository();

    await saveOwnedProject(projectRepository);

    const useCase = new GetProjectConversationHistoryUseCase(
      projectRepository,
      conversationRepository,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      userId: "user-1",
    });

    expect(result).toEqual([]);
  });

  it("throws ProjectNotFoundError when the project does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository();
    const conversationRepository = new FakeConversationRepository();

    await saveOwnedProject(projectRepository);

    const useCase = new GetProjectConversationHistoryUseCase(
      projectRepository,
      conversationRepository,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        userId: "other-user",
      }),
    ).rejects.toThrow("Project not found");
  });
});
