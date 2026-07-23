import { AppError } from "./appError";

export class UserNotFoundError extends AppError {
  constructor() {
    super("User not found", 404);
  }
}