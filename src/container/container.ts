//[IMPORTS PARA LA PARTE DE USUARIOS]
import { GetCurrentUserUseCase } from "../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../application/auth/registerUserUseCase";
import { CreateGuestUserUseCase } from "../application/auth/createGuestUserUseCase";
import { BcryptPasswordHasher } from "../infrastructure/authAdapter/bcryptPasswordHasher";
import { JwtTokenService } from "../infrastructure/authAdapter/jwtTokenService";
import { CryptoIdGenerator } from "../infrastructure/authAdapter/cryptoIdGenerator";
//Imports de Repositorio Postgres
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
//Import de repositorio en memoria
//import { InMemoryProjectRepository } from "../infrastructure/repositoryAdapter/inMemory/inMemoryProjectRepository";




//[IMPORTS PARA LA PARTE DE ARCHIVOS]
import { DeleteProjectFileUseCase } from "../application/projectFiles/deleteProjectFileUseCase";
import { GetProjectFileByIdUseCase } from "../application/projectFiles/getProjectFileByIdUseCase";
import { ListProjectFilesUseCase } from "../application/projectFiles/listProjectFilesUseCase";
//Import de repositorio de postgres
import { PostgresProjectFileRepository } from "../infrastructure/repositoryAdapter/postgres/postgresProjectFileRepository";
//Import de repositorio de memoria
//import { InMemoryProjectFileRepository } from "../infrastructure/repositoryAdapter/inMemory/inMemoryProjectFileRepository";




//[IMPORTS PARA LA PARTE DE SUBIR ZIP]
import { YauzlZipExtractor } from "../infrastructure/uploadZipAdapter/yauzlZipExtractor";
import { UploadProjectZipUseCase } from "../application/uploadZip/uploadProjectZipUseCase";




//[IMPORTS PARA LA PARTE DE GENERAR CHUNKS]
import { PostgresCodeChunkRepository } from "../infrastructure/repositoryAdapter/postgres/postgresCodeChunkRepository";
import { LineCodeChunker } from "../application/codeChunk/lineCodeChunker";
import { GenerateCodeChunksForProjectFileUseCase } from "../application/codeChunk/generateCodeChunksForProjectFileUseCase";




//[IMPORTS PARA LA PARTE DE GENERAR EMBEDDING]
import { PostgresCodeChunkEmbeddingRepository } from "../infrastructure/repositoryAdapter/postgres/postgresCodeChunkEmbeddingRepository";
import type { EmbeddingGenerator } from "../application/ports/embeddingGenerator";
import { GenkitEmbeddingGenerator } from "../infrastructure/genkit/genkitEmbeddingGenerator";
import { TestEmbeddingGenerator } from "../infrastructure/genkit/testing/testEmbeddingGenerator";
import { GenerateEmbeddingForCodeChunkUseCase } from "../application/codeChunkEmbeddings/generateEmbeddingForCodeChunkUseCase";




//IMPORT DEL CASO DE USO QUE USA LA GENERACION DE EMBEDDINGS 
import { PostgresProjectIndexingJobRepository } from "../infrastructure/repositoryAdapter/postgres/postgresProjectIndexingJobRepository";
import { IndexProjectEmbeddingsUseCase } from "../application/indexing/indexProjectEmbeddingsUseCase";
import { GetProjectIndexingStatusUseCase } from "../application/indexing/getProjectIndexingStatusUseCase";
import { TimeoutDelay } from "../infrastructure/timeDelayAdapter/timeoutDelay";
import { env } from "../infrastructure/config/env";




//IMPORTS PARA LA PARTE DE LAS PREGUNTAS
import type { AnswerGenerator } from "../application/ports/answerGenerator";
import { AskProjectQuestionUseCase } from "../application/projectQuestions/askProjectQuestionUseCase";
import { GenkitAnswerGenerator } from "../infrastructure/genkit/genkitAnswerGenerator";
import { TestAnswerGenerator } from "../infrastructure/genkit/testing/testAnswerGenerator";

//IMPORTS PARA LA PARTE DEL HISTORIAL DE CONVERSACIONES
import { PostgresConversationRepository } from "../infrastructure/repositoryAdapter/postgres/postgresConversationRepository";
import { GetProjectConversationHistoryUseCase } from "../application/projectQuestions/getProjectConversationHistoryUseCase";




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
const conversationRepository = new PostgresConversationRepository(postgresPool);




//Instanciamos las implementaciones de puertos
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const idGenerator = new CryptoIdGenerator();
const zipExtractor = new YauzlZipExtractor();
const codeChunker = new LineCodeChunker();
const delay = new TimeoutDelay();
const embeddingGenerator: EmbeddingGenerator =
  process.env.NODE_ENV === "test"
    ? new TestEmbeddingGenerator()
    : new GenkitEmbeddingGenerator(
        delay,
        env.embedding.maxRetries,
        env.embedding.retryBaseMs,
      );





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

  createGuestUserUseCase: new CreateGuestUserUseCase(
    userRepository,
    passwordHasher,
    tokenService,
    idGenerator,
    env.guest.ttlHours,
  ),

  createProjectUseCase: new CreateProjectUseCase(
    projectRepository,
    idGenerator,
  ),

  listUserProjectsUseCase: new ListUserProjectsUseCase(projectRepository),

  getProjectByIdUseCase: new GetProjectByIdUseCase(projectRepository),

  deleteProjectUseCase: new DeleteProjectUseCase(projectRepository),

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
  conversationRepository,
  idGenerator,
  userRepository,
  env.rag.maxDistance,
),

  getProjectConversationHistoryUseCase: new GetProjectConversationHistoryUseCase(
    projectRepository,
    conversationRepository,
  ),

  tokenService,
};
