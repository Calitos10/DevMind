import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";

describe("ProjectFiles HTTP", () => {
  //ENDPOINT POST /projects/:projectId/files
  it("POST /projects/:projectId/files should create a project file inside an authenticated user's project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: "console.log('hello');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("POST /projects/:projectId/files should return 401 when creating a project file without token", async () => {
    const response = await request(app).post("/projects/project-1/files").send({
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
    });

    expect(response.status).toBe(401);
  });

  it("POST /projects/:projectId/files should return 400 when creating a project file with invalid body", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "",
        language: "",
        content: "console.log('hello');",
      });

    expect(response.status).toBe(400);
  });

  it("POST /projects/:projectId/files should return 404 when creating a project file in a non-existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/projects/non-existing-project/files")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      });

    expect(response.status).toBe(404);
  });

  it("POST /projects/:projectId/files should return 404 when creating a project file in another user's project", async () => {
    const userOneEmail = `user-one-${Date.now()}@example.com`;
    const userTwoEmail = `user-two-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email: userOneEmail,
      password: "password123",
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password: "password123",
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Private Project",
        description: "Project owned by user one",
      });

    const projectId = createProjectResponse.body.id;

    await request(app).post("/auth/register").send({
      name: "User Two",
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const response = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      });

    expect(response.status).toBe(404);
  });

  //ENDPOINT GET /projects/:projectId/files
  it("GET /projects/:projectId/files should list files from an authenticated user's project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('app');",
      });

    await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/main.ts",
        language: "typescript",
        content: "console.log('main');",
      });

    const response = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);

    expect(response.body[0]).toEqual({
      id: expect.any(String),
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('app');",
      size: "console.log('app');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });

    expect(response.body[1]).toEqual({
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
  it(" GET /projects/:projectId/files should return 401 when listing project files without token", async () => {
    const response = await request(app).get("/projects/project-1/files");

    expect(response.status).toBe(401);
  });
  it("GET /projects/:projectId/files should return 404 when listing files from a non-existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/projects/non-existing-project/files")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });
  it("GET /projects/:projectId/files should return 404 when listing files from another user's project", async () => {
    const userOneEmail = `user-one-${Date.now()}@example.com`;
    const userTwoEmail = `user-two-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email: userOneEmail,
      password: "password123",
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password: "password123",
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Private Project",
        description: "Project owned by user one",
      });

    const projectId = createProjectResponse.body.id;

    await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('private');",
      });

    await request(app).post("/auth/register").send({
      name: "User Two",
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const response = await request(app)
      .get(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`);

    expect(response.status).toBe(404);
  });

  //ENDPOINT GET /projects/:projectId/files

  it("GET /projects/:projectId/files should get a project file by id from an authenticated user's project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const createFileResponse = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      });

    const fileId = createFileResponse.body.id;

    const response = await request(app)
      .get(`/projects/${projectId}/files/${fileId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      id: fileId,
      projectId,
      path: "src/app.ts",
      language: "typescript",
      content: "console.log('hello');",
      size: "console.log('hello');".length,
      hash: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it("GET /projects/:projectId/files should return 401 when getting a project file without token", async () => {
    const response = await request(app).get("/projects/project-1/files/file-1");

    expect(response.status).toBe(401);
  });

  it("GET /projects/:projectId/files should return 404 when getting a project file from a non-existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/projects/non-existing-project/files/file-1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:projectId/files should return 404 when getting a non-existing project file from an existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .get(`/projects/${projectId}/files/non-existing-file`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:projectId/files should return 404 when getting a project file from another user's project", async () => {
    const userOneEmail = `user-one-${Date.now()}@example.com`;
    const userTwoEmail = `user-two-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email: userOneEmail,
      password: "password123",
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password: "password123",
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Private Project",
        description: "Project owned by user one",
      });

    const projectId = createProjectResponse.body.id;

    const createFileResponse = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('private');",
      });

    const fileId = createFileResponse.body.id;

    await request(app).post("/auth/register").send({
      name: "User Two",
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const response = await request(app)
      .get(`/projects/${projectId}/files/${fileId}`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`);

    expect(response.status).toBe(404);
  });

  //ENDPOINT DELETE /projects/:projectId/files/:fileId
  it("DELETE /projects/:projectId/files/:fileId should delete a project file from an authenticated user's project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const createFileResponse = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('hello');",
      });

    const fileId = createFileResponse.body.id;

    const response = await request(app)
      .delete(`/projects/${projectId}/files/${fileId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    const getDeletedFileResponse = await request(app)
      .get(`/projects/${projectId}/files/${fileId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getDeletedFileResponse.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId. should return 401 when deleting a project file without token", async () => {
    const response = await request(app).delete(
      "/projects/project-1/files/file-1",
    );

    expect(response.status).toBe(401);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a project file from a non-existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .delete("/projects/non-existing-project/files/file-1")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a non-existing project file from an existing project", async () => {
    const email = `user-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email,
      password: "password123",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password: "password123",
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend with AI",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .delete(`/projects/${projectId}/files/non-existing-file`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("DELETE /projects/:projectId/files/:fileId should return 404 when deleting a project file from another user's project", async () => {
    const userOneEmail = `user-one-${Date.now()}@example.com`;
    const userTwoEmail = `user-two-${Date.now()}@example.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email: userOneEmail,
      password: "password123",
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password: "password123",
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Private Project",
        description: "Project owned by user one",
      });

    const projectId = createProjectResponse.body.id;

    const createFileResponse = await request(app)
      .post(`/projects/${projectId}/files`)
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        path: "src/app.ts",
        language: "typescript",
        content: "console.log('private');",
      });

    const fileId = createFileResponse.body.id;

    await request(app).post("/auth/register").send({
      name: "User Two",
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password: "password123",
    });

    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const response = await request(app)
      .delete(`/projects/${projectId}/files/${fileId}`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`);

    expect(response.status).toBe(404);
  });
});
