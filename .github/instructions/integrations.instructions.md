---
applyTo: "apps/api/src/integrations/**/*.mjs"
---

# Integration Clients

## Feature-Flagged Design

All integrations are optional and gated by environment variables:
- `FEATURE_SHAREPOINT_DOCUMENTS` → `config.sharePointEnabled`
- `FEATURE_TEAMS_GRAPH_AUTOMATION` → `config.teamsGraphEnabled`
- `FEATURE_CALENDAR_OAUTH_SYNC` → `config.calendarSyncEnabled`

Each integration module exports a `createXxxClient(config)` factory function. The server creates the client at startup and passes it into route handlers.

When the feature flag is off, API routes must return HTTP 503 with `{ error: "feature_disabled" }`.

## Client Modules

### `sharepoint.mjs`
- `createSharePointClient(config)` — upload/download event documents via Microsoft Graph.
- Authenticates using client credentials flow (`tenantId`, `clientId`, `clientSecret`).
- Token caching with expiry is handled internally.

### `teams-graph.mjs`
- `createTeamsGraphClient(config)` — create/update online meetings via Microsoft Graph.
- Returns `meetingId`, `joinUrl`, `organizerUpn`.
- Teams join URLs are sensitive — do not log them broadly.

### `calendar-sync.mjs`
- `createCalendarSyncClient(config)` — OAuth flow for Google/Outlook calendar sync.
- Methods: `createAuthorizationRequest`, `exchangeCode`, `upsertCalendarEvent`, `cancelCalendarEvent`, `revokeConnection`.

## Testing Pattern

Tests use in-memory fake clients (defined in `apps/api/test/server.test.mjs`):
- `createFakeSharePointClient()` — stores files in a `Map`.
- `createFakeTeamsGraphClient()` — stores meetings in a `Map`.
- `createFakeCalendarSyncClient()` — stores events per provider in nested `Map`s.

Pass fake clients to `startApiServer({ ..., sharePointClient, teamsGraphClient, calendarSyncClient })` in tests.

## Security

- Never expose tenant credentials, client secrets, or Graph API tokens to end users.
- SharePoint/Teams URLs may contain sensitive information — treat as PII in logs.
- Store OAuth tokens encrypted or hashed at rest where possible.
