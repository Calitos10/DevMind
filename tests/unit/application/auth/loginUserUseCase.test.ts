import { describe, expect, it } from "vitest";
import { LoginUserUseCase } from "../../../../src/application/auth/loginUserUseCase";
import { PasswordHasher } from "../../../../src/application/ports/passwordHasherPort";
import {
  TokenPayload,
  TokenService,
} from "../../../../src/application/ports/tokenService";
import { User } from "../../../../src/domain/entities/user";
import { UserRepository } from "../../../../src/domain/repository/userRepository";
import { InvalidCredentialsError } from "../../../../src/shared/errors/invalid-credentials.error";

class InMemoryUserRepository implements UserRepository {
  public users: User[] = [];

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
}

class FakePasswordHasher implements PasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return `hashed-${plainPassword}`;
  }

  async compare(plainPassword: string, passwordHash: string): Promise<boolean> {
    return passwordHash === `hashed-${plainPassword}`;
  }
}

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
    const userRepository = new InMemoryUserRepository();
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
    const userRepository = new InMemoryUserRepository();
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
    const userRepository = new InMemoryUserRepository();
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
