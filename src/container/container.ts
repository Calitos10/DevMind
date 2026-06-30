//Imports para la parte de usuarios
import { GetCurrentUserUseCase } from "../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../application/auth/registerUserUseCase";
import { BcryptPasswordHasher } from "../infrastructure/authAdapters/bcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/authAdapters/jwtTokenService";
import { CryptoIdGenerator } from "../infrastructure/authAdapters/cryptoIdGenerator";
import { InMemoryUserRepository } from "../infrastructure/repositoryAdapter/inMemoryUserRepository";

//Imports para la parte de los proyectos
import { InMemoryProjectRepository } from "../infrastructure/repositoryAdapter/inMemoryProjectRepository";
import { CreateProjectUseCase } from "../application/projects/createProjectUseCase";
import { ListUserProjectsUseCase } from "../application/projects/listUserProjectsUseCase";
import { GetProjectByIdUseCase } from "../application/projects/getProjectByIdUseCase";
import { DeleteProjectUseCase } from "../application/projects/deleteProjectUseCase";

//Imports para la parte de archivos
import { InMemoryProjectFileRepository } from "../infrastructure/repositoryAdapter/inMemoryProjectFileRepository";
import { CryptoFileHashGenerator } from "../infrastructure/fileAdapter/cryptoFileHashGenerator";
import { CreateProjectFileUseCase } from "../application/projectFiles/createProjectFileUseCase";
import { DeleteProjectFileUseCase } from "../application/projectFiles/deleteProjectFileUseCase";
import { GetProjectFileByIdUseCase } from "../application/projectFiles/getProjectFileByIdUseCase";
import { ListProjectFilesUseCase } from "../application/projectFiles/listProjectFilesUseCase";

//Instanciamos los repositorios
const userRepository = new InMemoryUserRepository();
const projectRepository = new InMemoryProjectRepository();
const projectFileRepository = new InMemoryProjectFileRepository();

//Instanciamos las implementaciones de puertos
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const idGenerator = new CryptoIdGenerator();
const fileHashGenerator = new CryptoFileHashGenerator();

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

  createProjectFileUseCase: new CreateProjectFileUseCase(
    projectRepository,
    projectFileRepository,
    idGenerator,
    fileHashGenerator,
  ),

  listProjectFilesUseCase: new ListProjectFilesUseCase(
    projectRepository,
    projectFileRepository,
  ),

  getProjectFileByIdUseCase: new GetProjectFileByIdUseCase(
    projectRepository,
    projectFileRepository,
  ),

  deleteProjectFileUseCase: new DeleteProjectFileUseCase(
    projectRepository,
    projectFileRepository,
  ),

  tokenService,
};
