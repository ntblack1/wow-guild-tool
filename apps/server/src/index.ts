import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { prisma } from "./lib/prisma.js";

const env = getEnv();
const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`wow-guild-tool server listening on http://localhost:${env.port}`);
});

const shutdown = async () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
