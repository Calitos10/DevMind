import { ProjectFileRepository } from "../../domain/repository/projectFileRepository";
import { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectFileNotFoundError } from "../../shared/errors/projectFileNotFoundError";
import { ProjectNotFoundError } from "../../shared/errors/project-not-found.error";

type DeleteProjectFileInput = {
  ownerId: string;
  projectId: string;
  fileId: string;
};

export class DeleteProjectFileUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
  ) {}

  async execute(input: DeleteProjectFileInput): Promise<void> {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const projectFile = await this.projectFileRepository.findByIdAndProjectId(
      input.fileId,
      input.projectId,
    );

    if (!projectFile) {
      throw new ProjectFileNotFoundError();
    }

    await this.projectFileRepository.deleteByIdAndProjectId(
      input.fileId,
      input.projectId,
    );
  }
}