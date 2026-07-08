import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";
import AdmZip from "adm-zip";

describe("Projects routes", () => {
  //ENDPOINT POST /projects
  it("POST /projects should create a project for the authenticated user", async () => {
    const email = `project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    expect(loginResponse.status).toBe(200);

    const accessToken = loginResponse.body.accessToken;

    expect(accessToken).toBeDefined();

    const response = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend con IA para consultar proyectos software",
      });

    expect(response.status).toBe(201);

    expect(response.body).toEqual({
      id: expect.any(String),
      ownerId: expect.any(String),
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: expect.any(String),
    });
  });

  it("POST /projects should return 401 when no token is provided", async () => {
    const response = await request(app).post("/projects").send({
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
    });

    expect(response.status).toBe(401);
  });

  it("POST /projects should return 400 when body is invalid", async () => {
    const email = `project-invalid-body-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        description: "Falta el name",
      });

    expect(response.status).toBe(400);
  });

  //ENDPOINT GET /project
  it("GET /projects should list only projects owned by the authenticated user", async () => {
    const password = "password123";

    const userOneEmail = `projects-user-one-${Date.now()}@test.com`;
    const userTwoEmail = `projects-user-two-${Date.now()}@test.com`;

    await request(app).post("/auth/register").send({
      name: "User One",
      email: userOneEmail,
      password,
    });

    await request(app).post("/auth/register").send({
      name: "User Two",
      email: userTwoEmail,
      password,
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password,
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password,
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;
    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "DevMind API",
        description: "Proyecto del usuario 1",
      });

    await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Portfolio",
        description: "Otro proyecto del usuario 1",
      });

    await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userTwoAccessToken}`)
      .send({
        name: "Proyecto privado de user 2",
        description: "Este no debería aparecer para user 1",
      });

    const response = await request(app)
      .get("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toHaveLength(2);

    expect(response.body).toEqual([
      expect.objectContaining({
        ownerId: expect.any(String),
        name: "DevMind API",
        description: "Proyecto del usuario 1",
      }),
      expect.objectContaining({
        ownerId: expect.any(String),
        name: "Portfolio",
        description: "Otro proyecto del usuario 1",
      }),
    ]);

    expect(response.body).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Proyecto privado de user 2",
        }),
      ]),
    );
  });

  it("GET /projects should return 401 when no token is provided", async () => {
    const response = await request(app).get("/projects");

    expect(response.status).toBe(401);
  });

  //ENDPOINT GET /projects/:id
  it("GET /projects/:id should return a project when it belongs to the authenticated user", async () => {
    const email = `get-project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Get Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend con IA para consultar proyectos software",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .get(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      id: projectId,
      ownerId: expect.any(String),
      name: "DevMind API",
      description: "Backend con IA para consultar proyectos software",
      createdAt: expect.any(String),
    });
  });

  it("GET /projects/:id should return 401 when no token is provided", async () => {
    const response = await request(app).get("/projects/some-project-id");

    expect(response.status).toBe(401);
  });

  it("GET /projects/:id should return 404 when the project does not exist", async () => {
    const email = `missing-project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Missing Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/projects/non-existing-project")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });

  it("GET /projects/:id should return 404 when the project belongs to another user", async () => {
    const password = "password123";

    const userOneEmail = `get-project-owner-${Date.now()}@test.com`;
    const userTwoEmail = `get-project-other-${Date.now()}@test.com`;

    await request(app).post("/auth/register").send({
      name: "Project Owner",
      email: userOneEmail,
      password,
    });

    await request(app).post("/auth/register").send({
      name: "Other User",
      email: userTwoEmail,
      password,
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password,
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password,
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;
    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Proyecto privado de user one",
        description: "Este proyecto no debería verlo user two",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .get(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`);

    expect(response.status).toBe(404);
  });

  //ENDPOINT DELETE /projects/:id

  it("DELETE /projects/:id should delete a project when it belongs to the authenticated user", async () => {
    const email = `delete-project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Delete Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "Project to delete",
        description: "Este proyecto será borrado",
      });

    const projectId = createProjectResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(deleteResponse.status).toBe(204);

    const getResponse = await request(app)
      .get(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(getResponse.status).toBe(404);
  });

  it("DELETE /projects/:id should return 401 when no token is provided", async () => {
    const response = await request(app).delete("/projects/some-project-id");

    expect(response.status).toBe(401);
  });
  it("DELETE /projects/:id should return 404 when the project does not exist", async () => {
    const email = `delete-missing-project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Delete Missing Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const response = await request(app)
      .delete("/projects/non-existing-project")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(404);
  });
  it("DELETE /projects/:id should return 404 when the project belongs to another user", async () => {
    const password = "password123";

    const userOneEmail = `delete-project-owner-${Date.now()}@test.com`;
    const userTwoEmail = `delete-project-other-${Date.now()}@test.com`;

    await request(app).post("/auth/register").send({
      name: "Project Owner",
      email: userOneEmail,
      password,
    });

    await request(app).post("/auth/register").send({
      name: "Other User",
      email: userTwoEmail,
      password,
    });

    const userOneLoginResponse = await request(app).post("/auth/login").send({
      email: userOneEmail,
      password,
    });

    const userTwoLoginResponse = await request(app).post("/auth/login").send({
      email: userTwoEmail,
      password,
    });

    const userOneAccessToken = userOneLoginResponse.body.accessToken;
    const userTwoAccessToken = userTwoLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${userOneAccessToken}`)
      .send({
        name: "Proyecto privado de user one",
        description: "User two no debería poder borrarlo",
      });

    const projectId = createProjectResponse.body.id;

    const deleteResponse = await request(app)
      .delete(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${userTwoAccessToken}`);

    expect(deleteResponse.status).toBe(404);

    const ownerGetResponse = await request(app)
      .get(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${userOneAccessToken}`);

    expect(ownerGetResponse.status).toBe(200);
  });
  it("POST /projects/:id/ask should answer a question for the authenticated user's project", async () => {
    const email = `ask-project-user-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Ask Project User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend con IA para consultar proyectos software",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .post(`/projects/${projectId}/ask`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        question: "¿Dónde se registra un usuario?",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      answer:
        "No tengo suficiente información del proyecto para responder a esa pregunta.",
      sources: [],
    });
  });
  it("POST /projects/:id/ask should return 401 when no token is provided", async () => {
    const response = await request(app)
      .post("/projects/some-project-id/ask")
      .send({
        question: "¿Dónde se registra un usuario?",
      });

    expect(response.status).toBe(401);
  });
  it("POST /projects/:id/ask should return 404 when asking about another user's project", async () => {
    const password = "password123";

    const ownerEmail = `ask-owner-${Date.now()}@test.com`;
    const intruderEmail = `ask-intruder-${Date.now()}@test.com`;

    await request(app).post("/auth/register").send({
      name: "Project Owner",
      email: ownerEmail,
      password,
    });

    await request(app).post("/auth/register").send({
      name: "Intruder",
      email: intruderEmail,
      password,
    });

    const ownerLoginResponse = await request(app).post("/auth/login").send({
      email: ownerEmail,
      password,
    });

    const intruderLoginResponse = await request(app).post("/auth/login").send({
      email: intruderEmail,
      password,
    });

    const ownerAccessToken = ownerLoginResponse.body.accessToken;
    const intruderAccessToken = intruderLoginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${ownerAccessToken}`)
      .send({
        name: "Private DevMind Project",
        description: "This project belongs to the owner",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .post(`/projects/${projectId}/ask`)
      .set("Authorization", `Bearer ${intruderAccessToken}`)
      .send({
        question: "¿Dónde se registra un usuario?",
      });

    expect(response.status).toBe(404);
  });

  it("POST /projects/:id/ask should return 400 when question is empty", async () => {
    const email = `ask-empty-question-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Ask Empty Question User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend con IA para consultar proyectos software",
      });

    const projectId = createProjectResponse.body.id;

    const response = await request(app)
      .post(`/projects/${projectId}/ask`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        question: "",
      });

    expect(response.status).toBe(400);
  });
  it("POST /projects/:id/ask should answer using uploaded project chunks", async () => {
    const email = `ask-with-context-${Date.now()}@test.com`;
    const password = "password123";

    await request(app).post("/auth/register").send({
      name: "Ask With Context User",
      email,
      password,
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email,
      password,
    });

    const accessToken = loginResponse.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        name: "DevMind API",
        description: "Backend con IA para consultar proyectos software",
      });

    const projectId = createProjectResponse.body.id;

    const zip = new AdmZip();

    zip.addFile(
      "src/auth/registerUserUseCase.ts",
      Buffer.from("export class RegisterUserUseCase {}", "utf8"),
    );

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zip.toBuffer(), {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(201);

    const response = await request(app)
      .post(`/projects/${projectId}/ask`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        question: "¿Dónde se registra un usuario?",
      });

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      answer: "Respuesta generada por IA pendiente de implementar.",
      sources: [
        {
          path: "src/auth/registerUserUseCase.ts",
          startLine: 1,
          endLine: 1,
        },
      ],
    });
  });
});
