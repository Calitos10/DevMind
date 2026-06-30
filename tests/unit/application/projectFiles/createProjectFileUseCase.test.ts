import { describe, expect, it } from "vitest";

import { CreateProjectFileUseCase } from "../../../../src/application/projectFiles/createProjectFileUseCase";
import { FileHashGenerator } from "../../../../src/application/ports/fileHashGeneratorPort";
import { IdGenerator } from "../../../../src/application/ports/idGeneratorPort";
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

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return "file-1";
  }
}

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
    const idGenerator = new FakeIdGenerator();
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
    const idGenerator = new FakeIdGenerator();
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
