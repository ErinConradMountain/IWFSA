function parsePort(value, key) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`${key} must be an integer between 0 and 65535.`);
  }
  return parsed;
}

function parseUrl(value, key) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
}

export function getWebConfig(env = process.env) {
  const host = env.WEB_HOST || "127.0.0.1";
  const port = parsePort(env.WEB_PORT || "3000", "WEB_PORT");
  const apiBaseUrl = parseUrl(env.API_BASE_URL || "http://127.0.0.1:4000", "API_BASE_URL");
  const appBaseUrl = parseUrl(env.APP_BASE_URL || "http://127.0.0.1:3000", "APP_BASE_URL");

  return {
    host,
    port,
    apiBaseUrl,
    appBaseUrl
  };
}
