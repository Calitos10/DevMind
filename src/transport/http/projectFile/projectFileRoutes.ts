import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { validateBody } from "../middleware/validateBodyMiddleware";
import { ProjectFileController } from "./projectFileController";
import { projectFileSchema } from "./projectFileSchemas";

const projectFileController = new ProjectFileController();

export const projectFileRoutes = Router();

projectFileRoutes.post(
  "/:projectId/files",
  authMiddleware,
  validateBody(projectFileSchema),
  asyncHandler((req, res, next) => projectFileController.create(req, res)),
);

projectFileRoutes.get(
  "/:projectId/files",
  authMiddleware,
  asyncHandler((req, res) => projectFileController.list(req, res)),
);

projectFileRoutes.get(
  "/:projectId/files/:fileId",
  authMiddleware,
  asyncHandler((req, res) => projectFileController.getById(req, res)),
);

projectFileRoutes.delete(
  "/:projectId/files/:fileId",
  authMiddleware,
  asyncHandler((req, res) => projectFileController.delete(req, res)),
);
