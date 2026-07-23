import { beforeEach, describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresCodeChunkEmbeddingRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresCodeChunkEmbeddingRepository";

function createEmbedding(size: number): number[] {
  return Array.from({ length: size }, (_, index) => (index === 0 ? 0.1 : 0));
}

function createEmbeddingWithFirstValue(firstValue: number): number[] {
  return Array.from({ length: 768 }, (_, index) =>
    index === 0 ? firstValue : 0,
  );
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

async function createCodeChunkWithIds(input: {
  userId: string;
  userEmail: string;
  projectId: string;
  projectFileId: string;
  codeChunkId: string;
  path: string;
  content: string;
}) {
  await postgresPool.query(
    `
    INSERT INTO users (id, name, email, password_hash, created_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      input.userId,
      "User Similarity Test",
      input.userEmail,
      "hashed-password",
      new Date(),
    ],
  );

  await postgresPool.query(
    `
    INSERT INTO projects (id, owner_id, name, description, created_at)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (id) DO NOTHING
    `,
    [
      input.projectId,
      input.userId,
      "Project Similarity Test",
      "Project used to test semantic search",
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
      input.projectFileId,
      input.projectId,
      input.path,
      "typescript",
      input.content,
      Buffer.byteLength(input.content, "utf8"),
      `${input.codeChunkId}-hash`,
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
      input.codeChunkId,
      input.projectId,
      input.projectFileId,
      input.content,
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

  it("finds similar code chunks by project id", async () => {
    const repository = new PostgresCodeChunkEmbeddingRepository(postgresPool);

    await createCodeChunkWithIds({
      userId: "user-similarity-1",
      userEmail: "user-similarity-1@example.com",
      projectId: "project-similarity-1",
      projectFileId: "project-file-similarity-1",
      codeChunkId: "code-chunk-similarity-close",
      path: "src/close.ts",
      content: "export function registerUser() {}",
    });

    await createCodeChunkWithIds({
      userId: "user-similarity-1",
      userEmail: "user-similarity-1@example.com",
      projectId: "project-similarity-1",
      projectFileId: "project-file-similarity-2",
      codeChunkId: "code-chunk-similarity-far",
      path: "src/far.ts",
      content: "export function deleteInvoice() {}",
    });

    await createCodeChunkWithIds({
      userId: "user-similarity-2",
      userEmail: "user-similarity-2@example.com",
      projectId: "project-similarity-2",
      projectFileId: "project-file-similarity-3",
      codeChunkId: "code-chunk-other-project",
      path: "src/other-project.ts",
      content: "export function registerUserFromOtherProject() {}",
    });

    await repository.save({
      id: "embedding-close",
      projectId: "project-similarity-1",
      codeChunkId: "code-chunk-similarity-close",
      embedding: createEmbeddingWithFirstValue(0.9),
      createdAt: new Date(),
    });

    await repository.save({
      id: "embedding-far",
      projectId: "project-similarity-1",
      codeChunkId: "code-chunk-similarity-far",
      embedding: createEmbeddingWithFirstValue(0.1),
      createdAt: new Date(),
    });

    await repository.save({
      id: "embedding-other-project",
      projectId: "project-similarity-2",
      codeChunkId: "code-chunk-other-project",
      embedding: createEmbeddingWithFirstValue(1),
      createdAt: new Date(),
    });

    const results = await repository.findSimilarByProjectId({
      projectId: "project-similarity-1",
      embedding: createEmbeddingWithFirstValue(1),
      limit: 2,
    });

    expect(results).toHaveLength(2);

    expect(results[0]).toMatchObject({
      codeChunkId: "code-chunk-similarity-close",
      projectId: "project-similarity-1",
      projectFileId: "project-file-similarity-1",
      path: "src/close.ts",
      content: "export function registerUser() {}",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(results[1]).toMatchObject({
      codeChunkId: "code-chunk-similarity-far",
      projectId: "project-similarity-1",
      projectFileId: "project-file-similarity-2",
      path: "src/far.ts",
      content: "export function deleteInvoice() {}",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(
      results.some(
        (result) => result.codeChunkId === "code-chunk-other-project",
      ),
    ).toBe(false);
  });
});
