import { describe, expect, it } from "vitest";
import { RegisterUserUseCase } from "../../../../src/application/auth/registerUserUseCase";
import { UserRepository } from "../../../../src/domain/repository/userRepository";
import { User } from "../../../../src/domain/entities/user";
import { PasswordHasher } from "../../../../src/application/ports/passwordHasherPort";
import { IdGenerator } from "../../../../src/application/ports/idGeneratorPort";
import { UserAlreadyExistsError } from "../../../../src/shared/errors/user-already-exists.error";

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

class FakeIdGenerator implements IdGenerator {
  generate(): string {
    return "user-1";
  }
}

describe("RegisterUserUseCase", () => {
  it("should register a new user", async () => {
    const userRepository = new InMemoryUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const idGenerator = new FakeIdGenerator();

    const registerUserUseCase = new RegisterUserUseCase(
      userRepository,
      passwordHasher,
      idGenerator,
    );

    const user = await registerUserUseCase.execute({
      name: "Carlos",
      email: "carlos@example.com",
      password: "123456",
    });

    expect(user.id).toBe("user-1");
    expect(user.name).toBe("Carlos");
    expect(user.email).toBe("carlos@example.com");
    expect(user.passwordHash).toBe("hashed-123456");
    expect(userRepository.users).toHaveLength(1);
  });
});

it("should not register a user with an already used email", async () => {
  const userRepository = new InMemoryUserRepository();
  const passwordHasher = new FakePasswordHasher();
  const idGenerator = new FakeIdGenerator();

  const registerUserUseCase = new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    idGenerator,
  );

  await registerUserUseCase.execute({
    name: "Carlos",
    email: "carlos@example.com",
    password: "123456",
  });

  await expect(
    registerUserUseCase.execute({
      name: "Carlos 2",
      email: "carlos@example.com",
      password: "abcdef",
    }),
  ).rejects.toBeInstanceOf(UserAlreadyExistsError);

  expect(userRepository.users).toHaveLength(1);
});
