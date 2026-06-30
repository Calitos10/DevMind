import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../../../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";

describe("PostgresUserRepository", () => {
  it("should save and find a user by email and id", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);

    const userId = randomUUID();
    const email = `user-${userId}@example.com`;

    const createdUser = await userRepository.save({
      id: userId,
      name: "User One",
      email,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    expect(createdUser).toEqual({
      id: userId,
      name: "User One",
      email,
      passwordHash: "hashed-password",
      createdAt: expect.any(Date),
    });

    const userByEmail = await userRepository.findByEmail(email);

    expect(userByEmail).toEqual(createdUser);

    const userById = await userRepository.findById(createdUser.id);

    expect(userById).toEqual(createdUser);
  });

  it("should return null when user does not exist", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);

    const missingUserByEmail = await userRepository.findByEmail(
      "missing-user@example.com",
    );

    const missingUserById = await userRepository.findById("missing-user-id");

    expect(missingUserByEmail).toBeNull();
    expect(missingUserById).toBeNull();
  });
});