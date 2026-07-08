import { AppError } from "./appError";

export class QuestionIsRequired extends AppError {
  constructor() {
    super("Question is required", 404);
  }
}
