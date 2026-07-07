import { ProjectFile } from "../../domain/entities/projectFile";
import { ProjectFileRepository } from "../../domain/repository/projectFileRepository";
import { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";

type ListProjectFilesInput = {
  ownerId: string;
  projectId: string;
};

export class ListProjectFilesUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
  ) {}

  async execute(input: ListProjectFilesInput): Promise<ProjectFile[]> {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return this.projectFileRepository.findByProjectId(input.projectId);
  }
}