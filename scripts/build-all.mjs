import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const DIST_DIR = path.join(ROOT, "dist");

function copyPath(source, destination) {
  cpSync(source, destination, { recursive: true, force: true });
}

rmSync(DIST_DIR, { recursive: true, force: true });
mkdirSync(DIST_DIR, { recursive: true });

copyPath(path.join(ROOT, "apps", "api", "src"), path.join(DIST_DIR, "api", "src"));
copyPath(path.join(ROOT, "apps", "api", "migrations"), path.join(DIST_DIR, "api", "migrations"));
copyPath(path.join(ROOT, "apps", "web", "src"), path.join(DIST_DIR, "web", "src"));
copyPath(path.join(ROOT, "apps", "web", "public"), path.join(DIST_DIR, "web", "public"));

const buildInfo = {
  builtAt: new Date().toISOString(),
  nodeVersion: process.version,
  artifactLayout: {
    api: "dist/api/src + dist/api/migrations",
    web: "dist/web/src + dist/web/public"
  }
};

writeFileSync(path.join(DIST_DIR, "BUILD_INFO.json"), `${JSON.stringify(buildInfo, null, 2)}\n`, "utf8");

console.log("build ok (artifacts generated in dist/)");
