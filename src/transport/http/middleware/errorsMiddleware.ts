import { ErrorRequestHandler } from "express";
import { MulterError } from "multer";
import { AppError } from "../../../shared/errors/appError";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  if (error instanceof MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "Zip file exceeds the maximum allowed size",
    });
  }

  console.error(error);

  return res.status(500).json({
    message: "Internal server error",
  });
};