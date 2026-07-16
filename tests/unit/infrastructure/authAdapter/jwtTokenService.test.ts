import { describe, expect, it } from "vitest";
import { JwtTokenService } from "../../../../src/infrastructure/authAdapter/jwtTokenService";
import { UnauthorizedError } from "../../../../src/shared/errors/unauthorizedError";

describe("JwtTokenService", () => {
  it("should sign and verify a token", async () => {
    const tokenService = new JwtTokenService();

    const token = await tokenService.sign({
      userId: "user-1",
      email: "carlos@example.com",
    });

    const payload = await tokenService.verify(token);

    expect(payload).toEqual({
      userId: "user-1",
      email: "carlos@example.com",
    });
  });

  it("should throw UnauthorizedError when token is invalid", async () => {
    const tokenService = new JwtTokenService();

    await expect(tokenService.verify("invalid-token")).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});