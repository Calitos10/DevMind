import type {
  TokenPayload,
  TokenService,
} from "../../src/application/ports/tokenService";

export class FakeTokenService implements TokenService {
  async sign(payload: TokenPayload): Promise<string> {
    return `token-for-${payload.userId}`;
  }

  async verify(token: string): Promise<TokenPayload> {
    const userId = token.replace("token-for-", "");

    return {
      userId,
      email: "carlos@example.com",
    };
  }
}
