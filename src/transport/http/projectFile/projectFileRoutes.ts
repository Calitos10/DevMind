import { Router } from "express";

import { authMiddleware } from "../middleware/authMiddleware";
import { asyncHandler } from "../middleware/asyncHandler";
import { ProjectFileController } from "./projectFileController";
import { container } from "../../../container/container";

const projectFileController = new ProjectFileController(
  container.listProjectFilesUseCase,
  container.getProjectFileByIdUseCase,
  container.deleteProjectFileUseCase,
);

export const projectFileRoutes = Router();

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
