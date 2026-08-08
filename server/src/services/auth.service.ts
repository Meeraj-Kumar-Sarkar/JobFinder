import User from "../models/User";
import { ApiError } from "../utils/ApiError";

interface RegisterUserInput {
  firebaseUID: string;
  name: string;
  email: string;
  role: "candidate" | "employer";
}

export async function registerUser(data: RegisterUserInput) {
  const existingUser = await User.findOne({
    firebaseUID: data.firebaseUID,
  });

  if (existingUser) {
    throw new ApiError(409, "User already exists");
  }

  const user = await User.create(data);

  return user;
}

export async function getCurrentUser(firebaseUID: string) {
  const user = await User.findOne({ firebaseUID });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
}
