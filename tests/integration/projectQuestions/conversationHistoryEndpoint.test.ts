import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";

// El historial se llena preguntando (POST /:id/ask). En entorno de test el
// generador de embeddings y el de respuestas son fakes, así que preguntar sin
// haber indexado devuelve la respuesta de fallback, que igualmente se guarda.

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
  const response = await request(app)
    .post("/projects")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ name: "DevMind API", description: "Backend con IA" });

  return response.body.id;
}

async function ask(
  accessToken: string,
  projectId: string,
  question: string,
): Promise<void> {
  await request(app)
    .post(`/projects/${projectId}/ask`)
    .set("Authorization", `Bearer ${accessToken}`)
    .send({ question });
}

describe("GET /projects/:id/history", () => {
  it("returns the questions and answers asked in a project, in order", async () => {
    const accessToken = await registerAndLogin("history-owner");
    const projectId = await createProject(accessToken);

    await ask(accessToken, projectId, "¿Primera pregunta?");
    await ask(accessToken, projectId, "¿Segunda pregunta?");

    const response = await request(app)
      .get(`/projects/${projectId}/history`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);

    expect(response.body[0]).toMatchObject({
      projectId,
      question: "¿Primera pregunta?",
      answer: expect.any(String),
      sources: expect.any(Array),
    });
    expect(response.body[1]).toMatchObject({
      projectId,
      question: "¿Segunda pregunta?",
    });
    expect(response.body[0].createdAt).toEqual(expect.any(String));
  });

  it("returns an empty history for a project without questions", async () => {
    const accessToken = await registerAndLogin("history-empty");
    const projectId = await createProject(accessToken);

    const response = await request(app)
      .get(`/projects/${projectId}/history`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });

  it("returns 401 when requesting history without a token", async () => {
    const response = await request(app).get("/projects/project-1/history");

    expect(response.status).toBe(401);
  });

  it("returns 404 when requesting history of another user's project", async () => {
    const ownerAccessToken = await registerAndLogin("history-owner-private");
    const projectId = await createProject(ownerAccessToken);

    await ask(ownerAccessToken, projectId, "¿Pregunta privada?");

    const intruderAccessToken = await registerAndLogin("history-intruder");

    const response = await request(app)
      .get(`/projects/${projectId}/history`)
      .set("Authorization", `Bearer ${intruderAccessToken}`);

    expect(response.status).toBe(404);
  });
});
