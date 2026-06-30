import { Project } from "../../../domain/entities/project";
import { ProjectRepository } from "../../../domain/repository/projectRepository";

export class InMemoryProjectRepository implements ProjectRepository {
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

  async deleteByIdAndOwnerId(
    id: string,
    ownerId: string
  ): Promise<void> {
    this.projects = this.projects.filter(
      (project) => !(project.id === id && project.ownerId === ownerId)
    );
  }
}