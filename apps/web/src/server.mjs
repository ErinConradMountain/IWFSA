import http from "node:http";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderActivationPage,
  renderAdminPage,
  renderMeetingRsvpPage,
  renderMemberPage,
  renderPublicPage,
  renderResetPage
} from "./templates.mjs";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(CURRENT_DIR, "../public");
const STYLES_PATH = path.resolve(PUBLIC_DIR, "styles.css");
const HOMEPAGE_IMAGE_PATH = path.resolve(PUBLIC_DIR, "iwfsa-home.jpg");

function writeHtml(response, html) {
  response.writeHead(200, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store, max-age=0"
  });
  response.end(html);
}

export async function startWebServer(config) {
  const styles = readFileSync(STYLES_PATH, "utf8");
  const homepageImage = readFileSync(HOMEPAGE_IMAGE_PATH);

  const server = http.createServer((request, response) => {
    if (!request.url) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Missing request URL.");
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host || `${config.host}:${config.port}`}`);

    if (request.method === "GET" && requestUrl.pathname === "/assets/styles.css") {
      response.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
      response.end(styles);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/assets/iwfsa-home.jpg") {
      response.writeHead(200, {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=3600"
      });
      response.end(homepageImage);
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
