import { Request, Response } from "express";

import { AuthenticatedRequest } from "../types/authenticatedRequest";
import { CreateProjectFileUseCase } from "../../../application/projectFiles/createProjectFileUseCase";
import { ListProjectFilesUseCase } from "../../../application/projectFiles/listProjectFilesUseCase";
import { GetProjectFileByIdUseCase } from "../../../application/projectFiles/getProjectFileByIdUseCase";
import { DeleteProjectFileUseCase } from "../../../application/projectFiles/deleteProjectFileUseCase";

export class ProjectFileController {
  constructor(
    private readonly createProjectFileUseCase: CreateProjectFileUseCase,
    private readonly listProjectFilesUseCase: ListProjectFilesUseCase,
    private readonly getProjectFileByIdUseCase: GetProjectFileByIdUseCase,
    private readonly deleteProjectFileUseCase: DeleteProjectFileUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;

    const projectFile = await this.createProjectFileUseCase.execute({
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

    const projectFiles = await this.listProjectFilesUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
    });

    return res.status(200).json(projectFiles);
  }

  async getById(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.projectId as string;
    const fileId = authenticatedReq.params.fileId as string;

    const projectFile = await this.getProjectFileByIdUseCase.execute({
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

    await this.deleteProjectFileUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      projectId,
      fileId,
    });

    return res.status(204).send();
  }
}
