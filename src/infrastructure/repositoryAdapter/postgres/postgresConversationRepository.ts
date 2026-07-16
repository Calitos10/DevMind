import { Pool } from "pg";

import {
  ConversationEntry,
  ConversationSource,
} from "../../../domain/entities/conversationEntry";
import { ConversationRepository } from "../../../domain/repositories/conversationRepository";

type ConversationEntryRow = {
  id: string;
  project_id: string;
  question: string;
  answer: string;
  // node-postgres deserializa las columnas JSONB a objetos/arrays de JS.
  sources: ConversationSource[];
  created_at: Date;
};

export class PostgresConversationRepository implements ConversationRepository {
  constructor(private readonly pool: Pool) {}

  async save(entry: ConversationEntry): Promise<ConversationEntry> {
    const result = await this.pool.query<ConversationEntryRow>(
      `
      INSERT INTO conversation_entries (
        id,
        project_id,
        question,
        answer,
        sources,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6)
      RETURNING id, project_id, question, answer, sources, created_at
      `,
      [
        entry.id,
        entry.projectId,
        entry.question,
        entry.answer,
        JSON.stringify(entry.sources),
        entry.createdAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByProjectId(projectId: string): Promise<ConversationEntry[]> {
    const result = await this.pool.query<ConversationEntryRow>(
      `
      SELECT id, project_id, question, answer, sources, created_at
      FROM conversation_entries
      WHERE project_id = $1
      ORDER BY created_at ASC
      `,
      [projectId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  private toDomain(row: ConversationEntryRow): ConversationEntry {
    return {
      id: row.id,
      projectId: row.project_id,
      question: row.question,
      answer: row.answer,
      sources: row.sources,
      createdAt: row.created_at,
    };
  }
}
