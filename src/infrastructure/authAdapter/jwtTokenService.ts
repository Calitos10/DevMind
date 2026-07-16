import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { TokenPayload, TokenService } from "../../application/ports/tokenService";
import { UnauthorizedError } from "../../shared/errors/unauthorizedError";
import { env } from "../config/env";

export class JwtTokenService implements TokenService {
  async sign(payload: TokenPayload): Promise<string> {
    const options: SignOptions = {
      expiresIn: env.jwt.expiresIn as SignOptions["expiresIn"],
      algorithm: "HS256",
    };

    return jwt.sign(payload, env.jwt.secret, options);
  }

  async verify(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, env.jwt.secret, {
        algorithms: ["HS256"],
      });

      if (typeof decoded === "string") {
        throw new UnauthorizedError();
      }

      const payload = decoded as JwtPayload;

      if (!payload.userId || !payload.email) {
        throw new UnauthorizedError();
      }

      return {
        userId: String(payload.userId),
        email: String(payload.email),
      };
    } catch {
      throw new UnauthorizedError();
    }
  }
}