import { mkdirSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { getApiConfig } from "../env.mjs";
import { ensureBootstrapAdmin } from "../auth/bootstrap-admin.mjs";
import { openDatabase } from "./client.mjs";

const CURRENT_FILE_PATH = fileURLToPath(import.meta.url);
const MIGRATIONS_DIR = path.resolve(path.dirname(CURRENT_FILE_PATH), "../../migrations");

export function runMigrations({ databasePath, migrationsDir = MIGRATIONS_DIR }) {
  mkdirSync(path.dirname(databasePath), { recursive: true });

  const database = openDatabase(databasePath);

  try {
    database.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        applied_at TEXT NOT NULL
      );
    `);

    const appliedRows = database.prepare("SELECT name FROM _migrations ORDER BY name").all();
    const appliedSet = new Set(appliedRows.map((row) => row.name));
    const migrationFiles = readdirSync(migrationsDir)
      .filter((name) => name.endsWith(".sql"))
      .sort((left, right) => left.localeCompare(right));

    const newlyApplied = [];

    for (const migrationFile of migrationFiles) {
      if (appliedSet.has(migrationFile)) {
        continue;
      }

      const migrationSql = readFileSync(path.join(migrationsDir, migrationFile), "utf8").trim();
      if (!migrationSql) {
        continue;
      }

      database.exec("BEGIN");
      try {
        database.exec(migrationSql);
        database
          .prepare("INSERT INTO _migrations (name, applied_at) VALUES (?, ?)")
          .run(migrationFile, new Date().toISOString());
        database.exec("COMMIT");
        newlyApplied.push(migrationFile);
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    }

    const bootstrapResult = ensureBootstrapAdmin(database);

    return {
      appliedMigrations: newlyApplied,
      bootstrapAdminCreated: bootstrapResult.created,
      bootstrapAdminUsername: bootstrapResult.username
    };
  } finally {
    database.close();
  }
}

function isMainModule() {
  if (!process.argv[1]) {
    return false;
  }
  return path.resolve(process.argv[1]) === CURRENT_FILE_PATH;
}

if (isMainModule()) {
  const config = getApiConfig();
  const result = runMigrations({ databasePath: config.databasePath });
  const migrationSummary =
    result.appliedMigrations.length === 0
      ? "No pending migrations."
      : `Applied: ${result.appliedMigrations.join(", ")}`;
  const adminSummary = result.bootstrapAdminCreated
    ? `Bootstrap admin created (${result.bootstrapAdminUsername}).`
    : `Bootstrap admin already present (${result.bootstrapAdminUsername}).`;
  console.log(`migrate ok (${migrationSummary} ${adminSummary})`);
}
