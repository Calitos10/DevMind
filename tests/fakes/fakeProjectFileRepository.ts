import type { ProjectFile } from "../../src/domain/entities/projectFile";
import type { ProjectFileRepository } from "../../src/domain/repository/projectFileRepository";

export class FakeProjectFileRepository implements ProjectFileRepository {
  constructor(public projectFiles: ProjectFile[] = []) {}

  async save(projectFile: ProjectFile): Promise<ProjectFile> {
    this.projectFiles.push(projectFile);
    return projectFile;
  }

  async findByProjectId(projectId: string): Promise<ProjectFile[]> {
    return this.projectFiles.filter(
      (projectFile) => projectFile.projectId === projectId,
    );
  }

  async findByIdAndProjectId(
    id: string,
    projectId: string,
  ): Promise<ProjectFile | null> {
    return (
      this.projectFiles.find(
        (projectFile) =>
          projectFile.id === id && projectFile.projectId === projectId,
      ) ?? null
    );
  }

  async deleteByIdAndProjectId(id: string, projectId: string): Promise<void> {
    this.projectFiles = this.projectFiles.filter(
      (projectFile) =>
        !(projectFile.id === id && projectFile.projectId === projectId),
    );
  }
}
