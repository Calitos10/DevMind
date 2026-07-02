import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";

describe("PostgreSQL connection", () => {
  it("should connect to PostgreSQL and return the database version", async () => {
    const result = await postgresPool.query<{ version: string }>(
      "SELECT version();",
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].version).toContain("PostgreSQL");
  });
});
