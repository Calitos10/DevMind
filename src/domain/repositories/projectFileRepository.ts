import { ProjectFile } from "../entities/projectFile";

export interface ProjectFileRepository {
  save(projectFile: ProjectFile): Promise<ProjectFile>;
  findByProjectId(projectId: string): Promise<ProjectFile[]>;
  findByIdAndProjectId(
    id: string,
    projectId: string,
  ): Promise<ProjectFile | null>;
  deleteByIdAndProjectId(id: string, projectId: string): Promise<void>;
  update(projectFile: ProjectFile): Promise<ProjectFile>;
}
