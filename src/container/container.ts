//Imports para la parte de usuarios
import { GetCurrentUserUseCase } from "../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../application/auth/registerUserUseCase";
import { BcryptPasswordHasher } from "../infrastructure/authAdapters/bcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/authAdapters/jwtTokenService";
import { CryptoIdGenerator } from "../infrastructure/authAdapters/cryptoIdGenerator";
import { InMemoryUserRepository } from "../infrastructure/repositoryAdpater/inMemoryUserRepository";

//Imports para la parte de los proyectos
import { InMemoryProjectRepository } from "../infrastructure/repositoryAdpater/InMemoryProjectRepository";
import { CreateProjectUseCase } from "../application/projects/createProjectUseCase";
import { ListUserProjectsUseCase } from "../application/projects/listUserProjectsUseCase";
import { GetProjectByIdUseCase } from "../application/projects/getProjectByIdUseCase";
import { DeleteProjectUseCase } from "../application/projects/deleteProjectUseCase";

//Instanciamos los repositorios
const userRepository = new InMemoryUserRepository();
const projectRepository = new InMemoryProjectRepository();

//Instanciamos las implementaciones de puertos
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

  createProjectUseCase: new CreateProjectUseCase(
    projectRepository,
    idGenerator,
  ),

  listUserProjectsUseCase: new ListUserProjectsUseCase(projectRepository),

  getProjectByIdUseCase: new GetProjectByIdUseCase(projectRepository),

  deleteProjectUseCase: new DeleteProjectUseCase(projectRepository),

  tokenService,
};
