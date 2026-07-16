import { ProjectFile } from "../../domain/entities/projectFile";
import { ProjectFileRepository } from "../../domain/repositories/projectFileRepository";
import { ProjectRepository } from "../../domain/repositories/projectRepository";
import { ProjectFileNotFoundError } from "../../shared/errors/projectFileNotFoundError";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";

type GetProjectFileByIdInput = {
  ownerId: string;
  projectId: string;
  fileId: string;
};

export class GetProjectFileByIdUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
  ) {}

  async execute(input: GetProjectFileByIdInput): Promise<ProjectFile> {
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

    return projectFile;
  }
}