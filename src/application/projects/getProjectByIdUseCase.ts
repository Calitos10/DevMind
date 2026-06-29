import type { Project } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectNotFoundError } from "../../shared/errors/project-not-found.error";

type GetProjectByIdInput = {
  projectId: string;
  ownerId: string;
};

export class GetProjectByIdUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: GetProjectByIdInput): Promise<Project> {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return project;
  }
}