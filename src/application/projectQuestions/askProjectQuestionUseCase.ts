import type { ProjectRepository } from "../../domain/repository/projectRepository";
import type {
  CodeChunkEmbeddingRepository,
  SimilarCodeChunk,
} from "../../domain/repository/codeChunkEmbeddingRepository";
import type { EmbeddingGenerator } from "../ports/embeddingGenerator";
import type { AnswerGenerator } from "../ports/answerGenerator";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";
import { QuestionIsRequired } from "../../shared/errors/questionIsRequired";

type AskProjectQuestionInput = {
  projectId: string;
  userId: string;
  question: string;
};

type AskProjectQuestionOutput = {
  answer: string;
  sources: Array<{
    path: string;
    startLine: number;
    endLine: number;
  }>;
};

export class AskProjectQuestionUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly embeddingGenerator: EmbeddingGenerator,
    private readonly codeChunkEmbeddingRepository: CodeChunkEmbeddingRepository,
    private readonly answerGenerator: AnswerGenerator,
  ) {}

  async execute(
    input: AskProjectQuestionInput,
  ): Promise<AskProjectQuestionOutput> {
    if (!input.question.trim()) {
      throw new QuestionIsRequired();
    }

    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.userId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const questionEmbedding = await this.embeddingGenerator.generateEmbedding(
      input.question,
    );

    const contextChunks =
      await this.codeChunkEmbeddingRepository.findSimilarByProjectId({
        projectId: input.projectId,
        embedding: questionEmbedding,
        limit: 5,
      });

    if (contextChunks.length === 0) {
      return {
        answer:
          "No tengo suficiente información del proyecto para responder a esa pregunta.",
        sources: [],
      };
    }

    const answer = await this.answerGenerator.generateAnswer({
      question: input.question,
      contextChunks,
    });

    const sources = this.buildSources(contextChunks);

    return {
      answer,
      sources,
    };
  }

  private buildSources(contextChunks: SimilarCodeChunk[]) {
    return Array.from(
      new Map(
        contextChunks.map((contextChunk) => [
          `${contextChunk.path}:${contextChunk.startLine}:${contextChunk.endLine}`,
          {
            path: contextChunk.path,
            startLine: contextChunk.startLine,
            endLine: contextChunk.endLine,
          },
        ]),
      ).values(),
    );
  }
}
