import { randomUUID } from "crypto";

import { describe, expect, it } from "vitest";

import { postgresPool } from "../../../../src/infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresUserRepository";
import { PostgresProjectRepository } from "../../../../src/infrastructure/repositoryAdapter/postgres/postgresProjectRepository";

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

  it("saves a guest user and deletes it (with its data) once expired", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);
    const projectRepository = new PostgresProjectRepository(postgresPool);

    const guestId = randomUUID();
    const expiresInThePast = new Date(Date.now() - 60 * 1000);

    await userRepository.saveGuest(
      {
        id: guestId,
        name: "Invitado",
        email: `guest-${guestId}@devmind.local`,
        passwordHash: "unusable-hash",
        createdAt: new Date(),
      },
      expiresInThePast,
    );

    // El invitado tiene un proyecto: al borrar el usuario, debe irse en cascada.
    const projectId = randomUUID();
    await projectRepository.save({
      id: projectId,
      ownerId: guestId,
      name: "Guest project",
      description: "Temporal",
      createdAt: new Date(),
    });

    const deletedCount = await userRepository.deleteExpiredGuests(new Date());

    expect(deletedCount).toBeGreaterThanOrEqual(1);
    expect(await userRepository.findById(guestId)).toBeNull();
    expect(
      await projectRepository.findByIdAndOwnerId(projectId, guestId),
    ).toBeNull();
  });

  it("keeps non-expired guests and registered users when purging", async () => {
    const userRepository = new PostgresUserRepository(postgresPool);

    const activeGuestId = randomUUID();
    const expiresInTheFuture = new Date(Date.now() + 60 * 60 * 1000);

    await userRepository.saveGuest(
      {
        id: activeGuestId,
        name: "Invitado",
        email: `guest-${activeGuestId}@devmind.local`,
        passwordHash: "unusable-hash",
        createdAt: new Date(),
      },
      expiresInTheFuture,
    );

    const registeredId = randomUUID();
    await userRepository.save({
      id: registeredId,
      name: "Registrado",
      email: `registered-${registeredId}@example.com`,
      passwordHash: "hashed-password",
      createdAt: new Date(),
    });

    await userRepository.deleteExpiredGuests(new Date());

    expect(await userRepository.findById(activeGuestId)).not.toBeNull();
    expect(await userRepository.findById(registeredId)).not.toBeNull();
  });
});
