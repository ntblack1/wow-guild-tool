import assert from "node:assert/strict";
import test from "node:test";
import { validateMiniappApiBaseUrls } from "./lib/miniapp-release-validator.mjs";

test("accepts HTTPS public API addresses for trial and release", () => {
  const errors = validateMiniappApiBaseUrls({
    develop: "http://192.168.50.101:3000",
    trial: "https://api.wow-guild.test",
    release: "https://api.wow-guild.test"
  });

  assert.deepEqual(errors, []);
});

test("rejects missing trial or release API addresses", () => {
  const errors = validateMiniappApiBaseUrls({
    develop: "http://192.168.50.101:3000"
  });

  assert.match(errors.join("\n"), /trial API address is missing/);
  assert.match(errors.join("\n"), /release API address is missing/);
});

test("rejects non-HTTPS, private, or placeholder release addresses", () => {
  const errors = validateMiniappApiBaseUrls({
    trial: "http://192.168.50.101:3000",
    release: "https://api.example.com"
  });

  assert.match(errors.join("\n"), /trial API address must use HTTPS/);
  assert.match(errors.join("\n"), /trial API address must not be localhost or LAN IP/);
  assert.match(errors.join("\n"), /release API address still looks like a placeholder/);
});
