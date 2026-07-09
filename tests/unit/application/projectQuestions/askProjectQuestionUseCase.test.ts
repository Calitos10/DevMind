import { describe, expect, it } from "vitest";

import type { AnswerGenerator } from "../../../../src/application/ports/answerGenerator";
import type { SimilarCodeChunk } from "../../../../src/domain/repository/codeChunkEmbeddingRepository";
import { AskProjectQuestionUseCase } from "../../../../src/application/projectQuestions/askProjectQuestionUseCase";
import { FakeCodeChunkEmbeddingRepository } from "../../../fakes/fakeCodeChunkEmbeddingRepository";
import { FakeEmbeddingGenerator } from "../../../fakes/fakeEmbeddingGenerator";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

class FakeAnswerGenerator implements AnswerGenerator {
  public receivedInputs: Array<{
    question: string;
    contextChunks: SimilarCodeChunk[];
  }> = [];

  async generateAnswer(input: {
    question: string;
    contextChunks: SimilarCodeChunk[];
  }): Promise<string> {
    this.receivedInputs.push(input);

    return "El registro de usuario se realiza en RegisterUserUseCase.";
  }
}

describe("AskProjectQuestionUseCase", () => {
  it("answers a project question using relevant code chunks", async () => {
    const projectRepository = new FakeProjectRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const codeChunkEmbeddingRepository = new FakeCodeChunkEmbeddingRepository();
    const answerGenerator = new FakeAnswerGenerator();

    codeChunkEmbeddingRepository.similarCodeChunks = [
      {
        codeChunkId: "code-chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        path: "src/auth/registerUserUseCase.ts",
        content: "export class RegisterUserUseCase {}",
        startLine: 10,
        endLine: 45,
        index: 0,
        distance: 0.12,
      },
    ];

    projectRepository.projects.push({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new AskProjectQuestionUseCase(
      projectRepository,
      embeddingGenerator,
      codeChunkEmbeddingRepository,
      answerGenerator,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      userId: "user-1",
      question: "¿Dónde se registra un usuario?",
    });

    expect(embeddingGenerator.receivedTexts).toEqual([
      "¿Dónde se registra un usuario?",
    ]);

    expect(codeChunkEmbeddingRepository.receivedFindSimilarInputs).toEqual([
      {
        projectId: "project-1",
        embedding: [0.1, 0.2, 0.3],
        limit: 5,
      },
    ]);

    expect(answerGenerator.receivedInputs).toEqual([
      {
        question: "¿Dónde se registra un usuario?",
        contextChunks: codeChunkEmbeddingRepository.similarCodeChunks,
      },
    ]);

    expect(result).toEqual({
      answer: "El registro de usuario se realiza en RegisterUserUseCase.",
      sources: [
        {
          path: "src/auth/registerUserUseCase.ts",
          startLine: 10,
          endLine: 45,
        },
      ],
    });
  });
  it("does not allow an empty question", async () => {
    const projectRepository = new FakeProjectRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const codeChunkEmbeddingRepository = new FakeCodeChunkEmbeddingRepository();
    const answerGenerator = new FakeAnswerGenerator();

    projectRepository.projects.push({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new AskProjectQuestionUseCase(
      projectRepository,
      embeddingGenerator,
      codeChunkEmbeddingRepository,
      answerGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        userId: "user-1",
        question: "",
      }),
    ).rejects.toThrow("Question is required");

    expect(embeddingGenerator.receivedTexts).toEqual([]);
    expect(codeChunkEmbeddingRepository.receivedFindSimilarInputs).toEqual([]);
    expect(answerGenerator.receivedInputs).toEqual([]);
  });

  it("does not allow asking questions about another user's project", async () => {
    const projectRepository = new FakeProjectRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const codeChunkEmbeddingRepository = new FakeCodeChunkEmbeddingRepository();
    const answerGenerator = new FakeAnswerGenerator();

    projectRepository.projects.push({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new AskProjectQuestionUseCase(
      projectRepository,
      embeddingGenerator,
      codeChunkEmbeddingRepository,
      answerGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        userId: "user-2",
        question: "¿Dónde se registra un usuario?",
      }),
    ).rejects.toThrow("Project not found");

    expect(embeddingGenerator.receivedTexts).toEqual([]);
    expect(codeChunkEmbeddingRepository.receivedFindSimilarInputs).toEqual([]);
    expect(answerGenerator.receivedInputs).toEqual([]);
  });
  it("returns a fallback answer when there are no relevant chunks", async () => {
    const projectRepository = new FakeProjectRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const codeChunkEmbeddingRepository = new FakeCodeChunkEmbeddingRepository();
    const answerGenerator = new FakeAnswerGenerator();

    codeChunkEmbeddingRepository.similarCodeChunks = [];

    projectRepository.projects.push({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new AskProjectQuestionUseCase(
      projectRepository,
      embeddingGenerator,
      codeChunkEmbeddingRepository,
      answerGenerator,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      userId: "user-1",
      question: "¿Dónde se registra un usuario?",
    });

    expect(embeddingGenerator.receivedTexts).toEqual([
      "¿Dónde se registra un usuario?",
    ]);

    expect(codeChunkEmbeddingRepository.receivedFindSimilarInputs).toEqual([
      {
        projectId: "project-1",
        embedding: [0.1, 0.2, 0.3],
        limit: 5,
      },
    ]);

    expect(answerGenerator.receivedInputs).toEqual([]);

    expect(result).toEqual({
      answer:
        "No tengo suficiente información del proyecto para responder a esa pregunta.",
      sources: [],
    });
  });

  it("does not return duplicated sources", async () => {
    const projectRepository = new FakeProjectRepository();
    const embeddingGenerator = new FakeEmbeddingGenerator();
    const codeChunkEmbeddingRepository = new FakeCodeChunkEmbeddingRepository();
    const answerGenerator = new FakeAnswerGenerator();

    codeChunkEmbeddingRepository.similarCodeChunks = [
      {
        codeChunkId: "code-chunk-1",
        projectId: "project-1",
        projectFileId: "project-file-1",
        path: "src/auth/registerUserUseCase.ts",
        content: "export class RegisterUserUseCase {}",
        startLine: 10,
        endLine: 45,
        index: 0,
        distance: 0.12,
      },
      {
        codeChunkId: "code-chunk-2",
        projectId: "project-1",
        projectFileId: "project-file-1",
        path: "src/auth/registerUserUseCase.ts",
        content: "export class RegisterUserUseCase {}",
        startLine: 10,
        endLine: 45,
        index: 1,
        distance: 0.15,
      },
    ];

    projectRepository.projects.push({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const useCase = new AskProjectQuestionUseCase(
      projectRepository,
      embeddingGenerator,
      codeChunkEmbeddingRepository,
      answerGenerator,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      userId: "user-1",
      question: "¿Dónde se registra un usuario?",
    });

    expect(result.sources).toEqual([
      {
        path: "src/auth/registerUserUseCase.ts",
        startLine: 10,
        endLine: 45,
      },
    ]);
  });
});
