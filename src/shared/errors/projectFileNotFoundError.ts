import { AppError } from "./appError";

export class ProjectFileNotFoundError extends AppError {
  constructor() {
    super("Project file not found", 404);
  }
}