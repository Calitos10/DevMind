import { createHash } from "node:crypto";

import { ProjectFile } from "../../domain/entities/projectFile";
import { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectFileRepository } from "../../domain/repository/projectFileRepository";
import { IdGenerator } from "../../application/ports/idGeneratorPort";
import { ZipExtractor } from "../../application/ports/zipExtractor";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";
import { NoValidProjectFilesFoundError } from "../../shared/errors/noValidProjectFilesFoundError";
import { ProjectIndexingScheduler } from "../../application/ports/projectIndexingScheduler";

type UploadProjectZipUseCaseInput = {
  projectId: string;
  ownerId: string;
  zipBuffer: Buffer;
};

type GenerateCodeChunksForProjectFileUseCase = {
  execute(input: { projectFile: ProjectFile }): Promise<unknown>;
};

export class UploadProjectZipUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
    private readonly zipExtractor: ZipExtractor,
    private readonly idGenerator: IdGenerator,
    private readonly generateCodeChunksForProjectFileUseCase: GenerateCodeChunksForProjectFileUseCase,
    private readonly projectIndexingScheduler: ProjectIndexingScheduler,
  ) {}

  async execute(input: UploadProjectZipUseCaseInput) {
    //Comprueba si el proyecto existe y es del usuario que lo ejecuta
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }
    //--------------------------------------------------------

    //Extrae los archivos del buffer usando el zipExtractor y valida si los archivos extraídos son válidos

    const extractedFiles = await this.zipExtractor.extract(input.zipBuffer);

    const validFiles = extractedFiles.filter(
      (extractedFile) =>
        !isIgnoredProjectFilePath(extractedFile.path) &&
        !isBinaryProjectFile(extractedFile),
    );

    if (validFiles.length === 0) {
      throw new NoValidProjectFilesFoundError();
    }

    //--------------------------------------------------------

    //PARTE DE SINCRONIZACIÓN MEDIANTE PATH Y HASH PARA ACTUALIZAR LOS PROYECTOS SI SE VUELVEN A SUBIR ZIPS ACTUALIZADOS

    //Busca los archivos existentes del proyecto y los ordena por path

    const existingProjectFiles =
      await this.projectFileRepository.findByProjectId(input.projectId);

    const existingProjectFilesByPath = new Map(
      existingProjectFiles.map((projectFile) => [
        projectFile.path,
        projectFile,
      ]),
    );
     //--------------------------------------------------------


    //Inicializa los arrays
    const createdFiles = [];
    const updatedFiles = [];
    const deletedFiles = [];
    const unchangedFiles = [];
   //--------------------------------------------------------

   //Este for es el que va recorriendo todos los archivos que se han quedado una vez pasada la validación de archivos
   //  y va realizando la sincronización mediante path y hash creando, eliminando o actualizando los archivos
   // y añadiendo cada archivo al array correspondiente.
    for (const extractedFile of validFiles) {
      const hash = createHash("sha256")
        .update(extractedFile.content)
        .digest("hex");

      const existingProjectFile = existingProjectFilesByPath.get(
        extractedFile.path,
      );

      if (existingProjectFile && existingProjectFile.hash === hash) {
        unchangedFiles.push(existingProjectFile);
        continue;
      }

      if (existingProjectFile && existingProjectFile.hash !== hash) {
        const updatedProjectFile = await this.projectFileRepository.update({
          ...existingProjectFile,
          language: detectLanguageFromPath(extractedFile.path),
          content: extractedFile.content,
          size: Buffer.byteLength(extractedFile.content, "utf8"),
          hash,
        });

        await this.generateCodeChunksForProjectFileUseCase.execute({
          projectFile: updatedProjectFile,
        });

        updatedFiles.push(updatedProjectFile);

        continue;
      }

      const projectFile = {
        id: this.idGenerator.generate(),
        projectId: input.projectId,
        path: extractedFile.path,
        language: detectLanguageFromPath(extractedFile.path),
        content: extractedFile.content,
        size: Buffer.byteLength(extractedFile.content, "utf8"),
        hash,
        createdAt: new Date(),
      };

      const savedProjectFile =
        await this.projectFileRepository.save(projectFile);

      await this.generateCodeChunksForProjectFileUseCase.execute({
        projectFile: savedProjectFile,
      });

      createdFiles.push(savedProjectFile);
    }
    //--------------------------------------------------------Salimos del for

    //Este es el proceso en el cual, se sacan a un set todos los path de los nuevos archivos extraídos
    // y con el for se hace que por cada archivo que existía en el repositorio, si en el set no está el path de ese archivo
    // se elimina del repositorio.

    const incomingFilePaths = new Set(
      validFiles.map((extractedFile) => extractedFile.path),
    );

    for (const existingProjectFile of existingProjectFiles) {
      if (!incomingFilePaths.has(existingProjectFile.path)) {
        await this.projectFileRepository.deleteByIdAndProjectId(
          existingProjectFile.id,
          input.projectId,
        );

        deletedFiles.push(existingProjectFile);
      }
    }
    //--------------------------------------------------------

    //PROCESO EN EL QUE SE REALIZA LA INDEXACION DE EMBEDDIGN ASINCRONA

    //En esta primera parte se crea una constante oara decidir si merece la pena indexar. 
    // Si en esta subida de ZIP no hubo ningún archivo creado, actualizado ni borrado (todo era unchanged), 
    // no tiene sentido lanzar una indexación. Solo si hasIndexingRelevantChanges es true se llama a schedule(...).
    // 
    const hasIndexingRelevantChanges =
      createdFiles.length > 0 ||
      updatedFiles.length > 0 ||
      deletedFiles.length > 0;
    

    if (hasIndexingRelevantChanges) {
      this.projectIndexingScheduler.schedule({
        projectId: input.projectId,
        ownerId: input.ownerId,
      });
    }

    //--------------------------------------------------------

    

    return {
      projectId: input.projectId,
      summary: {
        created: createdFiles.length,
        updated: updatedFiles.length,
        deleted: deletedFiles.length,
        unchanged: unchangedFiles.length,
      },
      files: {
        created: createdFiles,
        updated: updatedFiles,
        deleted: deletedFiles,
        unchanged: unchangedFiles,
      },
    };
  }
}

//Funciones helpers:

function detectLanguageFromPath(path: string): string {
  if (path.endsWith(".ts")) return "typescript";
  if (path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js")) return "javascript";
  if (path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".md")) return "markdown";

  return "unknown";
}

function isIgnoredProjectFilePath(path: string): boolean {
  const ignoredFolders = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "docs",
  ]);

  const pathParts = path.replaceAll("\\", "/").split("/");

  return pathParts.some((part) => ignoredFolders.has(part));
}

function isBinaryProjectFile(file: { path: string; content: string }): boolean {
  return hasBinaryExtension(file.path) || hasNullByte(file.content);
}

function hasNullByte(content: string): boolean {
  return content.includes("\u0000");
}

function hasBinaryExtension(path: string): boolean {
  const normalizedPath = path.toLowerCase();

  const binaryExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".tar",
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".db",
    ".sqlite",
    ".mp4",
    ".mov",
    ".mp3",
    ".wav",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
  ];

  return binaryExtensions.some((extension) =>
    normalizedPath.endsWith(extension),
  );
}
