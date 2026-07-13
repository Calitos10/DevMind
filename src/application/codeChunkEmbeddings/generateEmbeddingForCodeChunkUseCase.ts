import { CodeChunk } from "../../domain/entities/codeChunk";
import { CodeChunkEmbedding } from "../../domain/entities/codeChunkEmbedding";
import { CodeChunkEmbeddingRepository } from "../../domain/repository/codeChunkEmbeddingRepository";
import { IdGenerator } from "../ports/idGeneratorPort";
import { EmbeddingGenerator } from "../ports/embeddingGenerator";
import type {
  EmbeddingForCodeChunkGenerator,
  GenerateEmbeddingForCodeChunkResult,
} from "../ports/embeddingForCodeChunkGeneratorPort";

type GenerateEmbeddingForCodeChunkInput = {
  codeChunk: CodeChunk;
};

export class GenerateEmbeddingForCodeChunkUseCase
  implements EmbeddingForCodeChunkGenerator
{
  constructor(
    private readonly codeChunkEmbeddingRepository: CodeChunkEmbeddingRepository,
    private readonly embeddingGenerator: EmbeddingGenerator,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(
    input: GenerateEmbeddingForCodeChunkInput,
  ): Promise<GenerateEmbeddingForCodeChunkResult> {
    const embedding = await this.embeddingGenerator.generateEmbedding(
      input.codeChunk.content,
    );

    await this.codeChunkEmbeddingRepository.deleteByCodeChunkId(
      input.codeChunk.id,
    );

    const codeChunkEmbedding: CodeChunkEmbedding = {
      id: this.idGenerator.generate(),
      projectId: input.codeChunk.projectId,
      codeChunkId: input.codeChunk.id,
      embedding,
      createdAt: new Date(),
    };

    const savedCodeChunkEmbedding =
      await this.codeChunkEmbeddingRepository.save(codeChunkEmbedding);

    return {
      codeChunkId: input.codeChunk.id,
      embeddingCreated: true,
      codeChunkEmbedding: savedCodeChunkEmbedding,
    };
  }
}
