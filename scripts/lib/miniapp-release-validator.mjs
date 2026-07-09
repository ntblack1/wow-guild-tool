const PLACEHOLDER_PATTERNS = [
  /example\.com/i,
  /your[-_]?api/i,
  /replace/i,
  /todo/i
];

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./
];

export const normalizeUrl = (value) => String(value || "").trim().replace(/\/+$/, "");

export const validateMiniappApiBaseUrls = (apiBaseUrls) => {
  const errors = [];
  const config = apiBaseUrls || {};

  ["trial", "release"].forEach((envName) => {
    const value = normalizeUrl(config[envName]);
    if (!value) {
      errors.push(`${envName} API address is missing`);
      return;
    }

    let parsed;
    try {
      parsed = new URL(value);
    } catch (error) {
      errors.push(`${envName} API address is not a valid URL: ${value}`);
      return;
    }

    if (parsed.protocol !== "https:") {
      errors.push(`${envName} API address must use HTTPS: ${value}`);
    }
    if (PRIVATE_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
      errors.push(`${envName} API address must not be localhost or LAN IP: ${value}`);
    }
    if (PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))) {
      errors.push(`${envName} API address still looks like a placeholder: ${value}`);
    }
  });

  return errors;
};
