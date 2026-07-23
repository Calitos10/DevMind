import { User } from "../../domain/entities/user";
import { UserRepository } from "../../domain/repositories/userRepository";
import { PasswordHasher } from "../ports/passwordHasher";
import { TokenService } from "../ports/tokenService";
import { IdGenerator } from "../ports/idGenerator";

type CreateGuestUserOutput = {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

const MS_PER_HOUR = 60 * 60 * 1000;

export class CreateGuestUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly idGenerator: IdGenerator,
    private readonly guestTtlHours: number,
  ) {}

  async execute(): Promise<CreateGuestUserOutput> {
    const id = this.idGenerator.generate();
    const email = `guest-${id}@devmind.local`;

    // El invitado nunca inicia sesión con contraseña: se guarda el hash de un
    // valor aleatorio e inservible, para que nadie pueda autenticarse como él.
    const passwordHash = await this.passwordHasher.hash(
      this.idGenerator.generate(),
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.guestTtlHours * MS_PER_HOUR);

    const user = new User(id, "Invitado", email, passwordHash, now);

    await this.userRepository.saveGuest(user, expiresAt);

    const accessToken = await this.tokenService.sign({
      userId: id,
      email,
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
