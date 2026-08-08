import { Request, Response, NextFunction } from "express";

import { ApiError } from "../utils/ApiError";

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, "Permission denied"));
    }

    next();
  };
}
