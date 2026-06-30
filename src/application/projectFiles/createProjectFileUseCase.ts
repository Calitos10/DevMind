import { FileHashGenerator } from "../ports/fileHashGeneratorPort";
import { IdGenerator } from "../ports/idGeneratorPort";
import { ProjectFile } from "../../domain/entities/projectFile";
import { ProjectFileRepository } from "../../domain/repository/projectFileRepository";
import { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectNotFoundError } from "../../shared/errors/project-not-found.error";

type CreateProjectFileInput = {
  ownerId: string;
  projectId: string;
  path: string;
  language: string;
  content: string;
};

export class CreateProjectFileUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
    private readonly idGenerator: IdGenerator,
    private readonly fileHashGenerator: FileHashGenerator
  ) {}

  async execute(input: CreateProjectFileInput): Promise<ProjectFile> {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const projectFile: ProjectFile = {
      id: this.idGenerator.generate(),
      projectId: input.projectId,
      path: input.path,
      language: input.language,
      content: input.content,
      size: input.content.length,
      hash: this.fileHashGenerator.generate(input.content),
      createdAt: new Date(),
    };

    return this.projectFileRepository.save(projectFile);
  }
}