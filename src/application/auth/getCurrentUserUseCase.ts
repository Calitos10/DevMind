import { UserRepository } from "../../domain/repository/userRepository";
import { UserNotFoundError } from "../../shared/errors/userNotFoundError";

type GetCurrentUserInput = {
  userId: string;
};

type GetCurrentUserOutput = {
  id: string;
  name: string;
  email: string;
};

export class GetCurrentUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: GetCurrentUserInput): Promise<GetCurrentUserOutput> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new UserNotFoundError();
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
    };
  }
}
