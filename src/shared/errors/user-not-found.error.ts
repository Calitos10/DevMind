import { AppError } from "./app-error";

export class UserNotFoundError extends AppError {
  constructor() {
    super("User not found", 404);
  }
}