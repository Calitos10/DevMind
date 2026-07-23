import { AppError } from "./appError";

export class ZipTooLargeError extends AppError {
  constructor() {
    super("Uncompressed zip content exceeds the maximum allowed size", 400);
  }
}
