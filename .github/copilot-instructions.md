# IWFSA Copilot Instructions

> Trust these instructions first. Only explore the codebase if information here is incomplete or found to be incorrect.

## 1) Project Summary

IWFSA is a governance-aware web platform for the International Women's Forum South Africa. It provides three surfaces: a public marketing site, an authenticated member portal, and a restricted admin console. The project is a **modular monolith** with two Node.js services (API + Web) backed by SQLite.

- **Languages:** JavaScript (ESM `.mjs` throughout)
- **Runtime:** Node.js 22+ (uses built-in `node:sqlite`, `node:test`, `node:http`)
- **Database:** SQLite via `node:sqlite` (experimental — warnings are expected)
- **Dependencies:** `busboy` (multipart uploads), `xlsx` (Excel import parsing) — no frameworks (no Express, no React)
- **Deployment target:** Vercel (serverless entry at `api/entry.mjs`) or standalone Node host
- **OS tooling:** PowerShell scripts for local dev (Windows-oriented)

## 2) Repository Layout

```
.github/
  workflows/ci.yml        # GitHub Actions CI pipeline
  copilot-instructions.md # THIS FILE
apps/
  api/
    src/
      index.mjs           # API entry point (loads env, runs migrations, starts server)
      server.mjs           # All API routes and business logic (~2000+ lines)
      env.mjs              # API config parser (reads .env / environment)
      auth/                # Password hashing (scrypt) and bootstrap admin seeding
      db/
        client.mjs         # SQLite connection helper (PRAGMA foreign_keys = ON)
        migrate.mjs        # Sequential SQL migration runner
      integrations/        # SharePoint, Teams Graph, Calendar sync clients
      notifications/       # Email delivery (stub in dev)
    migrations/            # 0001–0014 numbered .sql files (applied in order)
    test/                  # Node built-in test runner files
  web/
    src/
      index.mjs            # Web entry point (loads env, starts server)
      server.mjs           # Web routes: /, /member, /admin, /activate, /reset, /meetings/rsvp
      templates.mjs        # HTML template functions (server-rendered)
      env.mjs              # Web config parser
    public/                # Static assets (styles.css, iwfsa-home.jpg)
    test/
  common/
    load-env.mjs           # Simple .env file loader (no dotenv dependency)
api/
  entry.mjs               # Vercel serverless entry (co-starts API + Web on demand)
scripts/
  build-all.mjs           # Build: copies src+migrations+public into dist/
  dev-all.ps1             # Start both services (runs migrate first, writes PIDs)
  dev-stop.ps1            # Stop tracked dev processes
  dev-clean.ps1           # Wipe DB + runtime, re-migrate, restart services
  lint.mjs                # Placeholder for future richer lint checks
  typecheck.mjs           # Validates .env.example keys and migration schema
  member_import_dry_run.py # Python spreadsheet validator (standalone, not part of Node build)
data/                     # SQLite database directory (gitignored, created by migrate)
docs/                     # Product requirements, architecture, playbook, ADRs, integration docs
```

### Key configuration files
| File | Purpose |
|------|---------|
| `package.json` | Scripts, engines (`>=22.0.0`), two dependencies |
| `vercel.json` | Vercel rewrite rules and function config |
| `.gitignore` | Ignores `node_modules/`, `dist/`, `data/`, `.env`, `.env.*`, `.runtime/` |
| `.env.example` | **Required by typecheck** but gitignored by `.env.*` pattern — see setup step below |
| `AGENT.md` | Build working agreement (checkpoint protocol, RBAC rules, session protocol) |
| `CONTRIBUTING.md` | PR workflow, change-alignment gate, quality expectations |

## 3) Environment Setup

### Prerequisites
- Node.js 22+ (the project uses `node:sqlite` which is built-in from Node 22)
- npm (comes with Node)
- PowerShell 5.1+ (for `dev:all`, `dev:stop`, `dev:clean` scripts — Windows)

### First-time setup
```bash
npm install
```

### Create `.env.example` (required for typecheck to pass)
The `.env.example` file is gitignored by the `.env.*` glob but is required by `scripts/typecheck.mjs`. If it does not exist, create it with these required keys:
```
API_HOST=127.0.0.1
API_PORT=4000
DATABASE_PATH=./data/iwfsa.db
APP_BASE_URL=http://127.0.0.1:3000
WEB_HOST=127.0.0.1
WEB_PORT=3000
API_BASE_URL=http://127.0.0.1:4000
```

### Create `.env` for local development
Copy the same values from `.env.example` to `.env`. The `load-env.mjs` loader reads `.env` at runtime; it does **not** use the `dotenv` package.

## 4) Build, Test, and Validation Commands

Always run commands from the repository root.

### Lint (syntax check all source files)
```bash
npm run lint
```
Uses `node --check` on every `.mjs` file. No external linter (no ESLint/Prettier config). If you add a new `.mjs` file, you must add it to the appropriate `lint:api` or `lint:web` script in `package.json`.

### Typecheck (config contract validation)
```bash
npm run typecheck
```
Validates that `.env.example` contains all required keys and that the baseline migration creates the expected tables. **Fails if `.env.example` is missing.**

### Migrate (create/update database)
```bash
npm run migrate
```
Applies sequential SQL migrations from `apps/api/migrations/` and seeds the bootstrap admin (`akeida` / `1possibility`). Creates `data/iwfsa.db` if it does not exist. Safe to run repeatedly (idempotent). The `(node:XXXX) ExperimentalWarning: SQLite is an experimental feature` warning is expected and harmless.

### Test
```bash
npm run test
```
Uses Node's built-in test runner with `--test-isolation=none`. Tests create temporary databases in `os.tmpdir()`, start real HTTP servers on port 0, and clean up after themselves. Tests run in about 30–60 seconds. The SQLite experimental warning is expected.

### Build
```bash
npm run build
```
Copies source, migrations, and public assets into `dist/` and writes `dist/BUILD_INFO.json`.

### Full CI pipeline (what GitHub Actions runs)
```bash
npm run ci
```
Runs `lint → typecheck → test → build` in sequence. This is the same pipeline defined in `.github/workflows/ci.yml`. **Always run this before pushing to validate your changes.**

### Local dev servers (Windows PowerShell)
```bash
npm run dev:all      # Runs migrate, then starts API (port 4000) + Web (port 3000) in background
npm run dev:stop     # Stops tracked dev processes
npm run dev:clean    # Wipes database, re-migrates, restarts both services
```

### Command order
1. `npm install` (once, or after dependency changes)
2. `npm run migrate` (creates database if needed)
3. `npm run lint` (fast syntax validation)
4. `npm run typecheck` (config contract check — needs `.env.example`)
5. `npm run test` (full test suite)
6. `npm run build` (generate dist/ artifacts)

## 5) CI Pipeline (GitHub Actions)

Defined in `.github/workflows/ci.yml`. Runs on every push and pull request:
1. Checkout → Setup Node 22.x with npm cache → `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

All four steps must pass for a PR to be accepted.

## 6) Architecture and Code Conventions

- **No frameworks.** HTTP servers use `node:http` directly. Templates are plain JS functions returning HTML strings.
- **ESM only.** All files use `.mjs` extension and `import`/`export` syntax. The project has `"type": "module"` in `package.json`.
- **Single-file server pattern.** `apps/api/src/server.mjs` contains all API route handling and business logic in one large file. New routes are added inside the `startApiServer` function.
- **SQLite via `node:sqlite`.** Use `DatabaseSync` from `node:sqlite`. Always enable `PRAGMA foreign_keys = ON` (handled by `openDatabase` in `db/client.mjs`).
- **Migrations are sequential SQL files.** Named `NNNN_description.sql` in `apps/api/migrations/`. The migrator applies them in filesystem sort order and tracks applied migrations in a `_migrations` table.
- **RBAC roles:** `chief_admin`, `admin`, `event_editor`, `member`. Check roles in route handlers. Admin-only routes must verify `role in ['admin', 'chief_admin']`.
- **Feature flags:** SharePoint, Teams Graph, and Calendar Sync are controlled by `FEATURE_SHAREPOINT_DOCUMENTS`, `FEATURE_TEAMS_GRAPH_AUTOMATION`, and `FEATURE_CALENDAR_OAUTH_SYNC` environment variables.
- **No TypeScript.** No `.ts` files, no `tsconfig.json`. The typecheck script validates config contracts only.
- **Tests** use `node:test` and `node:assert/strict`. Test files are in `apps/*/test/*.test.mjs`. Tests create isolated temp databases and ephemeral HTTP servers.

## 7) Planning and Governance

### Source of truth (in priority order)
1. `docs/build-playbook.md` — execution details and checkpoint status table
2. `docs/roadmap.md` — phase and checkpoint sequencing
3. `docs/product-requirements.md` — functional and non-functional requirements
4. `AGENT.md` — build working agreement

If these documents disagree, update them together in the same change.

### Active delivery sequence
- Checkpoints execute sequentially from `0.1` onward per `docs/roadmap.md`.
- Keep exactly one checkpoint marked `In Progress` in `docs/build-playbook.md`.
- Finish the current checkpoint before starting the next.

### Change alignment gate
Classify every scope change before implementation:
- **Enhancement (non-breaking):** verify MVP scope, feature flags, RBAC, consent, API compatibility, and reliability are preserved.
- **Breaking change:** log in `docs/change-alignment-log.md` with impact and mitigation before merging.

### Documentation hygiene
When changing requirements or execution order, update all of:
- `docs/build-playbook.md`, `docs/roadmap.md`, `AGENT.md`, `README.md`
- `CONTRIBUTING.md` when contributor workflow changes
- Feature-specific docs touched by the change

### User Dictionary standard
Entries in `docs/User-dictionary.md` must be at a 7th-grade reading level. Short sentences, plain language, real-world analogies.

## 8) Security and Privacy Rules

- Never expose real credentials in public/admin UI templates or test assertions.
- Never store or log plaintext passwords/tokens. Use `hashPassword`/`verifyPassword` from `apps/api/src/auth/passwords.mjs`.
- Treat member spreadsheets and import data as PII.
- Invite/reset/RSVP tokens must be short-lived and single-use.
- POPIA-aligned: data minimization, explicit consent gates, retention-aware audit.
- Approval links, join URLs, and calendar subscription tokens are sensitive — do not log broadly.

## 9) Carry-Forward Focus Rules

### Membership data
- `membership_set_json` on import batches is canonical for membership-set behavior.
- Do not introduce duplicate membership staging pathways.
- Use the one canonical fixture in `docs/imports/`.

### Navigation UX
- Preserve top-level surfaces: `/` (public), `/member` (portal), `/admin` (console).
- Use module-level deep links (`#events`, `#imports`, `#notifications`, etc.).
- Avoid monolithic scroll-heavy pages.

### Notifications UX
- Delivery report is member-centric. Queue status is a health summary card.
- Technical diagnostics stay in backend logs/audit, not default admin UI.

## 10) Known Issues and Workarounds

- **SQLite ExperimentalWarning:** `(node:XXXX) ExperimentalWarning: SQLite is an experimental feature` appears during migrate and test. This is expected behavior in Node 22+ and is harmless.
- **`.env.example` not in git:** The file is excluded by `.env.*` in `.gitignore` but is required by `npm run typecheck`. If typecheck fails with ".env.example is missing", create the file as shown in section 3.
- **`dev:all`/`dev:stop`/`dev:clean` are PowerShell-only.** On non-Windows systems, start services manually: `npm run migrate && npm run dev:api & npm run dev:web`.
- **Port conflicts:** API defaults to 4000, Web to 3000. If ports are in use, change values in `.env`.
- **No hot reload.** Restart `dev:api` / `dev:web` after code changes.
- **New source files must be added to lint scripts.** The lint commands enumerate every `.mjs` file explicitly. If you create a new file, add a `node --check` entry to the relevant `lint:api` or `lint:web` script in `package.json`.
