import { ProjectFile } from "../../domain/entities/projectFile";
import { CodeChunk } from "../../domain/entities/codeChunk";
import { CodeChunkRepository } from "../../domain/repository/codeChunkRepository";
import { IdGenerator } from "../ports/idGeneratorPort";

export type ChunkResult = {
  content: string;
  startLine: number;
  endLine: number;
  index: number;
};

export interface CodeChunker {
  chunk(input: {
    content: string;
    maxLinesPerChunk: number;
    overlapLines: number;
  }): ChunkResult[];
}

type GenerateCodeChunksForProjectFileInput = {
  projectFile: ProjectFile;
};

type GenerateCodeChunksForProjectFileOutput = {
  projectFileId: string;
  chunksCreated: number;
  chunks: CodeChunk[];
};

type GenerateEmbeddingForCodeChunkUseCase = {
  execute(input: { codeChunk: CodeChunk }): Promise<unknown>;
};

export class GenerateCodeChunksForProjectFileUseCase {
  constructor(
    private readonly codeChunkRepository: CodeChunkRepository,
    private readonly codeChunker: CodeChunker,
    private readonly idGenerator: IdGenerator,
    private readonly generateEmbeddingForCodeChunkUseCase: GenerateEmbeddingForCodeChunkUseCase,
  ) {}

  async execute(
    input: GenerateCodeChunksForProjectFileInput,
  ): Promise<GenerateCodeChunksForProjectFileOutput> {
    await this.codeChunkRepository.deleteByProjectFileId(input.projectFile.id);

    const chunkResults = this.codeChunker.chunk({
      content: input.projectFile.content,
      maxLinesPerChunk: 80,
      overlapLines: 10,
    });

    const now = new Date();

    const codeChunks: CodeChunk[] = chunkResults.map((chunkResult) => ({
      id: this.idGenerator.generate(),
      projectId: input.projectFile.projectId,
      projectFileId: input.projectFile.id,
      content: chunkResult.content,
      startLine: chunkResult.startLine,
      endLine: chunkResult.endLine,
      index: chunkResult.index,
      createdAt: now,
    }));

    const savedCodeChunks = await this.codeChunkRepository.saveMany(codeChunks);

    for (const savedCodeChunk of savedCodeChunks) {
      await this.generateEmbeddingForCodeChunkUseCase.execute({
        codeChunk: savedCodeChunk,
      });
    }

    return {
      projectFileId: input.projectFile.id,
      chunksCreated: savedCodeChunks.length,
      chunks: savedCodeChunks,
    };
  }
}
