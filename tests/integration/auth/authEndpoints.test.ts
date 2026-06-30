import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../../../src/app";

describe("Auth HTTP endpoints", () => {
  it("POST /auth/register should register a new user", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "carlos-register@example.com",
      password: "123456",
    });

    expect(response.status).toBe(201);

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Carlos",
      email: "carlos-register@example.com",
    });

    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it("POST /auth/register should return 400 when body is invalid", async () => {
    const response = await request(app).post("/auth/register").send({
      name: "",
      email: "bad-email",
      password: "1",
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Validation error");
    expect(response.body.errors).toBeDefined();
  });

  it("POST /auth/register should return 409 when email is already used", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "carlos-duplicate@example.com",
      password: "123456",
    });

    const response = await request(app).post("/auth/register").send({
      name: "Carlos 2",
      email: "carlos-duplicate@example.com",
      password: "abcdef",
    });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "User already exists",
    });
  });

  it("POST /auth/login should login with valid credentials", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "carlos-login@example.com",
      password: "123456",
    });

    const response = await request(app).post("/auth/login").send({
      email: "carlos-login@example.com",
      password: "123456",
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Carlos",
      email: "carlos-login@example.com",
    });
  });

  it("POST /auth/login should return 401 with invalid credentials", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "carlos-invalid-login@example.com",
      password: "123456",
    });

    const response = await request(app).post("/auth/login").send({
      email: "carlos-invalid-login@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Invalid credentials",
    });
  });

  it("GET /auth/me should return 401 without token", async () => {
    const response = await request(app).get("/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      message: "Unauthorized",
    });
  });

  it("GET /auth/me should return current user with valid token", async () => {
    await request(app).post("/auth/register").send({
      name: "Carlos",
      email: "carlos-me@example.com",
      password: "123456",
    });

    const loginResponse = await request(app).post("/auth/login").send({
      email: "carlos-me@example.com",
      password: "123456",
    });

    const token = loginResponse.body.accessToken;

    const response = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.user).toEqual({
      id: expect.any(String),
      name: "Carlos",
      email: "carlos-me@example.com",
    });
  });
});