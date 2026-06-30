import { describe, expect, it } from "vitest";

import { ListProjectFilesUseCase } from "../../../../src/application/projectFiles/listProjectFilesUseCase";
import { Project } from "../../../../src/domain/entities/project";
import { ProjectFile } from "../../../../src/domain/entities/projectFile";
import { ProjectRepository } from "../../../../src/domain/repository/projectRepository";
import { ProjectFileRepository } from "../../../../src/domain/repository/projectFileRepository";
import { ProjectNotFoundError } from "../../../../src/shared/errors/project-not-found.error";

class FakeProjectRepository implements ProjectRepository {
  constructor(private readonly projects: Project[] = []) {}

  async save(project: Project): Promise<Project> {
    this.projects.push(project);
    return project;
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    return this.projects.filter((project) => project.ownerId === ownerId);
  }

  async findByIdAndOwnerId(
    id: string,
    ownerId: string,
  ): Promise<Project | null> {
    return (
      this.projects.find(
        (project) => project.id === id && project.ownerId === ownerId,
      ) ?? null
    );
  }

  async deleteByIdAndOwnerId(id: string, ownerId: string): Promise<void> {
    const projectIndex = this.projects.findIndex(
      (project) => project.id === id && project.ownerId === ownerId,
    );

    if (projectIndex >= 0) {
      this.projects.splice(projectIndex, 1);
    }
  }
}

class FakeProjectFileRepository implements ProjectFileRepository {
  constructor(public projectFiles: ProjectFile[] = []) {}

  async save(projectFile: ProjectFile): Promise<ProjectFile> {
    this.projectFiles.push(projectFile);
    return projectFile;
  }

  async findByProjectId(projectId: string): Promise<ProjectFile[]> {
    return this.projectFiles.filter(
      (projectFile) => projectFile.projectId === projectId,
    );
  }

  async findByIdAndProjectId(
    id: string,
    projectId: string,
  ): Promise<ProjectFile | null> {
    return (
      this.projectFiles.find(
        (projectFile) =>
          projectFile.id === id && projectFile.projectId === projectId,
      ) ?? null
    );
  }

  async deleteByIdAndProjectId(id: string, projectId: string): Promise<void> {
    this.projectFiles = this.projectFiles.filter(
      (projectFile) =>
        !(projectFile.id === id && projectFile.projectId === projectId),
    );
  }
}

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
