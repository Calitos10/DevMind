//[IMPORTS PARA LA PARTE DE USUARIOS]
import { GetCurrentUserUseCase } from "../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../application/auth/registerUserUseCase";
import { BcryptPasswordHasher } from "../infrastructure/authAdapters/bcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/authAdapters/jwtTokenService";
import { CryptoIdGenerator } from "../infrastructure/authAdapters/cryptoIdGenerator";
//Imports de Repositorio Postgre
import { postgresPool } from "../infrastructure/database/postgresPool";
import { PostgresUserRepository } from "../infrastructure/repositoryAdapter/postgres/postgresUserRepository";
//Import de Repositorio en Memoria
//import { InMemoryUserRepository } from "../infrastructure/repositoryAdapter/inMemory/inMemoryUserRepository";




//[IMPORTS PARA LA PARTE DE PROYECTOS]
import { CreateProjectUseCase } from "../application/projects/createProjectUseCase";
import { ListUserProjectsUseCase } from "../application/projects/listUserProjectsUseCase";
import { GetProjectByIdUseCase } from "../application/projects/getProjectByIdUseCase";
import { DeleteProjectUseCase } from "../application/projects/deleteProjectUseCase";
//Import de repositorio en Postgres
import { PostgresProjectRepository } from "../infrastructure/repositoryAdapter/postgres/postgresProjectRepository";
//Import de repositorio en memmoria
//import { InMemoryProjectRepository } from "../infrastructure/repositoryAdapter/inMemory/inMemoryProjectRepository";





//[IMPORTS PARA LA PARTE DE ARCHIVOS]
import { CryptoFileHashGenerator } from "../infrastructure/fileAdapter/cryptoFileHashGenerator";
import { CreateProjectFileUseCase } from "../application/projectFiles/createProjectFileUseCase";
import { DeleteProjectFileUseCase } from "../application/projectFiles/deleteProjectFileUseCase";
import { GetProjectFileByIdUseCase } from "../application/projectFiles/getProjectFileByIdUseCase";
import { ListProjectFilesUseCase } from "../application/projectFiles/listProjectFilesUseCase";
//Import de repositorio de postgres
import { PostgresProjectFileRepository } from "../infrastructure/repositoryAdapter/postgres/postgresProjectFileRepository";
//Import de repositorio de memoria
//import { InMemoryProjectFileRepository } from "../infrastructure/repositoryAdapter/inMemory/inMemoryProjectFileRepository";




//[INSTANCIAMOS LOS REPOSITORIOS]

//Repositorios en memoria
//const userRepository = new InMemoryUserRepository();
//const projectRepository = new InMemoryProjectRepository();
//const projectFileRepository = new InMemoryProjectFileRepository();

//Repositorios en Postgres
const userRepository = new PostgresUserRepository(postgresPool);
const projectRepository = new PostgresProjectRepository(postgresPool);
const projectFileRepository = new PostgresProjectFileRepository(postgresPool);




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
