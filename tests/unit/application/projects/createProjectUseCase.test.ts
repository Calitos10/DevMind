import { describe, expect, it } from "vitest";

import { CreateProjectUseCase } from "../../../../src/application/projects/createProjectUseCase";
import type { IdGenerator } from "../../../../src/application/ports/idGeneratorPort";
import type { Project } from "../../../../src/domain/entities/project";
import type { ProjectRepository } from "../../../../src/domain/repository/projectRepository";

class FakeProjectRepository implements ProjectRepository {
  private projects: Project[] = [];

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
    this.projects = this.projects.filter(
      (project) => !(project.id === id && project.ownerId === ownerId),
    );
  }
}

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return "project-1";
  }
}

describe("CreateProjectUseCase", () => {
  it("should create a project associated with a user", async () => {
    const projectRepository = new FakeProjectRepository();
    const idGenerator = new FakeIdGenerator();

    const useCase = new CreateProjectUseCase(projectRepository, idGenerator);

    const result = await useCase.execute({
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
    });

    expect(result).toEqual({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: expect.any(Date),
    });
  });
});
