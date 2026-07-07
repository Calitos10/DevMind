import { AppError } from "./appError";

export class InvalidCredentialsError extends AppError {
  constructor() {
    super("Invalid credentials", 401);
  }
}