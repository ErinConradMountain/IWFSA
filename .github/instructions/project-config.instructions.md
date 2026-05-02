---
applyTo: "package.json,vercel.json,.gitignore,.github/workflows/**"
---

# Project Configuration

## package.json

- `"type": "module"` — ESM only, all files use `.mjs` extension.
- `"engines": { "node": ">=22.0.0" }` — required for `node:sqlite` built-in.
- Two runtime dependencies: `busboy` (multipart) and `xlsx` (Excel parsing).
- No dev dependencies — linting is `node --check`, testing is `node:test`.

### Script Conventions

Lint scripts enumerate every `.mjs` file explicitly with `node --check`. When adding a new `.mjs` file:
1. Add a `node --check path/to/new-file.mjs` entry to the appropriate script (`lint:scripts`, `lint:api`, or `lint:web`).
2. Chain it with `&&` to the existing command string.
3. Verify with `npm run lint`.

The `ci` script runs `lint → typecheck → test → build` in strict sequence. The same pipeline runs in GitHub Actions.

## vercel.json

Rewrites all routes to `api/entry.mjs` (Vercel serverless function). The function timeout is 60 seconds. The entry point co-starts both API and Web services.

## .gitignore

Key exclusions:
- `.env`, `.env.*` — all env files including `.env.example` (which must be created locally for typecheck)
- `node_modules/`, `dist/`, `data/`, `.runtime/`
- Local import spreadsheets (`Members.xlsx`, etc.) — contains PII
- `.vercel/`

## CI Pipeline (.github/workflows/ci.yml)

Runs on every push and pull request:
1. Checkout → Node 22.x + npm cache → `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. `npm run build`

All steps must pass. The pipeline uses Ubuntu runners with Node 22.x.

## Adding New Files Checklist

When adding a new `.mjs` source file:
1. Add `node --check` entry to the appropriate `lint:*` script in `package.json`.
2. If it's a new deployable directory, add a `copyPath` call in `scripts/build-all.mjs`.
3. Run `npm run ci` to verify the full pipeline passes.
