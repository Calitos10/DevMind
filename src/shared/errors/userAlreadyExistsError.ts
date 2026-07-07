import { AppError } from "./appError";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("User already exists", 409);
  }
}