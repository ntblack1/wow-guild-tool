import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = path.join(projectRoot, "apps", "web");
const viteCli = path.join(projectRoot, "node_modules", "vite", "bin", "vite.js");

const result = spawnSync(process.execPath, [viteCli, "build"], {
  cwd: webRoot,
  env: { ...process.env, NODE_ENV: "production" },
  stdio: "inherit",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
