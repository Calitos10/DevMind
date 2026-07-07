import { beforeEach, describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresCodeChunkEmbeddingRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresCodeChunkEmbeddingRepository";

function createEmbedding(size: number): number[] {
  return Array.from({ length: size }, (_, index) => (index === 0 ? 0.1 : 0));
}

async function createCodeChunk() {
  await postgresPool.query(
    `
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [
      "user-code-chunk-embedding-repo-test",
      "User Code Chunk Embedding Repo Test",
      "code-chunk-embedding-repo-test@example.com",
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
      "project-code-chunk-embedding-repo-test",
      "user-code-chunk-embedding-repo-test",
      "Project Code Chunk Embedding Repo Test",
      "Project used to test code chunk embeddings repository",
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
      "project-file-code-chunk-embedding-repo-test",
      "project-code-chunk-embedding-repo-test",
      "src/index.ts",
      "typescript",
      "console.log('hello');",
      21,
      "hash-code-chunk-embedding-repo-test",
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
      "code-chunk-code-chunk-embedding-repo-test",
      "project-code-chunk-embedding-repo-test",
      "project-file-code-chunk-embedding-repo-test",
      "console.log('hello');",
      1,
      1,
      0,
      new Date(),
    ],
  );
}

describe("PostgresCodeChunkEmbeddingRepository", () => {
  beforeEach(async () => {
    await postgresPool.query(
      "TRUNCATE TABLE code_chunk_embeddings, code_chunks, project_files, projects, users RESTART IDENTITY CASCADE",
    );
  });

  it("saves and finds an embedding by code chunk id", async () => {
    await createCodeChunk();

    const repository = new PostgresCodeChunkEmbeddingRepository(postgresPool);

    const savedEmbedding = await repository.save({
      id: "embedding-1",
      projectId: "project-code-chunk-embedding-repo-test",
      codeChunkId: "code-chunk-code-chunk-embedding-repo-test",
      embedding: createEmbedding(768),
      createdAt: new Date(),
    });

    const foundEmbedding = await repository.findByCodeChunkId(
      "code-chunk-code-chunk-embedding-repo-test",
    );

    expect(savedEmbedding).toMatchObject({
      id: "embedding-1",
      projectId: "project-code-chunk-embedding-repo-test",
      codeChunkId: "code-chunk-code-chunk-embedding-repo-test",
    });

    expect(savedEmbedding.embedding).toHaveLength(768);
    expect(savedEmbedding.embedding[0]).toBeCloseTo(0.1);

    expect(foundEmbedding).not.toBeNull();

    expect(foundEmbedding).toMatchObject({
      id: "embedding-1",
      projectId: "project-code-chunk-embedding-repo-test",
      codeChunkId: "code-chunk-code-chunk-embedding-repo-test",
    });

    expect(foundEmbedding?.embedding).toHaveLength(768);
    expect(foundEmbedding?.embedding[0]).toBeCloseTo(0.1);
  });
  it("deletes an embedding by code chunk id", async () => {
    await createCodeChunk();

    const repository = new PostgresCodeChunkEmbeddingRepository(postgresPool);

    await repository.save({
      id: "embedding-1",
      projectId: "project-code-chunk-embedding-repo-test",
      codeChunkId: "code-chunk-code-chunk-embedding-repo-test",
      embedding: createEmbedding(768),
      createdAt: new Date(),
    });

    await repository.deleteByCodeChunkId(
      "code-chunk-code-chunk-embedding-repo-test",
    );

    const foundEmbedding = await repository.findByCodeChunkId(
      "code-chunk-code-chunk-embedding-repo-test",
    );

    expect(foundEmbedding).toBeNull();
  });
  it("deletes embeddings automatically when the code chunk is deleted", async () => {
    await createCodeChunk();

    const repository = new PostgresCodeChunkEmbeddingRepository(postgresPool);

    await repository.save({
      id: "embedding-1",
      projectId: "project-code-chunk-embedding-repo-test",
      codeChunkId: "code-chunk-code-chunk-embedding-repo-test",
      embedding: createEmbedding(768),
      createdAt: new Date(),
    });

    await postgresPool.query(
      `
    DELETE FROM code_chunks
    WHERE id = $1
    `,
      ["code-chunk-code-chunk-embedding-repo-test"],
    );

    const foundEmbedding = await repository.findByCodeChunkId(
      "code-chunk-code-chunk-embedding-repo-test",
    );

    expect(foundEmbedding).toBeNull();
  });
});
