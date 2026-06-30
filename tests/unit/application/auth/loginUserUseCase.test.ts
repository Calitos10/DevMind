import { describe, expect, it } from "vitest";

import { LoginUserUseCase } from "../../../../src/application/auth/loginUserUseCase";
import {
  TokenPayload,
  TokenService,
} from "../../../../src/application/ports/tokenService";
import { User } from "../../../../src/domain/entities/user";
import { InvalidCredentialsError } from "../../../../src/shared/errors/invalid-credentials.error";
import { FakePasswordHasher } from "../../../fakes/fakePasswordHasher";
import { FakeUserRepository } from "../../../fakes/fakeUserRepository";

class FakeTokenService implements TokenService {
  async sign(payload: TokenPayload): Promise<string> {
    return `token-for-${payload.userId}`;
  }

  async verify(token: string): Promise<TokenPayload> {
    const userId = token.replace("token-for-", "");

    return {
      userId,
      email: "carlos@example.com",
    };
  }
}

describe("LoginUserUseCase", () => {
  it("should login a user with valid credentials", async () => {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenService = new FakeTokenService();

    await userRepository.save(
      new User(
        "user-1",
        "Carlos",
        "carlos@example.com",
        "hashed-123456",
        new Date("2026-01-01"),
      ),
    );

    const loginUserUseCase = new LoginUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
    );

    const result = await loginUserUseCase.execute({
      email: "carlos@example.com",
      password: "123456",
    });

    expect(result.accessToken).toBe("token-for-user-1");
    expect(result.user).toEqual({
      id: "user-1",
      name: "Carlos",
      email: "carlos@example.com",
    });
  });

  it("should not login when email does not exist", async () => {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenService = new FakeTokenService();

    const loginUserUseCase = new LoginUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
    );

    await expect(
      loginUserUseCase.execute({
        email: "unknown@example.com",
        password: "123456",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("should not login when password is invalid", async () => {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenService = new FakeTokenService();

    await userRepository.save(
      new User(
        "user-1",
        "Carlos",
        "carlos@example.com",
        "hashed-123456",
        new Date("2026-01-01"),
      ),
    );

    const loginUserUseCase = new LoginUserUseCase(
      userRepository,
      passwordHasher,
      tokenService,
    );

    await expect(
      loginUserUseCase.execute({
        email: "carlos@example.com",
        password: "wrong-password",
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
