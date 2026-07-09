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




//[IMPORTS PARA LA PARTE DE SUBIR ZIP]
import { AdmZipExtractor } from "../infrastructure/uploadZipAdapter/admZipExtractor";
import { UploadProjectZipUseCase } from "../application/uploadZip/uploadProjectZipUseCase";




//[IMPORTS PARA LA PARTE DE GENERAR CHUNKS]
import { PostgresCodeChunkRepository } from "../infrastructure/repositoryAdapter/postgres/postgresCodeChunkRepository";
import { LineCodeChunker } from "../application/codeChunk/lineCodeChunker";
import { GenerateCodeChunksForProjectFileUseCase } from "../application/codeChunk/generateCodeChunksForProjectFileUseCase";




//[IMPORTS PARA LA PARTE DE GENERAR EMDEDDING]
import { PostgresCodeChunkEmbeddingRepository } from "../infrastructure/repositoryAdapter/postgres/postgresCodeChunkEmbeddingRepository";
import { GenkitEmbeddingGenerator } from "../infrastructure/genkit/genkitEmbeddingGenerator";
import { GenerateEmbeddingForCodeChunkUseCase } from "../application/codeChunkEmbeddings/generateEmbeddingForCodeChunkUseCase";




//IMPORT DEL CASO DE USO QUE USA LA GENERACION DE EMBEDDINGS 
import { PostgresProjectIndexingJobRepository } from "../infrastructure/repositoryAdapter/postgres/postgresProjectIndexingJobRepository";
import { IndexProjectEmbeddingsUseCase } from "../application/indexing/indexProjectEmbeddingsUseCase";
import { GetProjectIndexingStatusUseCase } from "../application/indexing/getProjectIndexingStatusUseCase";
import { TimeoutDelay } from "../infrastructure/timeDelayAdapter/timeoutDelay";
import { env } from "../infrastructure/config/env";
import { AsyncProjectIndexingScheduler } from "../infrastructure/indexingAdapter/asyncProjectIndexingScheduler";
import { NoopProjectIndexingScheduler } from "../infrastructure/indexingAdapter/noopProjectIndexingScheduler";




//IMPORTS PARA LA PARTE DE LAS PREGUNTAS
import type { AnswerGenerator } from "../application/ports/answerGenerator";
import { AskProjectQuestionUseCase } from "../application/projectQuestions/askProjectQuestionUseCase";
import { GenkitAnswerGenerator } from "../infrastructure/genkit/genkitAnswerGenerator";
import { TestAnswerGenerator } from "../infrastructure/genkit/testing/testAnswerGenerator";




//[INSTANCIAMOS LOS REPOSITORIOS]

//Repositorios en memoria
//const userRepository = new InMemoryUserRepository();
//const projectRepository = new InMemoryProjectRepository();
//const projectFileRepository = new InMemoryProjectFileRepository();

//Repositorios en Postgres
const userRepository = new PostgresUserRepository(postgresPool);
const projectRepository = new PostgresProjectRepository(postgresPool);
const projectFileRepository = new PostgresProjectFileRepository(postgresPool);
const codeChunkRepository = new PostgresCodeChunkRepository(postgresPool);
const projectIndexingJobRepository = new PostgresProjectIndexingJobRepository(postgresPool);
const codeChunkEmbeddingRepository = new PostgresCodeChunkEmbeddingRepository(postgresPool);




//Instanciamos las implementaciones de puertos
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const idGenerator = new CryptoIdGenerator();
const fileHashGenerator = new CryptoFileHashGenerator();
const zipExtractor = new AdmZipExtractor();
const codeChunker = new LineCodeChunker();
const embeddingGenerator = new GenkitEmbeddingGenerator();
const delay = new TimeoutDelay();





//Monto las dependencias de los chunk
const generateCodeChunksForProjectFileUseCase =
  new GenerateCodeChunksForProjectFileUseCase(
    codeChunkRepository,
    codeChunker,
    idGenerator,
    
  );


//Monto las dependencias de los embedding

const generateEmbeddingForCodeChunkUseCase =
  new GenerateEmbeddingForCodeChunkUseCase(
    codeChunkEmbeddingRepository,
    embeddingGenerator,
    idGenerator,
  );



  //Monto las dependencias del indexador
  const indexProjectEmbeddingsUseCase = new IndexProjectEmbeddingsUseCase(
  projectRepository,
  codeChunkRepository,
  projectIndexingJobRepository,
  generateEmbeddingForCodeChunkUseCase,
  idGenerator,
  delay,
  env.indexing.delayBetweenChunksMs,
);

const isTestEnvironment =
  process.env.NODE_ENV === "test" || process.env.VITEST === "true";

const projectIndexingScheduler = isTestEnvironment
  ? new NoopProjectIndexingScheduler()
  : new AsyncProjectIndexingScheduler(indexProjectEmbeddingsUseCase);





//Monto el generador de las preguntas
const answerGenerator: AnswerGenerator =
  process.env.NODE_ENV === "test"
    ? new TestAnswerGenerator()
    : new GenkitAnswerGenerator();




export const container = {

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

  uploadProjectZipUseCase: new UploadProjectZipUseCase(
  projectRepository,
  projectFileRepository,
  zipExtractor,
  idGenerator,
  generateCodeChunksForProjectFileUseCase,
  projectIndexingScheduler,
),
  indexProjectEmbeddingsUseCase,

getProjectIndexingStatusUseCase : new GetProjectIndexingStatusUseCase(
    projectRepository,
    projectIndexingJobRepository,
  ),

  askProjectQuestionUseCase: new AskProjectQuestionUseCase(
  projectRepository,
  embeddingGenerator,
  codeChunkEmbeddingRepository,
  answerGenerator,
),

  tokenService,
};
