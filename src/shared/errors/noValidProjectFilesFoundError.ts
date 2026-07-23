import { AppError } from "./appError";

export class NoValidProjectFilesFoundError extends AppError {
  constructor() {
    super("No valid project files found", 400);
  }
}
