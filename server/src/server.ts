import app from "./app";

import { connectDatabase } from "./config/database";
import { env } from "./config/env";

async function startServer() {
  try {
    await connectDatabase();

    app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);

      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);

    process.exit(1);
  }
}

startServer();
