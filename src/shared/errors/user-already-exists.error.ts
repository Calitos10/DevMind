import { AppError } from "./app-error";

export class UserAlreadyExistsError extends AppError {
  constructor() {
    super("User already exists", 409);
  }
}