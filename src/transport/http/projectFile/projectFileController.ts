import { Request, Response } from "express";

import { container } from "../../../container/container";
import { AuthenticatedRequest } from "../types/authenticatedRequest";

export class ProjectFileController {
  async create(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;

    const projectFile = await container.createProjectFileUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
      path: authenticatedReq.body.path,
      language: authenticatedReq.body.language,
      content: authenticatedReq.body.content,
    });

    return res.status(201).json(projectFile);
  }

  async list(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;

    const projectFiles = await container.listProjectFilesUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
    });

    return res.status(200).json(projectFiles);
  }

  async getById(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;
    const fileId = authenticatedReq.params.fileId as string;

    const projectFile = await container.getProjectFileByIdUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
      fileId,
    });

    return res.status(200).json(projectFile);
  }

  async delete(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;
    const fileId = authenticatedReq.params.fileId as string;

    await container.deleteProjectFileUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
      fileId,
    });

    return res.status(204).send();
  }
}
