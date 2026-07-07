import { describe, expect, it } from "vitest";
import { GetCurrentUserUseCase } from "../../../../src/application/auth/getCurrentUserUseCase";
import { User } from "../../../../src/domain/entities/user";
import { UserRepository } from "../../../../src/domain/repository/userRepository";
import { UserNotFoundError } from "../../../../src/shared/errors/userNotFoundError";

class InMemoryUserRepository implements UserRepository {
  public users: User[] = [];

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }
}

describe("GetCurrentUserUseCase", () => {
  it("should return the current user", async () => {
    const userRepository = new InMemoryUserRepository();

    await userRepository.save(
      new User(
        "user-1",
        "Carlos",
        "carlos@example.com",
        "hashed-123456",
        new Date("2026-01-01"),
      ),
    );

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

    const user = await getCurrentUserUseCase.execute({
      userId: "user-1",
    });

    expect(user).toEqual({
      id: "user-1",
      name: "Carlos",
      email: "carlos@example.com",
    });
  });

  it("should throw when user does not exist", async () => {
    const userRepository = new InMemoryUserRepository();

    const getCurrentUserUseCase = new GetCurrentUserUseCase(userRepository);

    await expect(
      getCurrentUserUseCase.execute({
        userId: "unknown-user",
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});