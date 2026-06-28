import { NextFunction, Request, Response } from "express";
import { container } from "../../../container/container";
import { UnauthorizedError } from "../../../shared/errors/unauthorized.error";
import { AuthenticatedRequest } from "../types/authenticatedRequest";

export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError();
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      throw new UnauthorizedError();
    }

    const payload = await container.tokenService.verify(token);

    (req as AuthenticatedRequest).user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    next(error);
  }
};