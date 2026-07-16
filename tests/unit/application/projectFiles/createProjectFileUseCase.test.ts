import { describe, expect, it } from "vitest";

import { CreateProjectFileUseCase } from "../../../../src/application/projectFiles/createProjectFileUseCase";
import { FileHashGenerator } from "../../../../src/application/ports/fileHashGenerator";
import { Project } from "../../../../src/domain/entities/project";
import { ProjectNotFoundError } from "../../../../src/shared/errors/projectNotFoundError";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";
import { FakeProjectFileRepository } from "../../../fakes/fakeProjectFileRepository";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

class FakeFileHashGenerator implements FileHashGenerator {
  generate(content: string): string {
    return `hash-of-${content}`;
  }
}

describe("CreateProjectFileUseCase", () => {
  it("should create a project file associated with a project owned by the user", async () => {
    const existingProject: Project = {
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    };

    const projectRepository = new FakeProjectRepository([existingProject]);
    const projectFileRepository = new FakeProjectFileRepository();
    const idGenerator = new FakeIdGenerator("file-1");
    const fileHashGenerator = new FakeFileHashGenerator();

    const useCase = new CreateProjectFileUseCase(
      projectRepository,
      projectFileRepository,
      idGenerator,
      fileHashGenerator,
    );

    const result = await useCase.execute({
      ownerId: "user-1",
      projectId: "project-1",
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
    });

    expect(result).toEqual({
      id: "file-1",
      projectId: "project-1",
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: "console.log('hello');".length,
      hash: "hash-of-console.log('hello');",
      createdAt: expect.any(Date),
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);
    expect(projectFileRepository.projectFiles[0]).toEqual(result);
  });

  it("should throw ProjectNotFoundError when the project does not exist or does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository([]);
    const projectFileRepository = new FakeProjectFileRepository();
    const idGenerator = new FakeIdGenerator("file-1");
    const fileHashGenerator = new FakeFileHashGenerator();

    const useCase = new CreateProjectFileUseCase(
      projectRepository,
      projectFileRepository,
      idGenerator,
      fileHashGenerator,
    );

    await expect(
      useCase.execute({
        ownerId: "user-1",
        projectId: "project-1",
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);

    expect(projectFileRepository.projectFiles).toHaveLength(0);
  });
});
