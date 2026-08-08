import { ZodSchema } from "zod";

import { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils/ApiError";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return next(new ApiError(400, result.error.message));
    }

    req.body = result.data;

    next();
  };
}
