import type { EmbeddingForCodeChunkGenerator } from "../ports/embeddingForCodeChunkGenerator";
import type { ProjectRepository } from "../../domain/repositories/projectRepository";
import type { CodeChunkRepository } from "../../domain/repositories/codeChunkRepository";
import type { ProjectIndexingJobRepository } from "../../domain/repositories/projectIndexingJobRepository";
import type { IdGenerator } from "../ports/idGenerator";
import type { Delay } from "../ports/delay";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";
import { IndexingAlreadyInProgressError } from "../../shared/errors/indexingAlreadyInProgressError";

type IndexProjectEmbeddingsUseCaseInput = {
  projectId: string;
  ownerId: string;
};

export class IndexProjectEmbeddingsUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly codeChunkRepository: CodeChunkRepository,
    private readonly projectIndexingJobRepository: ProjectIndexingJobRepository,
    private readonly generateEmbeddingForCodeChunkUseCase: EmbeddingForCodeChunkGenerator,
    private readonly idGenerator: IdGenerator,
    private readonly delay?: Delay,
    private readonly delayBetweenChunksMs = 0,
  ) {}

  async execute(input: IndexProjectEmbeddingsUseCaseInput) {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const codeChunks = await this.codeChunkRepository.findByProjectId(
      input.projectId,
    );

    const now = new Date();

    const existingIndexingJob =
      await this.projectIndexingJobRepository.findByProjectId(input.projectId);

    // Guard de idempotencia: si ya hay una indexación en curso para este
    // proyecto, se rechaza en lugar de arrancar una segunda pasada solapada.
    // Sin esto, un doble clic o un reintento del cliente lanzaría indexaciones
    // concurrentes que borran y regeneran los mismos embeddings a la vez.
    if (existingIndexingJob?.status === "processing") {
      throw new IndexingAlreadyInProgressError();
    }

    const indexingJob = existingIndexingJob
      ? await this.projectIndexingJobRepository.update({
          ...existingIndexingJob,
          status: "processing",
          totalChunks: codeChunks.length,
          processedChunks: 0,
          failedChunks: 0,
          errorMessage: undefined,
          updatedAt: now,
        })
      : await this.projectIndexingJobRepository.save({
          id: this.idGenerator.generate(),
          projectId: input.projectId,
          status: "processing",
          totalChunks: codeChunks.length,
          processedChunks: 0,
          failedChunks: 0,
          errorMessage: undefined,
          createdAt: now,
          updatedAt: now,
        });

    let processedChunks = 0;
    let failedChunks = 0;

    try {
      for (let index = 0; index < codeChunks.length; index += 1) {
        const codeChunk = codeChunks[index];

        await this.generateEmbeddingForCodeChunkUseCase.execute({
          codeChunk,
        });

        processedChunks += 1;

        await this.projectIndexingJobRepository.update({
          ...indexingJob,
          status: "processing",
          processedChunks,
          failedChunks,
          updatedAt: new Date(),
        });

        const hasMoreChunks = index < codeChunks.length - 1;

        if (hasMoreChunks && this.delay && this.delayBetweenChunksMs > 0) {
          await this.delay.wait(this.delayBetweenChunksMs);
        }
      }

      const completedJob = await this.projectIndexingJobRepository.update({
        ...indexingJob,
        status: "completed",
        processedChunks,
        failedChunks,
        errorMessage: undefined,
        updatedAt: new Date(),
      });

      return {
        projectId: completedJob.projectId,
        status: completedJob.status,
        totalChunks: completedJob.totalChunks,
        processedChunks: completedJob.processedChunks,
        failedChunks: completedJob.failedChunks,
      };
    } catch (error) {
      failedChunks += 1;

      await this.projectIndexingJobRepository.update({
        ...indexingJob,
        status: "failed",
        processedChunks,
        failedChunks,
        errorMessage: getErrorMessage(error),
        updatedAt: new Date(),
      });

      throw error;
    }
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown indexing error";
}
