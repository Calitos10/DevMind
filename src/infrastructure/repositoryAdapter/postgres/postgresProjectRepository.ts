import { Pool } from "pg";

import { Project } from "../../../domain/entities/project";
import { ProjectRepository } from "../../../domain/repositories/projectRepository";

type ProjectRow = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  created_at: Date;
};

export class PostgresProjectRepository implements ProjectRepository {
  constructor(private readonly pool: Pool) {}

  async save(project: Project): Promise<Project> {
    const result = await this.pool.query<ProjectRow>(
      `
      INSERT INTO projects (id, owner_id, name, description, created_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, owner_id, name, description, created_at
      `,
      [
        project.id,
        project.ownerId,
        project.name,
        project.description ?? null,
        project.createdAt,
      ],
    );

    return this.toDomain(result.rows[0]);
  }

  async findByOwnerId(ownerId: string): Promise<Project[]> {
    const result = await this.pool.query<ProjectRow>(
      `
      SELECT id, owner_id, name, description, created_at
      FROM projects
      WHERE owner_id = $1
      ORDER BY created_at ASC
      `,
      [ownerId],
    );

    return result.rows.map((row) => this.toDomain(row));
  }

  async findByIdAndOwnerId(
    id: string,
    ownerId: string,
  ): Promise<Project | null> {
    const result = await this.pool.query<ProjectRow>(
      `
      SELECT id, owner_id, name, description, created_at
      FROM projects
      WHERE id = $1 AND owner_id = $2
      `,
      [id, ownerId],
    );

    const row = result.rows[0];

    if (!row) {
      return null;
    }

    return this.toDomain(row);
  }

  async deleteByIdAndOwnerId(id: string, ownerId: string): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM projects
      WHERE id = $1 AND owner_id = $2
      `,
      [id, ownerId],
    );
  }

  private toDomain(row: ProjectRow): Project {
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? undefined,
      createdAt: row.created_at,
    };
  }
}