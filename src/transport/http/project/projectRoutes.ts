import { Router } from "express";

import { ProjectController } from "./projectController";
import { projectSchema } from "./projectSchemas";
import { authMiddleware } from "../../http/middleware/authMiddleware";
import { validateBody } from "../../http/middleware/validateBodyMiddleware";
import { asyncHandler } from "../../http/middleware/asyncHandler";

import multer from "multer";

export const projectRoutes = Router();

const projectController = new ProjectController();

const upload = multer({
  storage: multer.memoryStorage(),
});

projectRoutes.post(
  "/",
  authMiddleware,
  validateBody(projectSchema),
  asyncHandler((req, res) => projectController.create(req, res)),
);

projectRoutes.post(
  "/:id/upload",
  authMiddleware,
  upload.single("file"),
  asyncHandler((req, res) => projectController.uploadZip(req, res)),
);

projectRoutes.get(
  "/",
  authMiddleware,
  asyncHandler((req, res) => projectController.list(req, res)),
);

projectRoutes.get(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) => projectController.getById(req, res)),
);

projectRoutes.delete(
  "/:id",
  authMiddleware,
  asyncHandler((req, res) => projectController.delete(req, res)),
);
