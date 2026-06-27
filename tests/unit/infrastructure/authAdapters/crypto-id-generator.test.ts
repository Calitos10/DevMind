import { describe, expect, it } from "vitest";
import { CryptoIdGenerator } from "../../../../src/infrastructure/authAdapters/cryptoIdGenerator";

describe("CryptoIdGenerator", () => {
  it("should generate a UUID", () => {
    const idGenerator = new CryptoIdGenerator();

    const id = idGenerator.generate();

    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it("should generate different IDs", () => {
    const idGenerator = new CryptoIdGenerator();

    const firstId = idGenerator.generate();
    const secondId = idGenerator.generate();

    expect(firstId).not.toBe(secondId);
  });
});
