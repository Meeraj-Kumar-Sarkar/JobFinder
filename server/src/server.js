import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { seedDatabase } from "./config/seed.js";
import { env } from "./config/env.js";

const PORT = env.PORT || 5000;

const startServer = async () => {
  await connectDatabase();
  if (process.env.SEED_DEMO_DATA === "true") {
    await seedDatabase();
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
