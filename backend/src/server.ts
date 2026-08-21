import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.PORT, () => {
  console.log(`Backend berjalan pada http://localhost:${env.PORT}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} diterima. Menghentikan server...`);

  server.close(() => {
    console.log("Server berhenti.");
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));