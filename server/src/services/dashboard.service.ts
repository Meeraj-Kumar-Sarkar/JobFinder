import Job from "../models/Job";
import Application from "../models/Application";

export async function employerDashboard(employerId: string) {
  const totalJobs = await Job.countDocuments({
    createdBy: employerId,
  });

  const activeJobs = await Job.countDocuments({
    createdBy: employerId,
    status: "active",
  });

  const jobIds = await Job.find({ createdBy: employerId }).distinct("_id");

  const totalApplications = await Application.countDocuments({
    job: { $in: jobIds },
  });

  const recentApplications = await Application.find({
    job: { $in: jobIds },
  })
    .populate("candidate")
    .populate("job")
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    totalJobs,
    activeJobs,
    totalApplications,
    recentApplications,
  };
}

