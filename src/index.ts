import { createServer } from "./server";
import { createAdminServer } from "./admin/adminServer";
import { KeyValueStore } from "./store/store";
import { Stats } from "./stats/stats";

const PORT = Number(process.env.PORT ?? 6379);
const ADMIN_PORT = Number(process.env.ADMIN_PORT ?? 6380);

const store = new KeyValueStore();
const stats = new Stats();

const server = createServer(store, stats);
const adminServer = createAdminServer(store, stats);

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

adminServer.on("error", (err) => {
  console.error("Admin server error:", err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`VoltStore listening on port ${PORT}`);
});

adminServer.listen(ADMIN_PORT, () => {
  console.log(`VoltStore admin/metrics API listening on http://localhost:${ADMIN_PORT}/stats`);
});

process.on("SIGINT", () => {
  console.log("\nShutting down VoltStore...");
  server.close(() => {
    adminServer.close(() => process.exit(0));
  });
});
