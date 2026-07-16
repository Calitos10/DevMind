import { User } from "../../domain/entities/user";
import { UserRepository } from "../../domain/repositories/userRepository";
import { IdGenerator } from "../ports/idGenerator";
import { PasswordHasher } from "../ports/passwordHasher";
import { UserAlreadyExistsError } from "../../shared/errors/userAlreadyExistsError";

type RegisterUserInput = {
  name: string;
  email: string;
  password: string;
};

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new UserAlreadyExistsError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = new User(
      this.idGenerator.generate(),
      input.name,
      input.email,
      passwordHash,
      new Date(),
    );

    return this.userRepository.save(user);
  }
}
