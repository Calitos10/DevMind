import { describe, expect, it } from "vitest";
import { BcryptPasswordHasher } from "../../../../src/infrastructure/authAdapters/bcryptPasswordHasher";

describe("BcryptPasswordHasher", () => {
  it("should hash a plain password", async () => {
    const passwordHasher = new BcryptPasswordHasher();

    const passwordHash = await passwordHasher.hash("123456");

    expect(passwordHash).not.toBe("123456");
    expect(passwordHash.length).toBeGreaterThan(20);
  });

  it("should compare a valid password", async () => {
    const passwordHasher = new BcryptPasswordHasher();

    const passwordHash = await passwordHasher.hash("123456");

    const isValid = await passwordHasher.compare("123456", passwordHash);

    expect(isValid).toBe(true);
  });

  it("should reject an invalid password", async () => {
    const passwordHasher = new BcryptPasswordHasher();

    const passwordHash = await passwordHasher.hash("123456");

    const isValid = await passwordHasher.compare("wrong-password", passwordHash);

    expect(isValid).toBe(false);
  });
});