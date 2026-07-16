import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("web builds always launch Vite with React production mode", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "apps", "web", "package.json"), "utf8"));
  const buildScript = fs.readFileSync(path.join(projectRoot, "scripts", "vite-production-build.mjs"), "utf8");

  assert.match(packageJson.scripts.build, /vite-production-build\.mjs/);
  assert.match(buildScript, /NODE_ENV:\s*"production"/);
});

test("Cloudflare Pages sends direct guild routes through the React app", () => {
  const redirects = fs.readFileSync(path.join(projectRoot, "apps", "web", "public", "_redirects"), "utf8").trim();

  assert.equal(redirects, "/* /index.html 200");
});
