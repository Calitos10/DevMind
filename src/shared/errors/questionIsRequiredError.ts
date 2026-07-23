import { AppError } from "./appError";

export class QuestionIsRequiredError extends AppError {
  constructor() {
    super("Question is required", 400);
  }
}
