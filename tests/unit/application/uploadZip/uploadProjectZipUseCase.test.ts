import { describe, expect, it } from "vitest";

import { UploadProjectZipUseCase } from "../../../../src/application/uploadZip/uploadProjectZipUseCase";
import { FakeProjectRepository } from "../../../fakes/fakeProjectRepository";
import { FakeProjectFileRepository } from "../../../fakes/fakeProjectFileRepository";
import {
  ZipExtractor,
  ExtractedProjectFile,
} from "../../../../src/application/ports/zipExtractor";

class FakeZipExtractor implements ZipExtractor {
  public wasCalled = false;

  constructor(private readonly files: ExtractedProjectFile[]) {}

  async extract(_zipBuffer: Buffer): Promise<ExtractedProjectFile[]> {
    this.wasCalled = true;

    return this.files;
  }
}

class FakeSequentialIdGenerator {
  private currentIndex = 0;

  constructor(private readonly ids: string[]) {}

  generate(): string {
    const id = this.ids[this.currentIndex];

    if (!id) {
      throw new Error("No fake id available");
    }

    this.currentIndex += 1;

    return id;
  }
}

describe("UploadProjectZipUseCase", () => {
  it("creates project files from an uploaded zip", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    projectRepository.save({
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

    const useCase = new UploadProjectZipUseCase(
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipBuffer: Buffer.from("fake zip content"),
    });

    expect(result.projectId).toBe("project-1");
    expect(result.filesCreated).toBe(2);
    expect(result.files).toHaveLength(2);

    expect(result.files[0]).toMatchObject({
      id: "file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: Buffer.byteLength("console.log('hello');", "utf8"),
    });

    expect(result.files[0].hash).toEqual(expect.any(String));

    expect(result.files[1]).toMatchObject({
      id: "file-2",
      projectId: "project-1",
      path: "package.json",
      language: "json",
      content: '{"name":"devmind-test"}',
      size: Buffer.byteLength('{"name":"devmind-test"}', "utf8"),
    });

    expect(result.files[1].hash).toEqual(expect.any(String));
  });

  it("does not upload files when the project does not belong to the user", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    projectRepository.save({
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

    const useCase = new UploadProjectZipUseCase(
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
        zipBuffer: Buffer.from("fake zip content"),
      }),
    ).rejects.toThrow("Project not found");

    expect(zipExtractor.wasCalled).toBe(false);
    expect(projectFileRepository.projectFiles).toHaveLength(0);
  });

  it("ignores files from ignored folders", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    projectRepository.save({
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

    const useCase = new UploadProjectZipUseCase(
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    );

    const result = await useCase.execute({
      projectId: "project-1",
      ownerId: "user-1",
      zipBuffer: Buffer.from("fake zip content"),
    });

    expect(result.filesCreated).toBe(1);
    expect(result.files).toHaveLength(1);

    expect(result.files[0]).toMatchObject({
      id: "file-1",
      projectId: "project-1",
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('hello');",
    });

    expect(projectFileRepository.projectFiles).toHaveLength(1);
  });

  it("throws an error when the zip contains no valid files", async () => {
    const projectRepository = new FakeProjectRepository();
    const projectFileRepository = new FakeProjectFileRepository();

    projectRepository.projects.push({
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

    const useCase = new UploadProjectZipUseCase(
      projectRepository,
      projectFileRepository,
      zipExtractor,
      idGenerator,
    );

    await expect(
      useCase.execute({
        projectId: "project-1",
        ownerId: "user-1",
        zipBuffer: Buffer.from("fake zip content"),
      }),
    ).rejects.toThrow("No valid project files found");

    expect(projectFileRepository.projectFiles).toHaveLength(0);
  });
});
