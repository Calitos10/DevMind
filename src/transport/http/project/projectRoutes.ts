//Fichero que construye el ruter que route.ts usa para la parte de proyectos
//Crea el controlador apartir del fichero controlador pasandole mediante el container las dependencias que neceista
import { Router } from "express";

import { ProjectController } from "./projectController";
import { projectSchema, askProjectQuestionSchema } from "./projectSchemas";
import { authMiddleware } from "../../http/middleware/authMiddleware";
import { validateBody } from "../../http/middleware/validateBodyMiddleware";
import { asyncHandler } from "../../http/middleware/asyncHandler";
import {
  askRateLimitMiddleware,
  uploadRateLimitMiddleware,
  indexRateLimitMiddleware,
} from "../../http/middleware/userRateLimitMiddleware";
import { container } from "../../../container/container";
import { env } from "../../../infrastructure/config/env";

import multer from "multer";

export const projectRoutes = Router();

const projectController = new ProjectController(
  container.createProjectUseCase,
  container.listUserProjectsUseCase,
  container.getProjectByIdUseCase,
  container.deleteProjectUseCase,
  container.uploadProjectZipUseCase,
  container.indexProjectEmbeddingsUseCase,
  container.getProjectIndexingStatusUseCase,
  container.askProjectQuestionUseCase,
  container.getProjectConversationHistoryUseCase,
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.upload.maxZipSizeMb * 1024 * 1024,
  },
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
  uploadRateLimitMiddleware,
  upload.single("file"),
  asyncHandler((req, res) => projectController.uploadZip(req, res)),
);

projectRoutes.post(
  "/:id/index",
  authMiddleware,
  indexRateLimitMiddleware,
  asyncHandler((req, res) => projectController.index(req, res)),
);
projectRoutes.get(
  "/:id/indexing-status",
  authMiddleware,
  asyncHandler((req, res) => projectController.getIndexingStatus(req, res)),
);

projectRoutes.post(
  "/:id/ask",
  authMiddleware,
  askRateLimitMiddleware,
  validateBody(askProjectQuestionSchema),
  asyncHandler((req, res) => projectController.ask(req, res)),
);

projectRoutes.get(
  "/:id/history",
  authMiddleware,
  asyncHandler((req, res) => projectController.history(req, res)),
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
