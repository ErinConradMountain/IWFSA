import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const ENV_EXAMPLE_PATH = path.join(ROOT, ".env.example");

function parseEnvExample(filePath) {
  const output = new Map();
  const fileContents = readFileSync(filePath, "utf8");

  for (const rawLine of fileContents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    output.set(key, value);
  }

  return output;
}

function checkEnvExample() {
  assert.ok(existsSync(ENV_EXAMPLE_PATH), ".env.example is missing.");

  const parsedEnv = parseEnvExample(ENV_EXAMPLE_PATH);
  const requiredKeys = [
    "API_HOST",
    "API_PORT",
    "DATABASE_PATH",
    "APP_BASE_URL",
    "WEB_HOST",
    "WEB_PORT",
    "API_BASE_URL"
  ];

  for (const key of requiredKeys) {
    assert.ok(parsedEnv.has(key), `.env.example is missing ${key}.`);
    assert.notEqual(parsedEnv.get(key), "", `${key} must not be empty.`);
  }

  return Object.fromEntries(parsedEnv.entries());
}

function checkMigrationBaseline() {
  const migrationPath = path.join(ROOT, "apps", "api", "migrations", "0001_baseline.sql");
  assert.ok(existsSync(migrationPath), "Baseline migration is missing.");

  const migrationSql = readFileSync(migrationPath, "utf8");
  const requiredTables = [
    "users",
    "member_profiles",
    "events",
    "signups",
    "audit_logs"
  ];

  for (const tableName of requiredTables) {
    assert.ok(
      migrationSql.includes(`CREATE TABLE IF NOT EXISTS ${tableName}`),
      `Baseline migration must create table "${tableName}".`
    );
  }
}

async function checkRuntimeConfigContracts(envSource) {
  const apiModuleUrl = pathToFileURL(path.join(ROOT, "apps", "api", "src", "env.mjs")).href;
  const webModuleUrl = pathToFileURL(path.join(ROOT, "apps", "web", "src", "env.mjs")).href;

  const { getApiConfig } = await import(apiModuleUrl);
  const { getWebConfig } = await import(webModuleUrl);

  const apiConfig = getApiConfig(envSource);
  const webConfig = getWebConfig(envSource);

  assert.equal(typeof apiConfig.host, "string", "api host must be a string.");
  assert.equal(typeof apiConfig.port, "number", "api port must be numeric.");
  assert.equal(typeof apiConfig.databasePath, "string", "databasePath must be a string.");
  assert.equal(typeof webConfig.host, "string", "web host must be a string.");
  assert.equal(typeof webConfig.port, "number", "web port must be numeric.");
  assert.equal(typeof webConfig.apiBaseUrl, "string", "apiBaseUrl must be a string.");
}

const envSource = checkEnvExample();
checkMigrationBaseline();
await checkRuntimeConfigContracts(envSource);

console.log("typecheck ok (config contracts and baseline schema)");
