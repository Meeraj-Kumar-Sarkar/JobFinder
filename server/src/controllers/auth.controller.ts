import { Request, Response } from "express";

import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import * as AuthService from "../services/auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.registerUser(req.body);

  return res
    .status(201)
    .json(new ApiResponse("User registered successfully", user));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await AuthService.getCurrentUser(req.user!.firebaseUID);

  return res
    .status(200)
    .json(new ApiResponse("Current user fetched successfully", user));
});
