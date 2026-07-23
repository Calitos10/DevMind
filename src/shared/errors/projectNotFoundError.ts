import { AppError } from "./appError";

export class ProjectNotFoundError extends AppError {
  constructor() {
    super("Project not found", 404);
  }
}