import { UserRepository } from "../../domain/repository/userRepository";
import { InvalidCredentialsError } from "../../shared/errors/invalid-credentials.error";
import { PasswordHasher } from "../ports/passwordHasherPort";
import { TokenService } from "../ports/tokenService";

type LoginUserInput = {
  email: string;
  password: string;
};

type LoginUserOutput = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const accessToken = await this.tokenService.sign({
      userId: user.id,
      email: user.email,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }
}
