---
applyTo: "apps/api/test/**/*.mjs,apps/web/test/**/*.mjs"
---

# Test Files

## Framework

Tests use Node's built-in test runner (`node:test`) and assertion library (`node:assert/strict`). There is no Jest, Mocha, or Vitest.

```js
import assert from "node:assert/strict";
import test from "node:test";
```

## Running Tests

```bash
npm run test
```

Uses `--test-isolation=none` to run all test files in the same process. Tests take 30–60 seconds.

The `(node:XXXX) ExperimentalWarning: SQLite is an experimental feature` warning is expected and harmless.

## Test Database Pattern

API tests create isolated temporary databases:

```js
const workingDirectory = mkdtempSync(path.join(tmpdir(), "iwfsa-api-"));
const databasePath = path.join(workingDirectory, "test.db");
runMigrations({ databasePath });
```

Always clean up temp directories in a `finally` block or after the test using `rmSync(workingDirectory, { recursive: true, force: true })`.

## Test Server Pattern

API tests start real HTTP servers on port 0 (auto-assigned):

```js
const server = await startApiServer({ ...config, host: "127.0.0.1", port: 0 });
// Make requests to http://${server.host}:${server.port}/...
await server.close();
```

Web tests follow the same pattern with `startWebServer`. Always call `server.close()` in a `finally` block.

## Helper Functions

Existing test helpers in `apps/api/test/server.test.mjs`:
- `createRunningServer(options)` — creates a fully seeded test server with members, events, and login sessions.
- `createWorkbookBuffer(rows)` — creates an XLSX buffer for import testing.
- `createFakeSharePointClient()` / `createFakeTeamsGraphClient()` / `createFakeCalendarSyncClient()` — in-memory fakes for integration tests.
- `extractTokenFromText(text, pathSegment)` — extracts tokens from email body text.

## Email Capture

Tests capture outbound emails via the global outbox:

```js
globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
// ... perform action that sends email ...
const sent = globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
```

Import `EMAIL_OUTBOX_GLOBAL_KEY` from `apps/api/src/notifications/email.mjs`.

## Assertion Style

- Use `assert.equal`, `assert.deepEqual`, `assert.match`, `assert.doesNotMatch`.
- For HTTP responses, always check `response.status` first, then parse and assert the body.
- Security tests must verify that admin-only routes reject non-admin tokens and that public routes do not leak internal data.

## What to Test

- RBAC: every protected endpoint must be tested with correct and incorrect roles.
- Capacity/waitlist: registration flows with full events.
- Notification delivery and idempotency.
- Negative paths: invalid input, missing auth, expired tokens.
