import AdmZip from "adm-zip";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";

// La creación manual de archivos se eliminó (los archivos solo entran por la
// subida de ZIP). Estos helpers siembran los datos de las pruebas de listar,
// ver y borrar a través de ese único camino real.

let uniqueCounter = 0;

function uniqueEmail(prefix: string): string {
  uniqueCounter += 1;

  return `${prefix}-${Date.now()}-${uniqueCounter}@example.com`;
}

async function registerAndLogin(prefix: string): Promise<string> {
  const email = uniqueEmail(prefix);

  await request(app).post("/auth/register").send({
    name: "User",
    email,
    password: "password123",
  });

  const loginResponse = await request(app).post("/auth/login").send({
    email,
    password: "password123",
  });

  return loginResponse.body.accessToken;
}

async function createProject(accessToken: string): Promise<string> {
  const createProjectResponse = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      name: "DevMind API",
      description: "Backend with AI",
    });

  return createProjectResponse.body.id;
}

type CreatedFile = {
  id: string;
  projectId: string;
  path: string;
  language: string;
  content: string;
};

// Sube un ZIP con los archivos indicados y devuelve los archivos creados.
async function uploadFiles(
  accessToken: string,
  projectId: string,
  files: { path: string; content: string }[],
): Promise<CreatedFile[]> {
  const zip = new AdmZip();

  for (const file of files) {
    zip.addFile(file.path, Buffer.from(file.content, "utf8"));
  }

  const uploadResponse = await request(app)
    .post(`/projects/${projectId}/upload`)
    .set("Authorization", `Bearer ${accessToken}`)
    .attach("file", zip.toBuffer(), {
      filename: "project.zip",
      contentType: "application/zip",
    });

  return uploadResponse.body.files.created as CreatedFile[];
}

describe("ProjectFiles HTTP", () => {
  //ENDPOINT GET /projects/:projectId/files
  it("GET /projects/:projectId/files should list files from an authenticated user's project", async () => {
    const accessToken = await registerAndLogin("list-owner");
    const projectId = await createProject(accessToken);

    await uploadFiles(accessToken, projectId, [
      { path: "src/app.ts", content: "console.log('app');" },
      { path: "src/main.ts", content: "console.log('main');" },
    ]);

    const response = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);

    const appFile = response.body.find(
      (file: { path: string }) => file.path === "src/app.ts",
    );

    const mainFile = response.body.find(
      (file: { path: string }) => file.path === "src/main.ts",
    );

    expect(appFile).toEqual({
      id: expect.any(String),
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('app');",
      size: "console.log('app');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });

    expect(mainFile).toEqual({
      id: expect.any(String),
      projectId,
      path: "src/main.ts",
      language: "typescript",
      content: "console.log('main');",
      size: "console.log('main');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("GET /projects/:projectId/files should return 401 when listing project files without token", async () => {
    const response = await request(app).get("/projects/project-1/files");

    expect(response.status).toBe(401);
  });

  it("GET /projects/:projectId/files should return 404 when listing files from a non-existing project", async () => {
    const accessToken = await registerAndLogin("list-404-project");

    const response = await request(app)
      .get("/projects/non-existing-project/files")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:projectId/files should return 404 when listing files from another user's project", async () => {
    const ownerAccessToken = await registerAndLogin("list-owner-private");
    const projectId = await createProject(ownerAccessToken);

    await uploadFiles(ownerAccessToken, projectId, [
      { path: "src/app.ts", content: "console.log('private');" },
    ]);

    const intruderAccessToken = await registerAndLogin("list-intruder");

    const response = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${intruderAccessToken}`);

    expect(response.status).toBe(404);
  });

  //ENDPOINT GET /projects/:projectId/files/:fileId
  it("GET /projects/:projectId/files/:fileId should get a project file by id from an authenticated user's project", async () => {
    const accessToken = await registerAndLogin("get-owner");
    const projectId = await createProject(accessToken);

    const [createdFile] = await uploadFiles(accessToken, projectId, [
      { path: "src/app.ts", content: "console.log('hello');" },
    ]);

    const response = await request(app)
      .get(`/projects/${projectId}/files/${createdFile.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      id: createdFile.id,
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: "console.log('hello');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("GET /projects/:projectId/files/:fileId should return 401 when getting a project file without token", async () => {
    const response = await request(app).get("/projects/project-1/files/file-1");

    expect(response.status).toBe(401);
  });

  it("GET /projects/:projectId/files/:fileId should return 404 when getting a project file from a non-existing project", async () => {
    const accessToken = await registerAndLogin("get-404-project");

    const response = await request(app)
      .get("/projects/non-existing-project/files/file-1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:projectId/files/:fileId should return 404 when getting a non-existing project file from an existing project", async () => {
    const accessToken = await registerAndLogin("get-404-file");
    const projectId = await createProject(accessToken);

    const response = await request(app)
      .get(`/projects/${projectId}/files/non-existing-file`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:projectId/files/:fileId should return 404 when getting a project file from another user's project", async () => {
    const ownerAccessToken = await registerAndLogin("get-owner-private");
    const projectId = await createProject(ownerAccessToken);

    const [createdFile] = await uploadFiles(ownerAccessToken, projectId, [
      { path: "src/app.ts", content: "console.log('private');" },
    ]);

    const intruderAccessToken = await registerAndLogin("get-intruder");

    const response = await request(app)
      .get(`/projects/${projectId}/files/${createdFile.id}`)
      .set("Authorization", `Bearer ${intruderAccessToken}`);

    expect(response.status).toBe(404);
  });

  //ENDPOINT DELETE /projects/:projectId/files/:fileId
  it("DELETE /projects/:projectId/files/:fileId should delete a project file from an authenticated user's project", async () => {
    const accessToken = await registerAndLogin("delete-owner");
    const projectId = await createProject(accessToken);

    const [createdFile] = await uploadFiles(accessToken, projectId, [
      { path: "src/app.ts", content: "console.log('hello');" },
    ]);

    const response = await request(app)
      .delete(`/projects/${projectId}/files/${createdFile.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    const getDeletedFileResponse = await request(app)
      .get(`/projects/${projectId}/files/${createdFile.id}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getDeletedFileResponse.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 401 when deleting a project file without token", async () => {
    const response = await request(app).delete(
      "/projects/project-1/files/file-1",
    );

    expect(response.status).toBe(401);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a project file from a non-existing project", async () => {
    const accessToken = await registerAndLogin("delete-404-project");

    const response = await request(app)
      .delete("/projects/non-existing-project/files/file-1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a non-existing project file from an existing project", async () => {
    const accessToken = await registerAndLogin("delete-404-file");
    const projectId = await createProject(accessToken);

    const response = await request(app)
      .delete(`/projects/${projectId}/files/non-existing-file`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a project file from another user's project", async () => {
    const ownerAccessToken = await registerAndLogin("delete-owner-private");
    const projectId = await createProject(ownerAccessToken);

    const [createdFile] = await uploadFiles(ownerAccessToken, projectId, [
      { path: "src/app.ts", content: "console.log('private');" },
    ]);

    const intruderAccessToken = await registerAndLogin("delete-intruder");

    const response = await request(app)
      .delete(`/projects/${projectId}/files/${createdFile.id}`)
      .set("Authorization", `Bearer ${intruderAccessToken}`);

    expect(response.status).toBe(404);
  });
});
