import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;

  MONGODB_URI: string;

  FIREBASE_PROJECT_ID: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;

  FIREBASE_STORAGE_BUCKET: string;

  CLIENT_URL: string;
}

const requiredEnv = [
  "MONGO_URI",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
  "CLIENT_URL",
];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
});

export const env: EnvConfig = {
  PORT: Number(process.env.PORT) || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGODB_URI: process.env.MONGODB_URI!,

  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID!,

  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL!,

  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),

  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET!,

  CLIENT_URL: process.env.CLIENT_URL!,
};
