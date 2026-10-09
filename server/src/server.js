import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  connectDatabase();
  console.log(`Server running on http://localhost:${PORT}`);
});
