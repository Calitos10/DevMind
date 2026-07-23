import type { Project } from "../../src/domain/entities/project";
import type { ProjectRepository } from "../../src/domain/repositories/projectRepository";

export class FakeProjectRepository implements ProjectRepository {
  constructor(public projects: Project[] = []) {}

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
    const index = this.projects.findIndex(
      (project) => project.id === id && project.ownerId === ownerId,
    );
    if (index >= 0) {
      this.projects.splice(index, 1);
    }
  }
}
