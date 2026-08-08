import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./routes";

import { notFound, errorHandler } from "./middleware";


const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Job Portal API is running",
  });
});

app.use("/api", router);

app.use(notFound);

app.use(errorHandler);

export default app;
