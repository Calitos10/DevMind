import type { ProjectRepository } from "../../domain/repositories/projectRepository";
import type {
  CodeChunkEmbeddingRepository,
  SimilarCodeChunk,
} from "../../domain/repositories/codeChunkEmbeddingRepository";
import type { EmbeddingGenerator } from "../ports/embeddingGenerator";
import type { AnswerGenerator } from "../ports/answerGenerator";
import type { ConversationRepository } from "../../domain/repositories/conversationRepository";
import type { IdGenerator } from "../ports/idGenerator";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";
import { QuestionIsRequiredError } from "../../shared/errors/questionIsRequiredError";

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
    private readonly conversationRepository: ConversationRepository,
    private readonly idGenerator: IdGenerator,
    // Distancia máxima aceptada para considerar un chunk relevante.
    // Por defecto no filtra (Infinity); el valor real se inyecta desde el container.
    private readonly maxDistance: number = Number.POSITIVE_INFINITY,
  ) {}

  async execute(
    input: AskProjectQuestionInput,
  ): Promise<AskProjectQuestionOutput> {
    if (!input.question.trim()) {
      throw new QuestionIsRequiredError();
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

    // Se descartan los chunks cuya distancia supere el umbral: aunque pgvector
    // siempre devuelve los "más cercanos", eso no significa que sean relevantes.
    // Si la pregunta no tiene nada que ver con el proyecto, todos quedan fuera
    // y se responde que no hay información en lugar de inventar.
    const relevantChunks = contextChunks.filter(
      (contextChunk) => contextChunk.distance <= this.maxDistance,
    );

    // Se calculan respuesta y fuentes según haya o no chunks relevantes, y a
    // continuación se guarda el intercambio en el historial en ambos casos
    // (también cuando no hay información, porque es historial real del usuario).
    let answer: string;
    let sources: AskProjectQuestionOutput["sources"];

    if (relevantChunks.length === 0) {
      answer =
        "No tengo suficiente información del proyecto para responder a esa pregunta.";
      sources = [];
    } else {
      answer = await this.answerGenerator.generateAnswer({
        question: input.question,
        contextChunks: relevantChunks,
      });

      sources = this.buildSources(relevantChunks);
    }

    await this.conversationRepository.save({
      id: this.idGenerator.generate(),
      projectId: input.projectId,
      question: input.question,
      answer,
      sources,
      createdAt: new Date(),
    });

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
