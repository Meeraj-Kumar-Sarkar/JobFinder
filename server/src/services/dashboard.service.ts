import Job from "../models/Job";
import Application from "../models/Application";

export async function employerDashboard(employerId: string) {
  const jobs = await Job.countDocuments({
    createdBy: employerId,
  });

  const jobIds = await Job.find({ createdBy: employerId }).distinct("_id");

  const applications = await Application.countDocuments({
    job: { $in: jobIds },
  });

  return {
    jobs,
    applications,
  };
}
