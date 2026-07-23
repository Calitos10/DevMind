import { AppError } from "./appError";

export class UnauthorizedError extends AppError {
  constructor() {
    super("Unauthorized", 401);
  }
}
