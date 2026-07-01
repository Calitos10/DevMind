import { createHash } from "node:crypto";

import { ProjectRepository } from "../../domain/repository/projectRepository";
import { ProjectFileRepository } from "../../domain/repository/projectFileRepository";
import { IdGenerator } from "../../application/ports/idGeneratorPort";
import { ZipExtractor } from "../../application/ports/zipExtractor";
import { ProjectNotFoundError } from "../../shared/errors/project-not-found.error";
import { NoValidProjectFilesFoundError } from "../../shared/errors/noValidProjectFilesFoundError";

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
  ) {}

  async execute(input: UploadProjectZipUseCaseInput) {
    const project = await this.projectRepository.findByIdAndOwnerId(
      input.projectId,
      input.ownerId,
    );

    if (!project) {
      throw new ProjectNotFoundError();
    }

    const extractedFiles = await this.zipExtractor.extract(input.zipBuffer);

    const validFiles = extractedFiles.filter(
      (extractedFile) => !isIgnoredProjectFilePath(extractedFile.path),
    );

    if (validFiles.length === 0) {
      throw new NoValidProjectFilesFoundError();
    }

    const createdFiles = [];

    for (const extractedFile of validFiles) {
      const projectFile = {
        id: this.idGenerator.generate(),
        projectId: input.projectId,
        path: extractedFile.path,
        language: detectLanguageFromPath(extractedFile.path),
        content: extractedFile.content,
        size: Buffer.byteLength(extractedFile.content, "utf8"),
        hash: createHash("sha256").update(extractedFile.content).digest("hex"),
        createdAt: new Date(),
      };

      const savedProjectFile =
        await this.projectFileRepository.save(projectFile);

      createdFiles.push(savedProjectFile);
    }

    return {
      projectId: input.projectId,
      filesCreated: createdFiles.length,
      files: createdFiles,
    };
  }
}

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
  ]);

  const pathParts = path.replaceAll("\\", "/").split("/");

  return pathParts.some((part) => ignoredFolders.has(part));
}
