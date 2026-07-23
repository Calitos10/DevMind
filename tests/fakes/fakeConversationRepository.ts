import type { ConversationEntry } from "../../src/domain/entities/conversationEntry";
import type { ConversationRepository } from "../../src/domain/repositories/conversationRepository";

export class FakeConversationRepository implements ConversationRepository {
  constructor(public entries: ConversationEntry[] = []) {}

  async save(entry: ConversationEntry): Promise<ConversationEntry> {
    this.entries.push(entry);
    return entry;
  }

  async findByProjectId(projectId: string): Promise<ConversationEntry[]> {
    return this.entries
      .filter((entry) => entry.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
}
