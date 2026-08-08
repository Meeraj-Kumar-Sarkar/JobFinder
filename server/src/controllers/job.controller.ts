import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

import * as JobService from "../services/job.service";

export const createJob = asyncHandler(async (req, res) => {
  const job = await JobService.createJob({
    ...req.body,
    createdBy: req.user!.id,
  });

  return res.status(201).json(new ApiResponse("Job created successfully", job));
});

export const getJobs = asyncHandler(async (_req, res) => {
  const jobs = await JobService.getJobs();

  return res.json(new ApiResponse("Jobs fetched successfully", jobs));
});

export const getJob = asyncHandler(async (req, res) => {
  const job = await JobService.getJob(req.params.id);

  return res.json(new ApiResponse("Job fetched successfully", job));
});

export const updateJob = asyncHandler(async (req, res) => {
  const job = await JobService.updateJob(req.params.id, req.body);

  return res.json(new ApiResponse("Job updated successfully", job));
});

export const deleteJob = asyncHandler(async (req, res) => {
  await JobService.deleteJob(req.params.id);

  return res.json(new ApiResponse("Job deleted successfully"));
});
