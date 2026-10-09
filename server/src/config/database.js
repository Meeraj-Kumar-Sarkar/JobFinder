import mongoose from "mongoose";

import { env } from "./env.js";

export async function connectDatabase() {
  try {
    await mongoose.connect(env.MONGODB_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed");

    console.error(error);

    process.exit(1);
  }
}
