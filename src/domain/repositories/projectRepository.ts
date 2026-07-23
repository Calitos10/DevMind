import type { Project } from "../entities/project";

export interface ProjectRepository {
  save(project: Project): Promise<Project>;

  findByOwnerId(ownerId: string): Promise<Project[]>;

  findByIdAndOwnerId(
    id: string,
    ownerId: string
  ): Promise<Project | null>;

  deleteByIdAndOwnerId(
    id: string,
    ownerId: string
  ): Promise<void>;
}