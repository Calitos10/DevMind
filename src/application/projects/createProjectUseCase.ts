import type { IdGenerator } from "../ports/idGenerator";
import type { Project } from "../../domain/entities/project";
import type { ProjectRepository } from "../../domain/repositories/projectRepository";

type CreateProjectInput = {
  ownerId: string;
  name: string;
  description?: string;
};

export class CreateProjectUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const project: Project = {
      id: this.idGenerator.generate(),
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
      createdAt: new Date(),
    };

    return this.projectRepository.save(project);
  }
}
