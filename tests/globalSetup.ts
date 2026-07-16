import fs from "fs/promises";
import path from "path";

import { Pool } from "pg";

const truncateTables = async (pool: Pool) => {
  await pool.query(`
    TRUNCATE TABLE conversation_entries, project_indexing_jobs, code_chunk_embeddings, code_chunks, project_files, projects, users RESTART IDENTITY CASCADE;
  `);
};

const runMigrations = async (pool: Pool) => {
  const migrationsDir = path.join(
    process.cwd(),
    "src",
    "infrastructure",
    "database",
    "migrations",
  );

  const migrationFiles = await fs.readdir(migrationsDir);

  const sortedMigrationFiles = migrationFiles
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const migrationFile of sortedMigrationFiles) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    const sql = await fs.readFile(migrationPath, "utf-8");

    await pool.query(sql);
  }
};

export default async function globalSetup() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required for tests");
  }

  if (!connectionString.includes("devmind_test_db")) {
    throw new Error(
      "Tests must run against devmind_test_db. Refusing to truncate another database.",
    );
  }

  const pool = new Pool({
    connectionString,
  });

  await runMigrations(pool);
  await truncateTables(pool);
  await pool.end();

  return async () => {
    const teardownPool = new Pool({
      connectionString,
    });

    await truncateTables(teardownPool);
    await teardownPool.end();
  };
}
