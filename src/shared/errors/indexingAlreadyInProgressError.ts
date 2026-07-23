import { AppError } from "./appError";

export class IndexingAlreadyInProgressError extends AppError {
  constructor() {
    super("Indexing is already in progress for this project", 409);
  }
}
