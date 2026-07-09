import { createRequire } from "node:module";
import { validateMiniappApiBaseUrls } from "./lib/miniapp-release-validator.mjs";

const require = createRequire(import.meta.url);
const { MINIAPP_API_BASE_URLS } = require("../apps/miniapp/config/index.js");

const errors = validateMiniappApiBaseUrls(MINIAPP_API_BASE_URLS);

if (errors.length > 0) {
  console.error("Miniapp release check failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  console.error("");
  console.error("Set apps/miniapp/config/index.js MINIAPP_API_BASE_URLS.trial/release to your HTTPS API domain.");
  process.exit(1);
}

console.log("Miniapp release API config is ready.");
