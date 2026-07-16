import express, { type RequestHandler } from "express";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { authRateLimitMiddleware } from "../../../src/transport/http/middleware/authRateLimitMiddleware";
import {
  askRateLimitMiddleware,
  uploadRateLimitMiddleware,
  indexRateLimitMiddleware,
} from "../../../src/transport/http/middleware/userRateLimitMiddleware";
import { env } from "../../../src/infrastructure/config/env";

// Los rate limiters se desactivan cuando env.nodeEnv === "test" (para no
// interferir con el resto de la suite). Ese `skip` se evalúa en cada petición,
// así que basta con cambiar env.nodeEnv temporalmente para activarlos aquí y
// poder comprobar de verdad que disparan el 429. Se restaura al terminar.
const originalNodeEnv = env.nodeEnv;

beforeAll(() => {
  env.nodeEnv = "development";
});

afterAll(() => {
  env.nodeEnv = originalNodeEnv;
});

// Monta un middleware real de rate limit sobre una ruta trivial, para probar el
// límite de forma aislada, sin depender de auth, base de datos ni proyectos.
function buildAppWith(middleware: RequestHandler) {
  const app = express();

  app.get("/limited", middleware, (_req, res) => {
    res.status(200).json({ ok: true });
  });

  return app;
}

// Dispara `max` peticiones que deben pasar (200) y una más que debe ser
// rechazada con 429 por el rate limit.
async function expectRateLimitedAfter(
  middleware: RequestHandler,
  max: number,
) {
  const app = buildAppWith(middleware);

  for (let index = 0; index < max; index += 1) {
    const response = await request(app).get("/limited");

    expect(response.status).toBe(200);
  }

  const blocked = await request(app).get("/limited");

  expect(blocked.status).toBe(429);
  expect(blocked.body.message).toBe(
    "Too many requests, please try again later",
  );
}

describe("Rate limit middlewares", () => {
  it("blocks with 429 after exceeding the auth rate limit", async () => {
    await expectRateLimitedAfter(
      authRateLimitMiddleware,
      env.authRateLimit.max,
    );
  });

  it("blocks with 429 after exceeding the ask rate limit", async () => {
    await expectRateLimitedAfter(askRateLimitMiddleware, env.askRateLimit.max);
  });

  it("blocks with 429 after exceeding the upload rate limit", async () => {
    await expectRateLimitedAfter(
      uploadRateLimitMiddleware,
      env.uploadRateLimit.max,
    );
  });

  it("blocks with 429 after exceeding the index rate limit", async () => {
    await expectRateLimitedAfter(
      indexRateLimitMiddleware,
      env.indexRateLimit.max,
    );
  });
});
