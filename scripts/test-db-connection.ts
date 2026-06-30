import "dotenv/config";

import { postgresPool } from "../src/infrastructure/database/postgresPool";

async function main() {
  const result = await postgresPool.query("SELECT version();");

  console.log("PostgreSQL connection OK");
  console.log(result.rows[0].version);

  await postgresPool.end();
}

main().catch(async (error) => {
  console.error("PostgreSQL connection failed");
  console.error(error);

  await postgresPool.end();

  process.exit(1);
});