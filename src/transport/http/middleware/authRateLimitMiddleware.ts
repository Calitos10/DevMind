import rateLimit from "express-rate-limit";

import { env } from "../../../infrastructure/config/env";

export const authRateLimitMiddleware = rateLimit({
  windowMs: env.authRateLimit.windowMinutes * 60 * 1000,
  limit: env.authRateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later" },
  skip: () => env.nodeEnv === "test",
});
