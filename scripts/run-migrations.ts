import "dotenv/config";

import fs from "fs/promises";
import path from "path";

import { postgresPool } from "../src/infrastructure/database/postgresPool";

async function main() {
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

    console.log(`Running migration: ${migrationFile}`);
    await postgresPool.query(sql);
  }

  console.log("Migrations completed successfully");

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("Migrations failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});