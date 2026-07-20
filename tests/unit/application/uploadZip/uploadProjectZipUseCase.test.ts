import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { UploadProjectZipUseCase } from "../../../../src/application/uploadZip/uploadProjectZipUseCase";
import {
  ExtractedProjectFile,
  ZipExtractor,
} from "../../../../src/application/ports/zipExtractor";
import { FakeProjectFileRepository } from "../../../fakes/fakeProjectFileRepository";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";
import { FakeSequentialIdGenerator } from "../../../fakes/fakeSequentialIdGenerator";

class FakeZipExtractor implements ZipExtractor {
  public wasCalled = false;

  constructor(private readonly files: ExtractedProjectFile[]) {}

  async *extract(
    _zipSource: Buffer | string,
  ): AsyncIterable<ExtractedProjectFile> {
    this.wasCalled = true;

    yield* this.files;
  }
}

class FakeGenerateCodeChunksForProjectFileUseCase {
  public generatedProjectFileIds: string[] = [];
  public generatedProjectFilePaths: string[] = [];

  async execute(input: {
    projectFile: {
      id: string;
      path: string;
    };
  }) {
    this.generatedProjectFileIds.push(input.projectFile.id);
    this.generatedProjectFilePaths.push(input.projectFile.path);

    return {
      projectFileId: input.projectFile.id,
      chunksCreated: 0,
      chunks: [],
    };
  }
}

function calculateHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function createUploadProjectZipUseCase(input: {
  projectRepository: FakeProjectRepository;
  projectFileRepository: FakeProjectFileRepository;
  zipExtractor: FakeZipExtractor;
  idGenerator: FakeSequentialIdGenerator;
  generateCodeChunksForProjectFileUseCase?: FakeGenerateCodeChunksForProjectFileUseCase;
}) {
  const generateCodeChunksForProjectFileUseCase =
    input.generateCodeChunksForProjectFileUseCase ??
    new FakeGenerateCodeChunksForProjectFileUseCase();

  const useCase = new UploadProjectZipUseCase(
    input.projectRepository,
    input.projectFileRepository,
    input.zipExtractor,
    input.idGenerator,
    generateCodeChunksForProjectFileUseCase,
  );

  return {
    useCase,
    generateCodeChunksForProjectFileUseCase,
  };
}

describe("UploadProjectZipUseCase", () => {
  it("creates project files from an uploaded zip", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: "console.log('hello');",
      },
      {
        path: "package.json",
        content: '{"name":"devmind-test"}',
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["file-1", "file-2"]);

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");

    expect(result.summary).toMatchObject({
      created: 2,
      updated: 0,
      deleted: 0,
      unchanged: 0,
    });

    expect(result.files.created).toHaveLength(2);
    expect(result.files.updated).toHaveLength(0);
    expect(result.files.deleted).toHaveLength(0);
    expect(result.files.unchanged).toHaveLength(0);

    expect(result.files.created[0]).toMatchObject({
      id: "file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      size: Buffer.byteLength("console.log('hello');", "utf8"),
    });

    expect(result.files.created[0].hash).toEqual(expect.any(String));

    expect(result.files.created[1]).toMatchObject({
      id: "file-2",
      projectId: "project-1",
      path: "package.json",
      language: "json",
      size: Buffer.byteLength('{"name":"devmind-test"}', "utf8"),
    });

    expect(result.files.created[1].hash).toEqual(expect.any(String));
  });

  it("generates code chunks for created project files", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: "console.log('hello');",
      },
      {
        path: "package.json",
        content: '{"name":"devmind-test"}',
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["file-1", "file-2"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFileIds,
    ).toEqual(["file-1", "file-2"]);

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFilePaths,
    ).toEqual(["src/index.ts", "package.json"]);
  });

  it("does not upload files when the project does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "another-user",
      name: "Another user project",
      description: "This project belongs to another user",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: "console.log('hello');",
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["file-1"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
        zipSource: Buffer.from("fake zip content"),
      }),
    ).rejects.toThrow("Project not found");

    expect(zipExtractor.wasCalled).toBe(false);
    expect(projectFileRepository.projectFiles).toHaveLength(0);
    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFileIds,
    ).toEqual([]);
  });

  it("ignores files from ignored folders", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: "console.log('hello');",
      },
      {
        path: "node_modules/express/index.js",
        content: "module.exports = express;",
      },
      {
        path: ".git/config",
        content: "[core]",
      },
      {
        path: "dist/index.js",
        content: "compiled code",
      },
      {
        path: "coverage/report.html",
        content: "<html></html>",
      },
      {
        path: ".next/server/app.js",
        content: "next build output",
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator([
      "file-1",
      "file-2",
      "file-3",
      "file-4",
      "file-5",
      "file-6",
    ]);

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");

    expect(result.summary).toMatchObject({
      created: 1,
      updated: 0,
      deleted: 0,
      unchanged: 0,
    });

    expect(result.files.created).toHaveLength(1);
    expect(result.files.updated).toHaveLength(0);
    expect(result.files.deleted).toHaveLength(0);
    expect(result.files.unchanged).toHaveLength(0);

    expect(result.files.created[0]).toMatchObject({
      id: "file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);
  });

  it("throws an error when the zip contains no valid files", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "node_modules/express/index.js",
        content: "module.exports = express;",
      },
      {
        path: ".git/config",
        content: "[core]",
      },
      {
        path: "dist/index.js",
        content: "compiled code",
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["file-1"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
        zipSource: Buffer.from("fake zip content"),
      }),
    ).rejects.toThrow("No valid project files found");

    expect(projectFileRepository.projectFiles).toHaveLength(0);
    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFileIds,
    ).toEqual([]);
  });

  it("does not duplicate unchanged files when uploading the same zip again", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const existingContent = "console.log('hello');";

    await projectFileRepository.save({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: existingContent,
      size: Buffer.byteLength(existingContent, "utf8"),
      hash: calculateHash(existingContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: existingContent,
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["new-file-1"]);

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");

    expect(result.summary).toMatchObject({
      created: 0,
      updated: 0,
      deleted: 0,
      unchanged: 1,
    });

    expect(result.files.created).toHaveLength(0);
    expect(result.files.updated).toHaveLength(0);
    expect(result.files.deleted).toHaveLength(0);
    expect(result.files.unchanged).toHaveLength(1);

    expect(result.files.unchanged[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      hash: calculateHash(existingContent),
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);

    expect(projectFileRepository.projectFiles[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      content: existingContent,
      hash: calculateHash(existingContent),
    });
  });

  it("does not regenerate code chunks for unchanged project files", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const existingContent = "console.log('hello');";

    await projectFileRepository.save({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: existingContent,
      size: Buffer.byteLength(existingContent, "utf8"),
      hash: calculateHash(existingContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: existingContent,
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["new-file-1"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFileIds,
    ).toEqual([]);

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFilePaths,
    ).toEqual([]);
  });

  it("updates an existing project file when the path is the same but content has changed", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const oldContent = "console.log('old');";
    const newContent = "console.log('new');";

    await projectFileRepository.save({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: oldContent,
      size: Buffer.byteLength(oldContent, "utf8"),
      hash: calculateHash(oldContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: newContent,
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["new-file-1"]);

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");

    expect(result.summary).toMatchObject({
      created: 0,
      updated: 1,
      deleted: 0,
      unchanged: 0,
    });

    expect(result.files.created).toHaveLength(0);
    expect(result.files.updated).toHaveLength(1);
    expect(result.files.deleted).toHaveLength(0);
    expect(result.files.unchanged).toHaveLength(0);

    expect(result.files.updated[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      size: Buffer.byteLength(newContent, "utf8"),
      hash: calculateHash(newContent),
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);

    expect(projectFileRepository.projectFiles[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: newContent,
      size: Buffer.byteLength(newContent, "utf8"),
      hash: calculateHash(newContent),
    });
  });

  it("regenerates code chunks for updated project files", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const oldContent = "console.log('old');";
    const newContent = "console.log('new');";

    await projectFileRepository.save({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: oldContent,
      size: Buffer.byteLength(oldContent, "utf8"),
      hash: calculateHash(oldContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: newContent,
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["new-file-1"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFileIds,
    ).toEqual(["existing-file-1"]);

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFilePaths,
    ).toEqual(["src/index.ts"]);
  });

  it("deletes project files that are not present in the uploaded zip anymore", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const indexContent = "console.log('index');";
    const oldContent = "console.log('old file');";

    await projectFileRepository.save({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: indexContent,
      size: Buffer.byteLength(indexContent, "utf8"),
      hash: calculateHash(indexContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    await projectFileRepository.save({
      id: "existing-file-2",
      projectId: "project-1",
      path: "src/old.ts",
      language: "typescript",
      content: oldContent,
      size: Buffer.byteLength(oldContent, "utf8"),
      hash: calculateHash(oldContent),
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: indexContent,
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["new-file-1"]);

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");

    expect(result.summary).toMatchObject({
      created: 0,
      updated: 0,
      deleted: 1,
      unchanged: 1,
    });

    expect(result.files.created).toHaveLength(0);
    expect(result.files.updated).toHaveLength(0);
    expect(result.files.deleted).toHaveLength(1);
    expect(result.files.unchanged).toHaveLength(1);

    expect(result.files.deleted[0]).toMatchObject({
      id: "existing-file-2",
      projectId: "project-1",
      path: "src/old.ts",
    });

    expect(result.files.unchanged[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);

    expect(projectFileRepository.projectFiles[0]).toMatchObject({
      id: "existing-file-1",
      projectId: "project-1",
      path: "src/index.ts",
      content: indexContent,
    });

    expect(
      projectFileRepository.projectFiles.find(
        (projectFile) => projectFile.path === "src/old.ts",
      ),
    ).toBeUndefined();
  });

  it("ignores binary files from the uploaded zip", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    await projectRepository.save({
      id: "project-1",
      ownerId: "user-1",
      name: "My project",
      description: "Test project",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    });

    const zipExtractor = new FakeZipExtractor([
      {
        path: "src/index.ts",
        content: "console.log('hello');",
      },
      {
        path: "assets/logo.png",
        content: "\u0000PNG binary content",
      },
      {
        path: ".DS_Store",
        content: "\u0000MacOS binary metadata",
      },
    ]);

    const idGenerator = new FakeSequentialIdGenerator(["file-1"]);

    const generateCodeChunksForProjectFileUseCase =
      new FakeGenerateCodeChunksForProjectFileUseCase();

    const { useCase } = createUploadProjectZipUseCase({
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
      generateCodeChunksForProjectFileUseCase,
    });

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipSource: Buffer.from("fake zip content"),
    });

    expect(result.summary).toMatchObject({
      created: 1,
      updated: 0,
      deleted: 0,
      unchanged: 0,
    });

    expect(result.files.created).toHaveLength(1);

    expect(result.files.created[0]).toMatchObject({
      id: "file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);

    expect(
      generateCodeChunksForProjectFileUseCase.generatedProjectFilePaths,
    ).toEqual(["src/index.ts"]);
  });
});
