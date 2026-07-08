import type { ProjectRepository } from "../../domain/repository/projectRepository";
import type { ProjectIndexingJobRepository } from "../../domain/repository/projectIndexingJobRepository";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";

type GetProjectIndexingStatusUseCaseInput = {
  projectId: string;
  ownerId: string;
};

export class GetProjectIndexingStatusUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectIndexingJobRepository: ProjectIndexingJobRepository,
  ) {}

  async execute(input: GetProjectIndexingStatusUseCaseInput) {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const indexingJob =
      await this.projectIndexingJobRepository.findByProjectId(input.projectId);

    if (!indexingJob) {
      return {
        projectId: input.projectId,
        status: "pending",
        totalChunks: 0,
        processedChunks: 0,
        failedChunks: 0,
        progress: 0,
      };
    }

    return {
      projectId: indexingJob.projectId,
      status: indexingJob.status,
      totalChunks: indexingJob.totalChunks,
      processedChunks: indexingJob.processedChunks,
      failedChunks: indexingJob.failedChunks,
      progress: calculateProgress({
        totalChunks: indexingJob.totalChunks,
        processedChunks: indexingJob.processedChunks,
      }),
    };
  }
}

function calculateProgress(input: {
  totalChunks: number;
  processedChunks: number;
}): number {
  if (input.totalChunks === 0) {
    return 0;
  }

  return Math.round((input.processedChunks / input.totalChunks) * 100);
}