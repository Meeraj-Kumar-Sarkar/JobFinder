import Job from "../models/Job";
import Application from "../models/Application";

export async function createJob(data: any) {
  return Job.create(data);
}

export async function getJobs() {
  return Job.find().populate("company").sort({
    createdAt: -1,
  });
}

export async function getMyJobs(employerId: string) {
  return Job.find({ createdBy: employerId })
    .populate("company")
    .sort({ createdAt: -1 });
}

export async function getJobApplications(jobId: string) {
  return Application.find({ job: jobId })
    .populate("candidate")
    .populate("job")
    .sort({ createdAt: -1 });
}

export async function getJob(id: string) {
  return Job.findById(id).populate("company");
}

export async function updateJob(id: string, payload: any) {
  return Job.findByIdAndUpdate(id, payload, {
    new: true,
  });
}

export async function deleteJob(id: string) {
  return Job.findByIdAndDelete(id);
}

