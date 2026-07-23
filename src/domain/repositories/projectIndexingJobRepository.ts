import type { ProjectIndexingJob } from "../entities/projectIndexingJob";

export interface ProjectIndexingJobRepository {
  save(job: ProjectIndexingJob): Promise<ProjectIndexingJob>;

  findByProjectId(projectId: string): Promise<ProjectIndexingJob | null>;

  update(job: ProjectIndexingJob): Promise<ProjectIndexingJob>;
}