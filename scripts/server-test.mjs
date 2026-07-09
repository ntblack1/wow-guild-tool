import { spawnSync } from "node:child_process";
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
const vitestBin = path.join(
  rootDir,
  "node_modules",
  ".bin",
  isWindows ? "vitest.cmd" : "vitest"
);

const env = {
  ...process.env,
  DATABASE_URL: "file:./test.db",
  NODE_ENV: "test"
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env,
    stdio: "inherit",
    shell: isWindows,
    ...options
  });

  if (result.signal) {
    process.kill(process.pid, result.signal);
    return 1;
  }

  return result.status ?? 1;
};

let code = run(prismaBin, ["db", "push", "--schema", "prisma/schema.prisma", "--skip-generate"]);
if (code !== 0) {
  process.exit(code);
}

code = run(vitestBin, ["run", ...process.argv.slice(2)], {
  cwd: path.join(rootDir, "apps", "server")
});

process.exit(code);
