import "dotenv/config";

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not defined");
}

export const postgresPool = new Pool({
  connectionString,
});
