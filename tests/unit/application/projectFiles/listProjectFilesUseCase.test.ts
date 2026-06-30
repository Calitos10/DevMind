import { describe, expect, it } from "vitest";

import { ListProjectFilesUseCase } from "../../../../src/application/projectFiles/listProjectFilesUseCase";
import { Project } from "../../../../src/domain/entities/project";
import { ProjectFile } from "../../../../src/domain/entities/projectFile";
import { ProjectNotFoundError } from "../../../../src/shared/errors/project-not-found.error";
import { FakeProjectFileRepository } from "../../../fakes/fakeProjectFileRepository";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";

describe("ListProjectFilesUseCase", () => {
  it("should list files from a project owned by the user", async () => {
    const existingProject: Project = {
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    };

    const projectFiles: ProjectFile[] = [
      {
        id: "file-1",
        projectId: "project-1",
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('app');",
        size: "console.log('app');".length,
        hash: "hash-1",
        createdAt: new Date(),
      },
      {
        id: "file-2",
        projectId: "project-1",
        path: "src/main.ts",
        language: "typescript",
        content: "console.log('main');",
        size: "console.log('main');".length,
        hash: "hash-2",
        createdAt: new Date(),
      },
      {
        id: "file-3",
        projectId: "project-2",
        path: "src/other.ts",
        language: "typescript",
        content: "console.log('other');",
        size: "console.log('other');".length,
        hash: "hash-3",
        createdAt: new Date(),
      },
    ];

    const projectRepository = new FakeProjectRepository([existingProject]);
    const projectFileRepository = new FakeProjectFileRepository(projectFiles);

    const useCase = new ListProjectFilesUseCase(
      projectRepository,
      projectFileRepository,
    );

    const result = await useCase.execute({
      ownerId: "user-1",
      projectId: "project-1",
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual([projectFiles[0], projectFiles[1]]);
  });

  it("should return an empty array when the project exists but has no files", async () => {
    const existingProject: Project = {
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend with AI",
      createdAt: new Date(),
    };

    const projectRepository = new FakeProjectRepository([existingProject]);
    const projectFileRepository = new FakeProjectFileRepository([]);

    const useCase = new ListProjectFilesUseCase(
      projectRepository,
      projectFileRepository,
    );

    const result = await useCase.execute({
      ownerId: "user-1",
      projectId: "project-1",
    });

    expect(result).toEqual([]);
  });

  it("should throw ProjectNotFoundError when the project does not exist or does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository([]);
    const projectFileRepository = new FakeProjectFileRepository([]);

    const useCase = new ListProjectFilesUseCase(
      projectRepository,
      projectFileRepository,
    );

    await expect(
      useCase.execute({
        ownerId: "user-1",
        projectId: "project-1",
      }),
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});
