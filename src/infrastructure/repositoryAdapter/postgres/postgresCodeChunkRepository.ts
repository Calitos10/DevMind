import { Pool } from "pg";

import { CodeChunk } from "../../../domain/entities/codeChunk";
import { CodeChunkRepository } from "../../../domain/repositories/codeChunkRepository";

export class PostgresCodeChunkRepository implements CodeChunkRepository {
  constructor(private readonly pool: Pool) {}

  async saveMany(codeChunks: CodeChunk[]): Promise<CodeChunk[]> {
    if (codeChunks.length === 0) {
      return [];
    }

    const savedCodeChunks: CodeChunk[] = [];

    for (const codeChunk of codeChunks) {
      const result = await this.pool.query(
        `
        INSERT INTO code_chunks (
          id,
          project_id,
          project_file_id,
          content,
          start_line,
          end_line,
          chunk_index,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING
          id,
          project_id,
          project_file_id,
          content,
          start_line,
          end_line,
          chunk_index,
          created_at
        `,
        [
          codeChunk.id,
          codeChunk.projectId,
          codeChunk.projectFileId,
          codeChunk.content,
          codeChunk.startLine,
          codeChunk.endLine,
          codeChunk.index,
          codeChunk.createdAt,
        ],
      );

      savedCodeChunks.push(this.toDomain(result.rows[0]));
    }

    return savedCodeChunks;
  }

  async findByProjectFileId(projectFileId: string): Promise<CodeChunk[]> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        project_id,
        project_file_id,
        content,
        start_line,
        end_line,
        chunk_index,
        created_at
      FROM code_chunks
      WHERE project_file_id = $1
      ORDER BY chunk_index ASC
      `,
      [projectFileId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }
  async findByProjectId(projectId: string): Promise<CodeChunk[]> {
    const result = await this.pool.query(
      `
    SELECT
      id,
      project_id,
      project_file_id,
      content,
      start_line,
      end_line,
      chunk_index,
      created_at
    FROM code_chunks
    WHERE project_id = $1
    ORDER BY project_file_id ASC, chunk_index ASC
    `,
      [projectId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async deleteByProjectFileId(projectFileId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM code_chunks
      WHERE project_file_id = $1
      `,
      [projectFileId],
    );
  }

  private toDomain(row: {
    id: string;
    project_id: string;
    project_file_id: string;
    content: string;
    start_line: number;
    end_line: number;
    chunk_index: number;
    created_at: Date;
  }): CodeChunk {
    return {
      id: row.id,
      projectId: row.project_id,
      projectFileId: row.project_file_id,
      content: row.content,
      startLine: row.start_line,
      endLine: row.end_line,
      index: row.chunk_index,
      createdAt: row.created_at,
    };
  }
}
