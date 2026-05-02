import http from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderActivationPage,
  renderAdminPage,
  renderMeetingRsvpPage,
  renderMemberPage,
  renderProfileGalleryPage,
  renderPublicPage,
  renderResetPage,
  renderSignInPage
} from "./templates.mjs";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(CURRENT_DIR, "../public");
const PUBLIC_ROOT = path.resolve(PUBLIC_DIR);
const ASSET_CONTENT_TYPES = new Map([
  [".css", "text/css; charset=utf-8"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"]
]);

function writeAsset(response, assetPath) {
  const contentType = ASSET_CONTENT_TYPES.get(path.extname(assetPath).toLowerCase()) || "application/octet-stream";
  const asset = readFileSync(assetPath);
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=3600"
  });
  response.end(asset);
}

function writeHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(html);
}

export async function startWebServer(config) {
  const server = http.createServer((request, response) => {
    if (!request.url) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Missing request URL.");
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host || `${config.host}:${config.port}`}`);

    if (request.method === "GET" && requestUrl.pathname.startsWith("/assets/")) {
      const relativeAssetPath = decodeURIComponent(requestUrl.pathname.slice("/assets/".length));
      const assetPath = path.resolve(PUBLIC_ROOT, relativeAssetPath);

      if (
        !relativeAssetPath ||
        relativeAssetPath.includes("\\") ||
        (!assetPath.startsWith(`${PUBLIC_ROOT}${path.sep}`) && assetPath !== PUBLIC_ROOT)
      ) {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found.");
        return;
      }

      try {
        writeAsset(response, assetPath);
      } catch {
        response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not found.");
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/") {
      writeHtml(response, renderPublicPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/member") {
      writeHtml(response, renderMemberPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/profiles") {
      writeHtml(response, renderProfileGalleryPage(config));
      return;
    }

    if (request.method === "GET" && (requestUrl.pathname === "/sign-in" || requestUrl.pathname === "/login")) {
      writeHtml(response, renderSignInPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/activate") {
      writeHtml(response, renderActivationPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/reset") {
      writeHtml(response, renderResetPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/meetings/rsvp") {
      writeHtml(response, renderMeetingRsvpPage(config));
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/admin") {
      writeHtml(response, renderAdminPage(config));
      return;
    }

    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found.");
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : config.port;

  return {
    host: config.host,
    port: resolvedPort,
    close: async () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}
