import AdmZip from "adm-zip";
import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../../../src/app";

describe("POST /auth/guest", () => {
  it("creates a guest session without registration", async () => {
    const response = await request(app).post("/auth/guest").send();

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Invitado",
      email: expect.stringMatching(/^guest-.+@devmind\.local$/),
    });
    // No se expone el hash de contraseña.
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("lets a guest use the full pipeline: create project, upload ZIP and ask", async () => {
    const guestResponse = await request(app).post("/auth/guest").send();
    const accessToken = guestResponse.body.accessToken;

    // Crear proyecto con el token de invitado.
    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ name: "Proyecto invitado", description: "Prueba sin registro" });

    expect(createProjectResponse.status).toBe(201);

    const projectId = createProjectResponse.body.id;

    // Subir un ZIP.
    const zip = new AdmZip();
    zip.addFile("src/index.ts", Buffer.from("console.log('hola');", "utf8"));

    const uploadResponse = await request(app)
      .post(`/projects/${projectId}/upload`)
      .set("Authorization", `Bearer ${accessToken}`)
      .attach("file", zip.toBuffer(), {
        filename: "project.zip",
        contentType: "application/zip",
      });

    expect(uploadResponse.status).toBe(201);

    // Hablar con la IA (sin indexar aún: responde el fallback, pero funciona el flujo).
    const askResponse = await request(app)
      .post(`/projects/${projectId}/ask`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ question: "¿Qué hace este proyecto?" });

    expect(askResponse.status).toBe(200);
    expect(askResponse.body.answer).toEqual(expect.any(String));

    // El historial es un plus del registrado: al invitado NO se le guarda.
    const historyResponse = await request(app)
      .get(`/projects/${projectId}/history`)
      .set("Authorization", `Bearer ${accessToken}`);

    expect(historyResponse.status).toBe(200);
    expect(historyResponse.body).toEqual([]);
  });

  it("keeps guests isolated: one guest cannot see another guest's project", async () => {
    const firstGuest = await request(app).post("/auth/guest").send();
    const firstToken = firstGuest.body.accessToken;

    const createProjectResponse = await request(app)
      .post("/projects")
      .set("Authorization", `Bearer ${firstToken}`)
      .send({ name: "Privado", description: "Del primer invitado" });

    const projectId = createProjectResponse.body.id;

    const secondGuest = await request(app).post("/auth/guest").send();
    const secondToken = secondGuest.body.accessToken;

    const response = await request(app)
      .get(`/projects/${projectId}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(response.status).toBe(404);
  });
});
