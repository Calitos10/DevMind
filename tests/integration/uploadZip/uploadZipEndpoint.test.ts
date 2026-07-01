import AdmZip from "adm-zip";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";

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

    // Aquí estamos creando un ZIP real, pero sin tener que tener un archivo .zip físico en el proyecto.
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
      filesCreated: 2,
    });

    expect(uploadResponse.body.files).toHaveLength(2);

    const uploadedFiles = uploadResponse.body.files;

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
      filesCreated: 1,
    });

    expect(uploadResponse.body.files).toHaveLength(1);

    expect(uploadResponse.body.files[0]).toMatchObject({
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
});
