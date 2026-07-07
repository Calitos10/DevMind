import type { Request, Response } from "express";

import type { AuthenticatedRequest } from "../types/authenticatedRequest";
import { ZipFileRequiredError } from "../../../shared/errors/zipFileRequiredError";
import { CreateProjectUseCase } from "../../../application/projects/createProjectUseCase";
import { ListUserProjectsUseCase } from "../../../application/projects/listUserProjectsUseCase";
import { GetProjectByIdUseCase } from "../../../application/projects/getProjectByIdUseCase";
import { DeleteProjectUseCase } from "../../../application/projects/deleteProjectUseCase";
import { UploadProjectZipUseCase } from "../../../application/uploadZip/uploadProjectZipUseCase";

export class ProjectController {
  constructor(
    private readonly createProjectUseCase: CreateProjectUseCase,
    private readonly listUserProjectsUseCase: ListUserProjectsUseCase,
    private readonly getProjectByIdUseCase: GetProjectByIdUseCase,
    private readonly deleteProjectUseCase: DeleteProjectUseCase,
    private readonly uploadProjectZipUseCase: UploadProjectZipUseCase,
  ) {}

  async create(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const project = await this.createProjectUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      name: authenticatedReq.body.name,
      description: authenticatedReq.body.description,
    });

    return res.status(201).json(project);
  }

  async list(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;
    const projects = await this.listUserProjectsUseCase.execute({
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(200).json(projects);
  }

  async getById(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;
    const project = await this.getProjectByIdUseCase.execute({
      projectId: authenticatedReq.params.id as string,
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(200).json(project);
  }

  async delete(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.id as string;

    await this.deleteProjectUseCase.execute({
      projectId,
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(204).send();
  }

  async uploadZip(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.file) {
      throw new ZipFileRequiredError();
    }

    const result = await this.uploadProjectZipUseCase.execute({
      projectId: authenticatedReq.params.id as string,
      ownerId: authenticatedReq.user.userId,
      zipBuffer: authenticatedReq.file.buffer,
    });

    return res.status(201).json(result);
  }
}
