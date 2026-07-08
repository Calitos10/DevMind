import { Pool } from "pg";

import type { ProjectIndexingJob } from "../../../domain/entities/projectIndexingJob";
import type { ProjectIndexingJobRepository } from "../../../domain/repository/projectIndexingJobRepository";

export class PostgresProjectIndexingJobRepository
  implements ProjectIndexingJobRepository
{
  constructor(private readonly pool: Pool) {}

  async save(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    const result = await this.pool.query(
      `
      INSERT INTO project_indexing_jobs (
        id,
        project_id,
        status,
        total_chunks,
        processed_chunks,
        failed_chunks,
        error_message,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        project_id,
        status,
        total_chunks,
        processed_chunks,
        failed_chunks,
        error_message,
        created_at,
        updated_at
      `,
      [
        job.id,
        job.projectId,
        job.status,
        job.totalChunks,
        job.processedChunks,
        job.failedChunks,
        job.errorMessage ?? null,
        job.createdAt,
        job.updatedAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByProjectId(
    projectId: string,
  ): Promise<ProjectIndexingJob | null> {
    const result = await this.pool.query(
      `
      SELECT
        id,
        project_id,
        status,
        total_chunks,
        processed_chunks,
        failed_chunks,
        error_message,
        created_at,
        updated_at
      FROM project_indexing_jobs
      WHERE project_id = $1
      `,
      [projectId],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.toDomain(result.rows[0]);
  }

  async update(job: ProjectIndexingJob): Promise<ProjectIndexingJob> {
    const result = await this.pool.query(
      `
      UPDATE project_indexing_jobs
      SET
        status = $2,
        total_chunks = $3,
        processed_chunks = $4,
        failed_chunks = $5,
        error_message = $6,
        updated_at = $7
      WHERE id = $1
      RETURNING
        id,
        project_id,
        status,
        total_chunks,
        processed_chunks,
        failed_chunks,
        error_message,
        created_at,
        updated_at
      `,
      [
        job.id,
        job.status,
        job.totalChunks,
        job.processedChunks,
        job.failedChunks,
        job.errorMessage ?? null,
        job.updatedAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  private toDomain(row: {
    id: string;
    project_id: string;
    status: ProjectIndexingJob["status"];
    total_chunks: number;
    processed_chunks: number;
    failed_chunks: number;
    error_message: string | null;
    created_at: Date;
    updated_at: Date;
  }): ProjectIndexingJob {
    return {
      id: row.id,
      projectId: row.project_id,
      status: row.status,
      totalChunks: row.total_chunks,
      processedChunks: row.processed_chunks,
      failedChunks: row.failed_chunks,
      errorMessage: row.error_message ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}