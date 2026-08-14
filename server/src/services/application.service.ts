import Application from "../models/Application";
import Job from "../models/Job";
import { ApiError } from "../utils/ApiError";

export async function applyForJob(data: any) {
  const jobId = data.job || data.jobId;
  const exists = await Application.findOne({
    candidate: data.candidate,
    job: jobId,
  });

  if (exists) {
    throw new ApiError(409, "Already applied to this job");
  }

  const application = await Application.create({
    ...data,
    job: jobId,
  });

  await Job.findByIdAndUpdate(jobId, {
    $inc: {
      applicants: 1,
    },
  });

  return application;
}

export async function getMyApplications(candidateId: string) {
  return Application.find({ candidate: candidateId })
    .populate({
      path: "job",
      populate: { path: "company" },
    })
    .sort({ createdAt: -1 });
}

export async function updateStatus(applicationId: string, status: string) {
  return Application.findByIdAndUpdate(
    applicationId,
    {
      status,
    },
    {
      new: true,
    },
  );
}

