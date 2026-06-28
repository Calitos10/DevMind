import { Router } from "express";
import { container } from "../../../container/container";
import { asyncHandler } from "../middleware/asyncHandler";
import { authMiddleware } from "../middleware/authMiddleware";
import { validateBody } from "../middleware/validateBodyMiddleware";
import { AuthController } from "../auth/authController";
import { loginSchema, registerSchema } from "../auth/authSchema";

export const authRoutes = Router();

const authController = new AuthController(
  container.registerUserUseCase,
  container.loginUserUseCase,
  container.getCurrentUserUseCase,
);

authRoutes.post(
  "/register",
  validateBody(registerSchema),
  asyncHandler((req, res, next) => authController.register(req, res)),
);

authRoutes.post(
  "/login",
  validateBody(loginSchema),
  asyncHandler((req, res, next) => authController.login(req, res)),
);

authRoutes.get(
  "/me",
  authMiddleware,
  asyncHandler((req, res, next) => authController.me(req, res)),
);
