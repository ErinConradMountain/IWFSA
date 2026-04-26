---
applyTo: "apps/api/src/**/*.mjs"
---

# API Server Code

## Architecture

All API routes and business logic live in `apps/api/src/server.mjs` inside the `startApiServer` function. This is intentional — add new routes there, not in separate router files.

HTTP servers use `node:http` directly. There is no Express, Koa, or other framework. Route matching is done with `if` statements checking `request.method` and path parsing.

## Code Style

- ESM only. Use `import`/`export`. All files are `.mjs`.
- Use `node:` prefix for built-in modules (`node:http`, `node:crypto`, `node:fs`).
- No TypeScript. No type annotations.

## Response Helpers

Use the `writeJson(response, statusCode, payload)` helper for all JSON API responses. It sets `Content-Type: application/json; charset=utf-8` and ends the response.

## Authentication and Sessions

- Sessions use a random hex token stored in a `sessions` table.
- Auth is checked by reading the `Authorization: Bearer <token>` header and looking up the session in the database.
- Always verify the user's `role` before allowing access. Admin-only routes must check `role === 'admin' || role === 'chief_admin'`.
- RBAC roles are: `chief_admin`, `admin`, `event_editor`, `member`.

## Database Access

- Use `openDatabase(databasePath)` from `db/client.mjs` to get a `DatabaseSync` instance.
- `PRAGMA foreign_keys = ON` is set automatically by `openDatabase`.
- Use `database.prepare(sql).run(...)` for writes, `.get(...)` for single rows, `.all()` for multiple rows.
- All date/time values in the database are ISO 8601 strings (UTC).

## Request Body Parsing

- JSON bodies: `await readJsonBody(request)` — returns parsed object, throws on oversized payloads.
- Multipart uploads: `await readMultipartForm(request, { maxFileSizeBytes })` — uses `busboy`.

## CORS

CORS headers are computed by `getCorsHeaders(appBaseUrl, requestOrigin)`. Preflight `OPTIONS` requests must return these headers with a 204 status.

## Feature Flags

Integration features are gated by config booleans:
- `config.sharePointEnabled` — SharePoint document flow
- `config.teamsGraphEnabled` — Teams meeting automation
- `config.calendarSyncEnabled` — OAuth calendar sync

Always check the flag before executing integration logic. Return a 503 with an appropriate message if disabled.

## Audit Logging

Sensitive admin actions (member operations, permission changes, event publish/cancel, credential resets) must insert into the `audit_logs` table with: `actor_user_id`, `action_type`, `target_type`, `target_id`, and optional `metadata_json`.

## Security Rules

- Never store or log plaintext passwords. Use `hashPassword`/`verifyPassword` from `auth/passwords.mjs`.
- Invite/reset/RSVP tokens must be generated with `randomBytes` and stored as SHA-256 hashes.
- Treat member spreadsheets and import data as PII.
- Email delivery uses `sendTransactionalEmail` from `notifications/email.mjs` (stub in dev — logs to stdout).
