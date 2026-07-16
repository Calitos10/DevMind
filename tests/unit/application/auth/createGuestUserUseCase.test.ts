import { describe, expect, it } from "vitest";

import { CreateGuestUserUseCase } from "../../../../src/application/auth/createGuestUserUseCase";
import { FakeUserRepository } from "../../../fakes/fakeUserRepository";
import { FakePasswordHasher } from "../../../fakes/fakePasswordHasher";
import { FakeTokenService } from "../../../fakes/fakeTokenService";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";

describe("CreateGuestUserUseCase", () => {
  it("creates a temporary guest user and returns an access token", async () => {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenService = new FakeTokenService();
    const idGenerator = new FakeIdGenerator("abc-123");
    const guestTtlHours = 24;

    const useCase = new CreateGuestUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
      idGenerator,
      guestTtlHours,
    );

    const result = await useCase.execute();

    // Devuelve el token (firmado con el id del invitado) y el usuario público.
    expect(result).toEqual({
      accessToken: "token-for-abc-123",
      user: {
        id: "abc-123",
        name: "Invitado",
        email: "guest-abc-123@devmind.local",
      },
    });

    // Se ha guardado como invitado, con caducidad = createdAt + TTL.
    expect(userRepository.savedGuests).toHaveLength(1);

    const savedGuest = userRepository.savedGuests[0];

    expect(savedGuest.user).toMatchObject({
      id: "abc-123",
      name: "Invitado",
      email: "guest-abc-123@devmind.local",
    });
    expect(savedGuest.user.passwordHash).toBeTruthy();

    const ttlMs = guestTtlHours * 60 * 60 * 1000;
    expect(
      savedGuest.expiresAt.getTime() - savedGuest.user.createdAt.getTime(),
    ).toBe(ttlMs);

    // El invitado queda persistido y recuperable por email dentro de la sesión.
    const storedUser = await userRepository.findByEmail(
      "guest-abc-123@devmind.local",
    );
    expect(storedUser?.id).toBe("abc-123");
  });
});
