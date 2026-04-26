---
applyTo: "scripts/**/*.mjs,scripts/**/*.ps1"
---

# Build and Dev Scripts

## Overview

| Script | Purpose | OS |
|--------|---------|-----|
| `scripts/build-all.mjs` | Copies source into `dist/` and writes `BUILD_INFO.json` | Cross-platform |
| `scripts/lint.mjs` | Placeholder (actual lint runs via `package.json` scripts) | Cross-platform |
| `scripts/typecheck.mjs` | Validates `.env.example` keys and baseline migration schema | Cross-platform |
| `scripts/dev-all.ps1` | Runs migrations then starts API + Web in background | Windows PowerShell |
| `scripts/dev-stop.ps1` | Stops tracked dev processes from PID file | Windows PowerShell |
| `scripts/dev-clean.ps1` | Wipes DB + `.runtime/`, re-migrates, restarts services | Windows PowerShell |

## Lint Script Architecture

Lint does **not** use ESLint or Prettier. It runs `node --check` (syntax validation) on every `.mjs` file, enumerated explicitly in `package.json` under `lint:scripts`, `lint:api`, and `lint:web`.

**Critical:** If you add a new `.mjs` file, you must add a `node --check path/to/file.mjs` entry to the appropriate lint script in `package.json`. Otherwise CI will not validate its syntax.

## Typecheck Script

`scripts/typecheck.mjs` performs three checks:
1. `.env.example` exists and contains required keys: `API_HOST`, `API_PORT`, `DATABASE_PATH`, `APP_BASE_URL`, `WEB_HOST`, `WEB_PORT`, `API_BASE_URL`.
2. `apps/api/migrations/0001_baseline.sql` contains `CREATE TABLE IF NOT EXISTS` for `users`, `member_profiles`, `events`, `signups`, `audit_logs`.
3. `getApiConfig()` and `getWebConfig()` return valid typed config objects from the `.env.example` values.

## Build Script

`scripts/build-all.mjs` copies:
- `apps/api/src` → `dist/api/src`
- `apps/api/migrations` → `dist/api/migrations`
- `apps/web/src` → `dist/web/src`
- `apps/web/public` → `dist/web/public`

If you add a new source directory that must be deployed, add a `copyPath` call to `build-all.mjs`.

## PowerShell Dev Scripts

These require PowerShell 5.1+ (Windows). They manage process PIDs in `.runtime/dev-pids.json` and log output to `.runtime/dev-*.log`.

- `dev-all.ps1`: runs `npm run migrate` first, then starts API and Web as background processes.
- `dev-stop.ps1`: reads PIDs from `.runtime/dev-pids.json` and stops them.
- `dev-clean.ps1`: stops services, deletes `data/iwfsa.db` and `.runtime/`, runs migrate, then starts services.

On non-Windows systems, start services manually: `npm run migrate && npm run dev:api & npm run dev:web`.
