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

test("Cloudflare Pages applies browser security headers and immutable asset caching", () => {
  const headers = fs.readFileSync(path.join(projectRoot, "apps", "web", "public", "_headers"), "utf8");

  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Referrer-Policy: strict-origin-when-cross-origin/);
  assert.match(headers, /Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/);
  assert.match(headers, /\/assets\/\*[\s\S]*Cache-Control: public, max-age=31536000, immutable/);
});

test("the mobile web app manifest exposes the main guild shortcuts", () => {
  const html = fs.readFileSync(path.join(projectRoot, "apps", "web", "index.html"), "utf8");
  const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "apps", "web", "public", "manifest.webmanifest"), "utf8"));
  const icon192 = fs.readFileSync(path.join(projectRoot, "apps", "web", "public", "icon-192.png"));
  const icon512 = fs.readFileSync(path.join(projectRoot, "apps", "web", "public", "icon-512.png"));

  assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(html, /rel="apple-touch-icon" href="\/icon-192\.png"/);
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.lang, "zh-CN");
  assert.deepEqual(manifest.icons.slice(0, 2).map((icon) => icon.sizes), ["192x192", "512x512"]);
  assert.deepEqual([icon192.readUInt32BE(16), icon192.readUInt32BE(20)], [192, 192]);
  assert.deepEqual([icon512.readUInt32BE(16), icon512.readUInt32BE(20)], [512, 512]);
  assert.deepEqual(manifest.shortcuts.map((shortcut) => shortcut.url), ["/events", "/forum", "/characters"]);
});
