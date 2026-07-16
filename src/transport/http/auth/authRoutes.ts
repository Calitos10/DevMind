//Fichero que construye el ruter que usa route.ts para la parte de auth
//Contruye el controlador y en cada endpoint despues de verificarlo, se lo pasa al metodo del controlador que convenga
import { Router } from "express";
import { container } from "../../../container/container";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";
import { authRateLimitMiddleware } from "../middleware/authRateLimitMiddleware";
import { validateBody } from "../middleware/validateBodyMiddleware";
import { AuthController } from "./authController";
import { loginSchema, registerSchema } from "./authSchemas";

export const authRoutes = Router();

const authController = new AuthController(
  container.registerUserUseCase,
  container.loginUserUseCase,
  container.getCurrentUserUseCase,
);

authRoutes.post(
  "/register",
  authRateLimitMiddleware,
  validateBody(registerSchema),
  asyncHandler((req, res, next) => authController.register(req, res)),
);

authRoutes.post(
  "/login",
  authRateLimitMiddleware,
  validateBody(loginSchema),
  asyncHandler((req, res, next) => authController.login(req, res)),
);

authRoutes.get(
  "/me",
  authMiddleware,
  asyncHandler((req, res, next) => authController.me(req, res)),
);
