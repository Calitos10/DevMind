import { Pool } from "pg";

import { CodeChunkEmbedding } from "../../../domain/entities/codeChunkEmbedding";
import {
  CodeChunkEmbeddingRepository,
  SimilarCodeChunk,
} from "../../../domain/repositories/codeChunkEmbeddingRepository";

export class PostgresCodeChunkEmbeddingRepository implements CodeChunkEmbeddingRepository {
  constructor(private readonly pool: Pool) {}

  async save(
    codeChunkEmbedding: CodeChunkEmbedding,
  ): Promise<CodeChunkEmbedding> {
    const result = await this.pool.query(
      `
      INSERT INTO code_chunk_embeddings (
        id,
        project_id,
        code_chunk_id,
        embedding,
        created_at
      )
      VALUES ($1, $2, $3, $4::vector, $5)
      RETURNING
        id,
        project_id,
        code_chunk_id,
        embedding,
        created_at
      `,
      [
        codeChunkEmbedding.id,
        codeChunkEmbedding.projectId,
        codeChunkEmbedding.codeChunkId,
        this.toPostgresVector(codeChunkEmbedding.embedding),
        codeChunkEmbedding.createdAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByCodeChunkId(
    codeChunkId: string,
  ): Promise<CodeChunkEmbedding | null> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        project_id,
        code_chunk_id,
        embedding,
        created_at
      FROM code_chunk_embeddings
      WHERE code_chunk_id = $1
      `,
      [codeChunkId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async deleteByCodeChunkId(codeChunkId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM code_chunk_embeddings
      WHERE code_chunk_id = $1
      `,
      [codeChunkId],
    );
  }

  async findSimilarByProjectId(input: {
    projectId: string;
    embedding: number[];
    limit: number;
  }): Promise<SimilarCodeChunk[]> {
    const result = await this.pool.query(
      `
    SELECT
      code_chunks.id AS code_chunk_id,
      code_chunks.project_id,
      code_chunks.project_file_id,
      project_files.path,
      code_chunks.content,
      code_chunks.start_line,
      code_chunks.end_line,
      code_chunks.chunk_index,
      code_chunk_embeddings.embedding <-> $2::vector AS distance
    FROM code_chunk_embeddings
    INNER JOIN code_chunks
      ON code_chunks.id = code_chunk_embeddings.code_chunk_id
    INNER JOIN project_files
      ON project_files.id = code_chunks.project_file_id
    WHERE code_chunk_embeddings.project_id = $1
    ORDER BY code_chunk_embeddings.embedding <-> $2::vector ASC
    LIMIT $3
    `,
      [input.projectId, this.toPostgresVector(input.embedding), input.limit],
    );

    return result.rows.map((row) => ({
      codeChunkId: row.code_chunk_id,
      projectId: row.project_id,
      projectFileId: row.project_file_id,
      path: row.path,
      content: row.content,
      startLine: row.start_line,
      endLine: row.end_line,
      index: row.chunk_index,
      distance: Number(row.distance),
    }));
  }

  private toDomain(row: {
    id: string;
    project_id: string;
    code_chunk_id: string;
    embedding: string | number[];
    created_at: Date;
  }): CodeChunkEmbedding {
    return {
      id: row.id,
      projectId: row.project_id,
      codeChunkId: row.code_chunk_id,
      embedding: this.fromPostgresVector(row.embedding),
      createdAt: row.created_at,
    };
  }

  private toPostgresVector(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
  }

  private fromPostgresVector(embedding: string | number[]): number[] {
    if (Array.isArray(embedding)) {
      return embedding;
    }

    return embedding
      .replace("[", "")
      .replace("]", "")
      .split(",")
      .map((value) => Number(value));
  }
}
