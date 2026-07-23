import { NextFunction, Request, Response } from "express";
import { treeifyError, ZodType } from "zod";

export const validateBody = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation error",
        errors: treeifyError(result.error),
      });
    }

    req.body = result.data;
    return next();
  };
};
