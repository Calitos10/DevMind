import AdmZip from "adm-zip";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";
import { postgresPool } from "../../../src/infrastructure/database/postgresPool";
import { PostgresCodeChunkRepository } from "../../../src/infrastructure/repositoryAdapter/postgres/postgresCodeChunkRepository";

describe("POST /projects/:projectId/upload", () => {
  it("uploads a project zip and creates project files", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-test@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-test@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Uploaded project",
        description: "Project uploaded from ZIP",
      });

    const projectId = createProjectResponse.body.id;

    const zip = new AdmZip();

    zip.addFile(
      "src/index.ts",
      Buffer.from("console.log('hello from zip');", "utf8"),
    );

    zip.addFile(
      "package.json",
      Buffer.from('{"name":"uploaded-project"}', "utf8"),
    );

    const zipBuffer = zip.toBuffer();

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zipBuffer, {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(201);

    expect(uploadResponse.body).toMatchObject({
      projectId,
      summary: {
        created: 2,
        updated: 0,
        deleted: 0,
        unchanged: 0,
      },
    });

    expect(uploadResponse.body.files.created).toHaveLength(2);
    expect(uploadResponse.body.files.updated).toHaveLength(0);
    expect(uploadResponse.body.files.deleted).toHaveLength(0);
    expect(uploadResponse.body.files.unchanged).toHaveLength(0);

    const uploadedFiles = uploadResponse.body.files.created;

    const indexFile = uploadedFiles.find(
      (file: { path: string }) => file.path === "src/index.ts",
    );

    const packageJsonFile = uploadedFiles.find(
      (file: { path: string }) => file.path === "package.json",
    );

    expect(indexFile).toMatchObject({
      projectId,
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('hello from zip');",
      size: Buffer.byteLength("console.log('hello from zip');", "utf8"),
    });

    expect(packageJsonFile).toMatchObject({
      projectId,
      path: "package.json",
      language: "json",
      content: '{"name":"uploaded-project"}',
      size: Buffer.byteLength('{"name":"uploaded-project"}', "utf8"),
    });
  });

  it("creates code chunks when uploading a project zip", async () => {
    const codeChunkRepository = new PostgresCodeChunkRepository(postgresPool);

    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-chunks@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-chunks@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Uploaded project with chunks",
        description: "Project uploaded from ZIP and chunked",
      });

    const projectId = createProjectResponse.body.id;

    const zip = new AdmZip();

    zip.addFile(
      "src/index.ts",
      Buffer.from("console.log('hello from chunks');", "utf8"),
    );

    zip.addFile(
      "package.json",
      Buffer.from('{"name":"uploaded-project-with-chunks"}', "utf8"),
    );

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zip.toBuffer(), {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(201);

    expect(uploadResponse.body).toMatchObject({
      projectId,
      summary: {
        created: 2,
        updated: 0,
        deleted: 0,
        unchanged: 0,
      },
    });

    const uploadedFiles = uploadResponse.body.files.created;

    const indexFile = uploadedFiles.find(
      (file: { path: string }) => file.path === "src/index.ts",
    );

    const packageJsonFile = uploadedFiles.find(
      (file: { path: string }) => file.path === "package.json",
    );

    const indexFileChunks = await codeChunkRepository.findByProjectFileId(
      indexFile.id,
    );

    const packageJsonFileChunks = await codeChunkRepository.findByProjectFileId(
      packageJsonFile.id,
    );

    expect(indexFileChunks).toHaveLength(1);

    expect(indexFileChunks[0]).toMatchObject({
      projectId,
      projectFileId: indexFile.id,
      content: "console.log('hello from chunks');",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(packageJsonFileChunks).toHaveLength(1);

    expect(packageJsonFileChunks[0]).toMatchObject({
      projectId,
      projectFileId: packageJsonFile.id,
      content: '{"name":"uploaded-project-with-chunks"}',
      startLine: 1,
      endLine: 1,
      index: 0,
    });
  });

  it("returns 400 when no zip file is provided", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-no-file@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-no-file@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project without file upload",
        description: "Testing upload without file",
      });

    const projectId = createProjectResponse.body.id;

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(uploadResponse.status).toBe(400);

    expect(uploadResponse.body).toMatchObject({
      message: "Zip file is required",
    });
  });

  it("returns 404 when uploading a zip to another user's project", async () => {
    await request(app).post("/auth/register").send({
      name: "Owner",
      email: "upload-owner@example.com",
      password: "password123",
    });

    const ownerLoginResponse = await request(app).post("/auth/login").send({
      email: "upload-owner@example.com",
      password: "password123",
    });

    const ownerAccessToken = ownerLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        name: "Owner project",
        description: "This project belongs to the owner",
      });

    const projectId = createProjectResponse.body.id;

    await request(app).post("/auth/register").send({
      name: "Intruder",
      email: "upload-intruder@example.com",
      password: "password123",
    });

    const intruderLoginResponse = await request(app).post("/auth/login").send({
      email: "upload-intruder@example.com",
      password: "password123",
    });

    const intruderAccessToken = intruderLoginResponse.body.accessToken;

    const zip = new AdmZip();

    zip.addFile(
      "src/index.ts",
      Buffer.from("console.log('intruder upload');", "utf8"),
    );

    const zipBuffer = zip.toBuffer();

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${intruderAccessToken}`)
      .attach("file", zipBuffer, {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(404);

    const listFilesResponse = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${ownerAccessToken}`);

    expect(listFilesResponse.status).toBe(200);
    expect(listFilesResponse.body).toHaveLength(0);
  });

  it("returns 400 when the uploaded zip contains no valid project files", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-no-valid-files@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-no-valid-files@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project with ignored files",
        description: "Testing zip with no valid files",
      });

    const projectId = createProjectResponse.body.id;

    const zip = new AdmZip();

    zip.addFile(
      "node_modules/express/index.js",
      Buffer.from("module.exports = express;", "utf8"),
    );

    zip.addFile(".git/config", Buffer.from("[core]", "utf8"));

    zip.addFile("dist/index.js", Buffer.from("compiled code", "utf8"));

    const zipBuffer = zip.toBuffer();

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zipBuffer, {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(400);

    expect(uploadResponse.body).toMatchObject({
      message: "No valid project files found",
    });

    const listFilesResponse = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listFilesResponse.status).toBe(200);
    expect(listFilesResponse.body).toHaveLength(0);
  });

  it("ignores files from ignored folders when uploading a zip", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-ignored-folders@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-ignored-folders@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project with ignored folders",
        description: "Testing ignored folders in zip upload",
      });

    const projectId = createProjectResponse.body.id;

    const zip = new AdmZip();

    zip.addFile(
      "src/index.ts",
      Buffer.from("console.log('valid file');", "utf8"),
    );

    zip.addFile(
      "node_modules/express/index.js",
      Buffer.from("module.exports = express;", "utf8"),
    );

    zip.addFile(".git/config", Buffer.from("[core]", "utf8"));

    zip.addFile("dist/index.js", Buffer.from("compiled code", "utf8"));

    zip.addFile("build/index.js", Buffer.from("build output", "utf8"));

    zip.addFile("coverage/report.html", Buffer.from("<html></html>", "utf8"));

    zip.addFile(
      ".next/server/app.js",
      Buffer.from("next build output", "utf8"),
    );

    const zipBuffer = zip.toBuffer();

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zipBuffer, {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(201);

    expect(uploadResponse.body).toMatchObject({
      projectId,
      summary: {
        created: 1,
        updated: 0,
        deleted: 0,
        unchanged: 0,
      },
    });

    expect(uploadResponse.body.files.created).toHaveLength(1);
    expect(uploadResponse.body.files.updated).toHaveLength(0);
    expect(uploadResponse.body.files.deleted).toHaveLength(0);
    expect(uploadResponse.body.files.unchanged).toHaveLength(0);

    expect(uploadResponse.body.files.created[0]).toMatchObject({
      projectId,
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('valid file');",
      size: Buffer.byteLength("console.log('valid file');", "utf8"),
    });

    const listFilesResponse = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listFilesResponse.status).toBe(200);
    expect(listFilesResponse.body).toHaveLength(1);

    expect(listFilesResponse.body[0]).toMatchObject({
      projectId,
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('valid file');",
    });
  });

  it("synchronizes project files when uploading an updated zip", async () => {
    const codeChunkRepository = new PostgresCodeChunkRepository(postgresPool);

    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "upload-sync@example.com",
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "upload-sync@example.com",
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project sync test",
        description: "Testing ZIP synchronization",
      });

    const projectId = createProjectResponse.body.id;

    const firstZip = new AdmZip();

    firstZip.addFile(
      "src/index.ts",
      Buffer.from("console.log('index v1');", "utf8"),
    );

    firstZip.addFile(
      "src/app.ts",
      Buffer.from("export const app = 'v1';", "utf8"),
    );

    firstZip.addFile(
      "src/old.ts",
      Buffer.from("console.log('old file');", "utf8"),
    );

    const firstUploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", firstZip.toBuffer(), {
        filename: "project-v1.zip",
        contentType: "application/zip",
      });

    expect(firstUploadResponse.status).toBe(201);

    expect(firstUploadResponse.body).toMatchObject({
      projectId,
      summary: {
        created: 3,
        updated: 0,
        deleted: 0,
        unchanged: 0,
      },
    });

    expect(firstUploadResponse.body.files.created).toHaveLength(3);
    expect(firstUploadResponse.body.files.updated).toHaveLength(0);
    expect(firstUploadResponse.body.files.deleted).toHaveLength(0);
    expect(firstUploadResponse.body.files.unchanged).toHaveLength(0);

    const firstCreatedFiles = firstUploadResponse.body.files.created;

    const firstIndexFile = firstCreatedFiles.find(
      (file: { path: string }) => file.path === "src/index.ts",
    );

    const firstAppFile = firstCreatedFiles.find(
      (file: { path: string }) => file.path === "src/app.ts",
    );

    const firstOldFile = firstCreatedFiles.find(
      (file: { path: string }) => file.path === "src/old.ts",
    );

    const firstIndexFileChunks = await codeChunkRepository.findByProjectFileId(
      firstIndexFile.id,
    );

    const firstAppFileChunks = await codeChunkRepository.findByProjectFileId(
      firstAppFile.id,
    );

    const firstOldFileChunks = await codeChunkRepository.findByProjectFileId(
      firstOldFile.id,
    );

    expect(firstIndexFileChunks).toHaveLength(1);
    expect(firstAppFileChunks).toHaveLength(1);
    expect(firstOldFileChunks).toHaveLength(1);

    const secondZip = new AdmZip();

    secondZip.addFile(
      "src/index.ts",
      Buffer.from("console.log('index v1');", "utf8"),
    );

    secondZip.addFile(
      "src/app.ts",
      Buffer.from("export const app = 'v2';", "utf8"),
    );

    secondZip.addFile(
      "src/new.ts",
      Buffer.from("console.log('new file');", "utf8"),
    );

    const secondUploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", secondZip.toBuffer(), {
        filename: "project-v2.zip",
        contentType: "application/zip",
      });

    expect(secondUploadResponse.status).toBe(201);

    expect(secondUploadResponse.body).toMatchObject({
      projectId,
      summary: {
        created: 1,
        updated: 1,
        deleted: 1,
        unchanged: 1,
      },
    });

    expect(secondUploadResponse.body.files.created).toHaveLength(1);
    expect(secondUploadResponse.body.files.updated).toHaveLength(1);
    expect(secondUploadResponse.body.files.deleted).toHaveLength(1);
    expect(secondUploadResponse.body.files.unchanged).toHaveLength(1);

    expect(secondUploadResponse.body.files.created[0]).toMatchObject({
      projectId,
      path: "src/new.ts",
      language: "typescript",
      content: "console.log('new file');",
      size: Buffer.byteLength("console.log('new file');", "utf8"),
    });

    expect(secondUploadResponse.body.files.updated[0]).toMatchObject({
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "export const app = 'v2';",
      size: Buffer.byteLength("export const app = 'v2';", "utf8"),
    });

    expect(secondUploadResponse.body.files.deleted[0]).toMatchObject({
      projectId,
      path: "src/old.ts",
      language: "typescript",
      content: "console.log('old file');",
    });

    expect(secondUploadResponse.body.files.unchanged[0]).toMatchObject({
      projectId,
      path: "src/index.ts",
      language: "typescript",
      content: "console.log('index v1');",
    });

    const listFilesResponse = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(listFilesResponse.status).toBe(200);
    expect(listFilesResponse.body).toHaveLength(3);

    const projectFiles = listFilesResponse.body;

    const indexFile = projectFiles.find(
      (file: { path: string }) => file.path === "src/index.ts",
    );

    const appFile = projectFiles.find(
      (file: { path: string }) => file.path === "src/app.ts",
    );

    const newFile = projectFiles.find(
      (file: { path: string }) => file.path === "src/new.ts",
    );

    const oldFile = projectFiles.find(
      (file: { path: string }) => file.path === "src/old.ts",
    );

    expect(indexFile).toMatchObject({
      projectId,
      path: "src/index.ts",
      content: "console.log('index v1');",
    });

    expect(appFile).toMatchObject({
      projectId,
      path: "src/app.ts",
      content: "export const app = 'v2';",
    });

    expect(newFile).toMatchObject({
      projectId,
      path: "src/new.ts",
      content: "console.log('new file');",
    });

    expect(oldFile).toBeUndefined();

    const finalIndexFileChunks = await codeChunkRepository.findByProjectFileId(
      indexFile.id,
    );

    const finalAppFileChunks = await codeChunkRepository.findByProjectFileId(
      appFile.id,
    );

    const finalNewFileChunks = await codeChunkRepository.findByProjectFileId(
      newFile.id,
    );

    const finalOldFileChunks = await codeChunkRepository.findByProjectFileId(
      firstOldFile.id,
    );

    expect(finalIndexFileChunks).toHaveLength(1);

    expect(finalIndexFileChunks[0]).toMatchObject({
      id: firstIndexFileChunks[0].id,
      projectId,
      projectFileId: indexFile.id,
      content: "console.log('index v1');",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(finalAppFileChunks).toHaveLength(1);

    expect(finalAppFileChunks[0]).toMatchObject({
      projectId,
      projectFileId: appFile.id,
      content: "export const app = 'v2';",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(finalAppFileChunks[0].id).not.toBe(firstAppFileChunks[0].id);

    expect(finalNewFileChunks).toHaveLength(1);

    expect(finalNewFileChunks[0]).toMatchObject({
      projectId,
      projectFileId: newFile.id,
      content: "console.log('new file');",
      startLine: 1,
      endLine: 1,
      index: 0,
    });

    expect(finalOldFileChunks).toEqual([]);
  });
});
