import type { Project } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repositories/projectRepository";

type ListUserProjectsInput = {
  ownerId: string;
};

export class ListUserProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: ListUserProjectsInput): Promise<Project[]> {
    return this.projectRepository.findByOwnerId(input.ownerId);
  }
}