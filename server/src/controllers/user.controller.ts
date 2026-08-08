import { Request, Response } from "express";

import * as UserService from "../services/user.service";

import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
export const updateProfile = asyncHandler(async (req, res) => {
  const user = await UserService.updateProfile(req.user!.id, req.body);

  return res.json(new ApiResponse("Profile updated successfully", user));
});

export const saveJob = asyncHandler(async (req, res) => {
  const user = await UserService.saveJob(
    req.user!.id,
    req.params.jobId,
  );

  return res.json(new ApiResponse("Job saved successfully", user));
});
