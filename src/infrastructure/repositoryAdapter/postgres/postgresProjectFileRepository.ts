import { Pool } from "pg";

import { ProjectFile } from "../../../domain/entities/projectFile";
import { ProjectFileRepository } from "../../../domain/repository/projectFileRepository";

type ProjectFileRow = {
  id: string;
  project_id: string;
  path: string;
  language: string;
  content: string;
  size: number;
  hash: string;
  created_at: Date;
};

export class PostgresProjectFileRepository implements ProjectFileRepository {
  constructor(private readonly pool: Pool) {}

  async save(projectFile: ProjectFile): Promise<ProjectFile> {
    const result = await this.pool.query<ProjectFileRow>(
      `
      INSERT INTO project_files (
        id,
        project_id,
        path,
        language,
        content,
        size,
        hash,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, project_id, path, language, content, size, hash, created_at
      `,
      [
        projectFile.id,
        projectFile.projectId,
        projectFile.path,
        projectFile.language,
        projectFile.content,
        projectFile.size,
        projectFile.hash,
        projectFile.createdAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByProjectId(projectId: string): Promise<ProjectFile[]> {
    const result = await this.pool.query<ProjectFileRow>(
      `
      SELECT id, project_id, path, language, content, size, hash, created_at
      FROM project_files
      WHERE project_id = $1
      ORDER BY created_at ASC
      `,
      [projectId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findByIdAndProjectId(
    id: string,
    projectId: string,
  ): Promise<ProjectFile | null> {
    const result = await this.pool.query<ProjectFileRow>(
      `
      SELECT id, project_id, path, language, content, size, hash, created_at
      FROM project_files
      WHERE id = $1 AND project_id = $2
      `,
      [id, projectId],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async deleteByIdAndProjectId(id: string, projectId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM project_files
      WHERE id = $1 AND project_id = $2
      `,
      [id, projectId],
    );
  }

  async update(projectFile: ProjectFile): Promise<ProjectFile> {
    const result = await this.pool.query(
      `
    UPDATE project_files
    SET
      path = $1,
      language = $2,
      content = $3,
      size = $4,
      hash = $5
    WHERE id = $6
      AND project_id = $7
    RETURNING
      id,
      project_id,
      path,
      language,
      content,
      size,
      hash,
      created_at
    `,
      [
        projectFile.path,
        projectFile.language,
        projectFile.content,
        projectFile.size,
        projectFile.hash,
        projectFile.id,
        projectFile.projectId,
      ],
    );

    const row = result.rows[0];

    return {
      id: row.id,
      projectId: row.project_id,
      path: row.path,
      language: row.language,
      content: row.content,
      size: row.size,
      hash: row.hash,
      createdAt: row.created_at,
    };
  }

  private toDomain(row: ProjectFileRow): ProjectFile {
    return {
      id: row.id,
      projectId: row.project_id,
      path: row.path,
      language: row.language,
      content: row.content,
      size: row.size,
      hash: row.hash,
      createdAt: row.created_at,
    };
  }
}
