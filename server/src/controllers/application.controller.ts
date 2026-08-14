import { asyncHandler } from "../utils/asyncHandler";
import { ApiResponse } from "../utils/ApiResponse";

import * as ApplicationService from "../services/application.service";

export const applyJob = asyncHandler(async (req, res) => {
  const application = await ApplicationService.applyForJob({
    ...req.body,
    candidate: req.user!._id || req.user!.id,
  });

  return res
    .status(201)
    .json(new ApiResponse("Application submitted successfully", application));
});

export const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await ApplicationService.getMyApplications(
    req.user!._id || req.user!.id,
  );

  return res.json(
    new ApiResponse("Applications fetched successfully", applications),
  );
});

export const updateStatus = asyncHandler(async (req, res) => {
  const application = await ApplicationService.updateStatus(
    req.params.id,
    req.body.status,
  );

  return res.json(
    new ApiResponse("Application updated successfully", application),
  );
});

