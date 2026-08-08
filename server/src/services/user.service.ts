import User from "../models/User";
import { ApiError } from "../utils/ApiError";

export async function updateProfile(userId: string, payload: Partial<any>) {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
  });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

export async function saveJob(userId: string, jobId: string) {
  return User.findByIdAndUpdate(
    userId,
    {
      $addToSet: {
        savedJobs: jobId,
      },
    },
    {
      new: true,
    },
  );
}
