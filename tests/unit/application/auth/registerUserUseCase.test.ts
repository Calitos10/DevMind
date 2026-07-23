import { describe, expect, it } from "vitest";

import { RegisterUserUseCase } from "../../../../src/application/auth/registerUserUseCase";
import { UserAlreadyExistsError } from "../../../../src/shared/errors/userAlreadyExistsError";
import { FakeIdGenerator } from "../../../fakes/fakeIdGenerator";
import { FakePasswordHasher } from "../../../fakes/fakePasswordHasher";
import { FakeUserRepository } from "../../../fakes/fakeUserRepository";

describe("RegisterUserUseCase", () => {
  it("should register a new user", async () => {
    const userRepository = new FakeUserRepository();
    const passwordHasher = new FakePasswordHasher();
    const idGenerator = new FakeIdGenerator("user-1");

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
  const userRepository = new FakeUserRepository();
  const passwordHasher = new FakePasswordHasher();
  const idGenerator = new FakeIdGenerator("user-1");

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
