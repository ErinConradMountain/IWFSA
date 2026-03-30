import http from "node:http";
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvFile } from "../apps/common/load-env.mjs";
import { runMigrations } from "../apps/api/src/db/migrate.mjs";
import { getApiConfig } from "../apps/api/src/env.mjs";
import { startApiServer } from "../apps/api/src/server.mjs";
import { getWebConfig } from "../apps/web/src/env.mjs";
import { startWebServer } from "../apps/web/src/server.mjs";

const DISABLED_INTERVAL_MS = 2_147_483_647;
let servicesPromise;

function getPublicBaseUrl() {
  const configuredBaseUrl = String(process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const deploymentUrl = String(process.env.VERCEL_URL || "").trim();
  if (deploymentUrl) {
    return `https://${deploymentUrl}`;
  }

  return "http://127.0.0.1:3000";
}

function preparePreviewDatabase() {
  const previewDatabasePath = path.join(os.tmpdir(), "iwfsa-preview.db");
  if (existsSync(previewDatabasePath)) {
    return previewDatabasePath;
  }

  const sourceDatabasePath = path.resolve(process.cwd(), "data", "iwfsa.db");
  mkdirSync(path.dirname(previewDatabasePath), { recursive: true });

  if (existsSync(sourceDatabasePath)) {
    copyFileSync(sourceDatabasePath, previewDatabasePath);
  }

  return previewDatabasePath;
}

async function startServices() {
  loadEnvFile();

  const publicBaseUrl = getPublicBaseUrl();
  const previewDatabasePath = preparePreviewDatabase();

  const apiConfig = getApiConfig({
    ...process.env,
    API_HOST: "127.0.0.1",
    API_PORT: "0",
    DATABASE_PATH: previewDatabasePath,
    APP_BASE_URL: publicBaseUrl
  });

  runMigrations({ databasePath: apiConfig.databasePath });

  const apiServer = await startApiServer({
    ...apiConfig,
    reminderDispatchIntervalMs: DISABLED_INTERVAL_MS,
    notificationDispatchIntervalMs: DISABLED_INTERVAL_MS
  });

  const webConfig = getWebConfig({
    ...process.env,
    WEB_HOST: "127.0.0.1",
    WEB_PORT: "0",
    API_BASE_URL: publicBaseUrl,
    APP_BASE_URL: publicBaseUrl
  });

  const webServer = await startWebServer(webConfig);

  return { apiServer, webServer };
}

async function ensureServices() {
  if (!servicesPromise) {
    servicesPromise = startServices().catch((error) => {
      servicesPromise = undefined;
      throw error;
    });
  }

  return servicesPromise;
}

function isApiRequest(requestUrl) {
  return requestUrl === "/health" || requestUrl === "/api" || requestUrl.startsWith("/api/");
}

function proxyRequest(target, request, response) {
  const destination = new URL(request.url || "/", `http://${target.host}:${target.port}`);

  return new Promise((resolve, reject) => {
    const proxy = http.request(
      destination,
      {
        method: request.method,
        headers: {
          ...request.headers,
          host: `${target.host}:${target.port}`
        }
      },
      (upstreamResponse) => {
        response.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
        upstreamResponse.pipe(response);
        upstreamResponse.on("end", resolve);
      }
    );

    proxy.on("error", reject);
    request.on("aborted", () => proxy.destroy());

    if (request.method === "GET" || request.method === "HEAD") {
      proxy.end();
      return;
    }

    request.pipe(proxy);
  });
}

export default async function handler(request, response) {
  try {
    const services = await ensureServices();
    const target = isApiRequest(request.url || "/") ? services.apiServer : services.webServer;
    await proxyRequest(target, request, response);
  } catch (error) {
    response.statusCode = 500;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(
      `${JSON.stringify({
        error: "preview_boot_failed",
        message: String(error?.message || error)
      })}\n`
    );
  }
}
