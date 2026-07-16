import type { ProjectRepository } from "../../domain/repositories/projectRepository";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";

type DeleteProjectInput = {
  projectId: string;
  ownerId: string;
};

export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    await this.projectRepository.deleteByIdAndOwnerId(
      input.projectId,
      input.ownerId
    );
  }
}