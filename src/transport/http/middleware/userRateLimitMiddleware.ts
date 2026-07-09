import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import { env } from "../../../infrastructure/config/env";
import { AuthenticatedRequest } from "../types/authenticatedRequest";

// Crea un rate limit pensado para rutas caras (llaman a Gemini o consumen
// muchos recursos). A diferencia del rate limit de auth, este se aplica DESPUÉS
// de authMiddleware, por lo que puede limitar por usuario autenticado en lugar
// de solo por IP. Si por algún motivo no hubiera usuario, cae a la IP.
export const createUserRateLimitMiddleware = (options: {
  max: number;
  windowMinutes: number;
}) =>
  rateLimit({
    windowMs: options.windowMinutes * 60 * 1000,
    limit: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
    skip: () => env.nodeEnv === "test",
    keyGenerator: (req) => {
      const userId = (req as AuthenticatedRequest).user?.userId;

      return userId ?? ipKeyGenerator(req.ip ?? "");
    },
  });

export const askRateLimitMiddleware = createUserRateLimitMiddleware(
  env.askRateLimit,
);

export const uploadRateLimitMiddleware = createUserRateLimitMiddleware(
  env.uploadRateLimit,
);
