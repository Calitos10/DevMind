import { beforeEach, describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";

function createEmbeddingVector(size: number): string {
  const values = Array.from({ length: size }, (_, index) =>
    index === 0 ? "0.1" : "0",
  );

  return `[${values.join(",")}]`;
}

describe("code_chunk_embeddings table", () => {
  beforeEach(async () => {
    await postgresPool.query(
      "TRUNCATE TABLE code_chunk_embeddings, code_chunks, project_files, projects, users RESTART IDENTITY CASCADE",
    );
  });
  it("stores an embedding associated with a code chunk", async () => {
    await postgresPool.query(
      `
      INSERT INTO users (id, name, email, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "user-embedding-test",
        "User Embedding Test",
        "embedding-test@example.com",
        "hashed-password",
        new Date(),
      ],
    );

    await postgresPool.query(
      `
      INSERT INTO projects (id, owner_id, name, description, created_at)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "project-embedding-test",
        "user-embedding-test",
        "Project Embedding Test",
        "Project used to test embeddings",
        new Date(),
      ],
    );

    await postgresPool.query(
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
      `,
      [
        "project-file-embedding-test",
        "project-embedding-test",
        "src/index.ts",
        "typescript",
        "console.log('hello');",
        21,
        "hash-embedding-test",
        new Date(),
      ],
    );

    await postgresPool.query(
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
      `,
      [
        "code-chunk-embedding-test",
        "project-embedding-test",
        "project-file-embedding-test",
        "console.log('hello');",
        1,
        1,
        0,
        new Date(),
      ],
    );

    const embedding = createEmbeddingVector(768);

    await postgresPool.query(
      `
      INSERT INTO code_chunk_embeddings (
        id,
        project_id,
        code_chunk_id,
        embedding,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "embedding-1",
        "project-embedding-test",
        "code-chunk-embedding-test",
        embedding,
        new Date(),
      ],
    );

    const result = await postgresPool.query(
      `
      SELECT
        id,
        project_id,
        code_chunk_id,
        vector_dims(embedding) AS dimensions
      FROM code_chunk_embeddings
      WHERE code_chunk_id = $1
      `,
      ["code-chunk-embedding-test"],
    );

    expect(result.rows).toHaveLength(1);

    expect(result.rows[0]).toMatchObject({
      id: "embedding-1",
      project_id: "project-embedding-test",
      code_chunk_id: "code-chunk-embedding-test",
      dimensions: 768,
    });
  });
});
