import { ConversationEntry } from "../entities/conversationEntry";

export interface ConversationRepository {
  save(entry: ConversationEntry): Promise<ConversationEntry>;
  // Devuelve el historial de un proyecto ordenado cronológicamente (más antiguo primero).
  findByProjectId(projectId: string): Promise<ConversationEntry[]>;
}
