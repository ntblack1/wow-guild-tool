import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const prismaBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  isWindows ? "prisma.cmd" : "prisma"
);
const rustLog = ["info", "debug", "trace"].includes(process.env.RUST_LOG ?? "")
  ? process.env.RUST_LOG
  : "info";

const child = spawn(
  prismaBin,
  ["migrate", "dev", "--schema", "prisma/schema.prisma", "--name", "init"],
  {
    cwd: rootDir,
    env: {
      ...process.env,
      RUST_LOG: rustLog
    },
    stdio: "inherit",
    shell: isWindows
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
