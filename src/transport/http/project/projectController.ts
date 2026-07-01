import type { Request, Response } from "express";

import { container } from "../../../container/container";
import type { AuthenticatedRequest } from "../types/authenticatedRequest";

export class ProjectController {
  async create(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const project = await container.createProjectUseCase.execute({
      ownerId: authenticatedReq.user.userId,
      name: authenticatedReq.body.name,
      description: authenticatedReq.body.description,
    });

    return res.status(201).json(project);
  }

  async list(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;
    const projects = await container.listUserProjectsUseCase.execute({
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(200).json(projects);
  }

  async getById(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;
    const project = await container.getProjectByIdUseCase.execute({
      projectId: authenticatedReq.params.id as string,
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(200).json(project);
  }

  async delete(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    const projectId = authenticatedReq.params.id as string;

    await container.deleteProjectUseCase.execute({
      projectId,
      ownerId: authenticatedReq.user.userId,
    });

    return res.status(204).send();
  }

  async uploadZip(req: Request, res: Response) {
    const authenticatedReq = req as AuthenticatedRequest;

    if (!authenticatedReq.file) {
      return res.status(400).json({
        message: "Zip file is required",
      });
    }

    const result = await container.uploadProjectZipUseCase.execute({
      projectId: authenticatedReq.params.id as string,
      ownerId: authenticatedReq.user.userId,
      zipBuffer: authenticatedReq.file.buffer,
    });

    return res.status(201).json(result);
  }
}
