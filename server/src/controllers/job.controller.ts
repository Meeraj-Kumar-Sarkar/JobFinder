import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

import * as JobService from "../services/job.service";

export const createJob = asyncHandler(async (req, res) => {
  const companyId = req.body.company || req.user?.company;
  const jobPayload: Record<string, any> = {
    ...req.body,
    createdBy: req.user!._id || req.user!.id,
  };
  if (companyId) {
    jobPayload.company = companyId;
  }

  const job = await JobService.createJob(jobPayload);

  return res.status(201).json(new ApiResponse("Job created successfully", job));
});

export const getJobs = asyncHandler(async (_req, res) => {
  const jobs = await JobService.getJobs();

  return res.json(new ApiResponse("Jobs fetched successfully", jobs));
});

export const getMyJobs = asyncHandler(async (req, res) => {
  const jobs = await JobService.getMyJobs(req.user!._id || req.user!.id);

  return res.json(new ApiResponse("Employer jobs fetched successfully", jobs));
});

export const getJobApplications = asyncHandler(async (req, res) => {
  const applications = await JobService.getJobApplications(req.params.id);

  return res.json(
    new ApiResponse("Job applications fetched successfully", applications),
  );
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

