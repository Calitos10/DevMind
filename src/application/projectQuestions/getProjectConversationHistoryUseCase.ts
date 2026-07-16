import type { ProjectRepository } from "../../domain/repositories/projectRepository";
import type { ConversationRepository } from "../../domain/repositories/conversationRepository";
import type { ConversationEntry } from "../../domain/entities/conversationEntry";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";

type GetProjectConversationHistoryUseCaseInput = {
  projectId: string;
  userId: string;
};

export class GetProjectConversationHistoryUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly conversationRepository: ConversationRepository,
  ) {}

  async execute(
    input: GetProjectConversationHistoryUseCaseInput,
  ): Promise<ConversationEntry[]> {
    // Solo el dueño del proyecto puede consultar su historial.
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.userId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    return this.conversationRepository.findByProjectId(input.projectId);
  }
}
