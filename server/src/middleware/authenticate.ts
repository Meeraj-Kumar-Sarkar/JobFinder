import { Request, Response, NextFunction } from "express";

import { firebaseAuth } from "../config/firebase";
import User from "../models/User";
import { ApiError } from "../utils/ApiError";

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.split(" ")[1];

    const decoded = await firebaseAuth.verifyIdToken(token);

    const user = await User.findOne({
      firebaseUID: decoded.uid,
    });

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
}
