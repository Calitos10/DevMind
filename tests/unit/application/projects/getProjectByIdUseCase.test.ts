import { describe, expect, it } from "vitest";

import { GetProjectByIdUseCase } from "../../../../src/application/projects/getProjectByIdUseCase";
import type { Project } from "../../../../src/domain/entities/project";
import type { ProjectRepository } from "../../../../src/domain/repository/projectRepository";
import { ProjectNotFoundError } from "../../../../src/shared/errors/project-not-found.error";

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
    ownerId: string
  ): Promise<Project | null> {
    return (
      this.projects.find(
        (project) => project.id === id && project.ownerId === ownerId
      ) ?? null
    );
  }

  async deleteByIdAndOwnerId(id: string, ownerId: string): Promise<void> {
    this.projects = this.projects.filter(
      (project) => !(project.id === id && project.ownerId === ownerId)
    );
  }
}

describe("GetProjectByIdUseCase", () => {
  it("should return a project when it belongs to the user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new GetProjectByIdUseCase(projectRepository);

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
    });

    expect(result).toEqual({
      id: "project-1",
      ownerId: "user-1",
      name: "DevMind API",
      description: "Backend con IA",
      createdAt: new Date("2026-01-01"),
    });
  });

  it("should throw ProjectNotFoundError when the project belongs to another user", async () => {
    const projectRepository = new FakeProjectRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-2",
      name: "Proyecto privado de otro usuario",
      description: "No debería poder verlo user-1",
      createdAt: new Date("2026-01-01"),
    });

    const useCase = new GetProjectByIdUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
      })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });

  it("should throw ProjectNotFoundError when the project does not exist", async () => {
    const projectRepository = new FakeProjectRepository();

    const useCase = new GetProjectByIdUseCase(projectRepository);

    await expect(
      useCase.execute({
        projectId: "non-existing-project",
        ownerId: "user-1",
      })
    ).rejects.toBeInstanceOf(ProjectNotFoundError);
  });
});