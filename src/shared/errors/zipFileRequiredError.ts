import { AppError } from "./appError";

export class ZipFileRequiredError extends AppError {
  constructor() {
    super("Zip file is required", 400);
  }
}
