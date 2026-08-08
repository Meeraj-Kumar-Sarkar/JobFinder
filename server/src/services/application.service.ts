import Application from "../models/Application";
import Job from "../models/Job";
import { ApiError } from "../utils/ApiError";

export async function applyForJob(data: any) {
  const exists = await Application.findOne({
    candidate: data.candidate,
    job: data.job,
  });

  if (exists) {
    throw new ApiError(409, "Already applied");
  }

  const application = await Application.create(data);

  await Job.findByIdAndUpdate(data.job, {
    $inc: {
      applicants: 1,
    },
  });

  return application;
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
