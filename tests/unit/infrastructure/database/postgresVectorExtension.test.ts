import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";

describe("PostgreSQL vector extension", () => {
  it("has the vector extension enabled", async () => {
    const result = await postgresPool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM pg_extension
        WHERE extname = 'vector'
      ) AS enabled
    `);

    expect(result.rows[0].enabled).toBe(true);
  });
});
