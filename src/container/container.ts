import { GetCurrentUserUseCase } from "../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../application/auth/registerUserUseCase";
import { BcryptPasswordHasher } from "../infrastructure/authAdapters/bcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/authAdapters/jwtTokenService";
import { CryptoIdGenerator } from "../infrastructure/authAdapters/cryptoIdGenerator";
import { InMemoryUserRepository } from "../infrastructure/repositoryAdpater/inMemoryUserRepository";

const userRepository = new InMemoryUserRepository();

const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const idGenerator = new CryptoIdGenerator();

export const container = {
  userRepository,

  registerUserUseCase: new RegisterUserUseCase(
    userRepository,
    passwordHasher,
    idGenerator,
  ),

  loginUserUseCase: new LoginUserUseCase(
    userRepository,
    passwordHasher,
    tokenService,
  ),

  getCurrentUserUseCase: new GetCurrentUserUseCase(userRepository),

  tokenService,
};