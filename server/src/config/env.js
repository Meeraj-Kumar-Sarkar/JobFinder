import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const requiredEnv = [
  "MONGODB_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  // "FIREBASE_DATABASE_URL",
  // "FIREBASE_STORAGE_BUCKET",
  "CLIENT_URL",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

export const env = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI: process.env.MONGODB_URI,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,

  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,

  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  FIREBASE_DATABASE_URL:
    process.env.FIREBASE_DATABASE_URL ||
    `https://${process.env.FIREBASE_PROJECT_ID || "jobportal"}-default-rtdb.firebaseio.com`,

  //FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,

  CLIENT_URL: process.env.CLIENT_URL,
};
