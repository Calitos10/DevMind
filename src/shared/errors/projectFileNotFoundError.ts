import { AppError } from "./app-error";

export class ProjectFileNotFoundError extends AppError {
  constructor() {
    super("Project file not found", 404);
  }
}