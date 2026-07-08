import type { ProjectIndexingScheduler } from "../../application/ports/projectIndexingScheduler";
import type { IndexProjectEmbeddingsUseCase } from "../../application/indexing/indexProjectEmbeddingsUseCase";

export class AsyncProjectIndexingScheduler implements ProjectIndexingScheduler {
  constructor(
    private readonly indexProjectEmbeddingsUseCase: IndexProjectEmbeddingsUseCase,
  ) {}

  schedule(input: { projectId: string; ownerId: string }): void {
    void this.indexProjectEmbeddingsUseCase
      .execute({
        projectId: input.projectId,
        ownerId: input.ownerId,
      })
      .catch((error) => {
        console.error("Project indexing failed", {
          projectId: input.projectId,
          error,
        });
      });
  }
}