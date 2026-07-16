import { createHash } from "node:crypto";

import type { CodeChunkGenerator } from "../ports/codeChunkGenerator";
import { ProjectRepository } from "../../domain/repositories/projectRepository";
import { ProjectFileRepository } from "../../domain/repositories/projectFileRepository";
import { IdGenerator } from "../../application/ports/idGenerator";
import { ZipExtractor } from "../../application/ports/zipExtractor";
import { ProjectNotFoundError } from "../../shared/errors/projectNotFoundError";
import { NoValidProjectFilesFoundError } from "../../shared/errors/noValidProjectFilesFoundError";
import { ProjectFileClassifier } from "../../domain/services/projectFileClassifier";

type UploadProjectZipUseCaseInput = {
  projectId: string;
  ownerId: string;
  zipBuffer: Buffer;
};

export class UploadProjectZipUseCase {
  constructor(
    private readonly projectRepository: ProjectRepository,
    private readonly projectFileRepository: ProjectFileRepository,
    private readonly zipExtractor: ZipExtractor,
    private readonly idGenerator: IdGenerator,
    private readonly generateCodeChunksForProjectFileUseCase: CodeChunkGenerator,
    private readonly fileClassifier: ProjectFileClassifier = new ProjectFileClassifier(),
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

    const validFiles = extractedFiles.filter((extractedFile) =>
      this.fileClassifier.isRelevant(extractedFile),
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
          language: this.fileClassifier.detectLanguage(extractedFile.path),
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
        language: this.fileClassifier.detectLanguage(extractedFile.path),
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

    //La generación de embeddings (indexación) ya NO se lanza automáticamente aquí.
    //Tras subir el ZIP, DevMind responde con el resumen de cambios y es el usuario
    //quien decide cuándo indexar, de forma explícita, con POST /projects/:id/index.
    //Ver Fase 11 del documento de diseño para el motivo de este cambio.

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
