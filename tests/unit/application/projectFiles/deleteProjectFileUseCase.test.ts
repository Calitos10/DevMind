import { describe, expect, it } from "vitest";

import { DeleteProjectFileUseCase } from "../../../../src/application/projectFiles/deleteProjectFileUseCase";
import { Project } from "../../../../src/domain/entities/project";
import { ProjectFile } from "../../../../src/domain/entities/projectFile";
import { ProjectFileNotFoundError } from "../../../../src/shared/errors/projectFileNotFoundError";
import { ProjectNotFoundError } from "../../../../src/shared/errors/project-not-found.error";
import { FakeProjectFileRepository } from "../../../fakes/fakeProjectFileRepository";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("DeleteProjectFileUseCase", () => {
  it("should delete a project file from a project owned by the user", async () => {
    const existingProject: Project = {
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    };

    const existingFile: ProjectFile = {
      id: "file-1",
      projectId: "project-1",
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: "console.log('hello');".length,
      hash: "hash-1",
      createdAt: new Date(),
    };

    const projectRepository = new FakeProjectRepository([existingProject]);
    const projectFileRepository = new FakeProjectFileRepository([existingFile]);

    const useCase = new DeleteProjectFileUseCase(
      projectRepository,
      projectFileRepository,
    );

    await useCase.execute({
      ownerId: "user-1",
      projectId: "project-1",
      fileId: "file-1",
    });

    expect(projectFileRepository.projectFiles).toHaveLength(0);
  });

  it("should throw ProjectNotFoundError when the project does not exist or does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository([]);
    const projectFileRepository = new FakeProjectFileRepository([]);

    const useCase = new DeleteProjectFileUseCase(
      projectRepository,
      projectFileRepository,
    );

    await expect(
      useCase.execute({
        ownerId: "user-1",
        projectId: "project-1",
        fileId: "file-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("should throw ProjectFileNotFoundError when the file does not exist inside the project", async () => {
    const existingProject: Project = {
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    };

    const projectRepository = new FakeProjectRepository([existingProject]);
    const projectFileRepository = new FakeProjectFileRepository([]);

    const useCase = new DeleteProjectFileUseCase(
      projectRepository,
      projectFileRepository,
    );

    await expect(
      useCase.execute({
        ownerId: "user-1",
        projectId: "project-1",
        fileId: "file-1",
      }),
    ).rejects.toBeInstanceOf(ProjectFileNotFoundError);
  });
});
