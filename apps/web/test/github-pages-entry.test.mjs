import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPOSITORY_ROOT = path.resolve(CURRENT_DIR, "../../..");

test("github pages entry point shows the public landing page instead of repository docs", () => {
  const html = readFileSync(path.join(REPOSITORY_ROOT, "index.html"), "utf8");

  assert.match(html, /<title>IWFSA \| Public<\/title>/);
  assert.match(html, /Leading with Purpose\./);
  assert.match(html, /GitHub Pages preview/);
  assert.match(html, /\.\/apps\/web\/public\/styles\.css/);
  assert.doesNotMatch(html, /This repository hosts the standalone IWFSA web application\./);
});
