import { AppError } from "./app-error";

export class ProjectNotFoundError extends AppError {
  constructor() {
    super("Project not found", 404);
  }
}