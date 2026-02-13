# Architecture (Draft)

## Strategic Positioning
This platform is not "a website with logins." It is a governance-aware digital operating system for an elite women's leadership forum, designed to protect trust, enable participation, and strengthen the global IWF ecosystem.

## Delivery Guardrails
- Member value without overexposure: events are intentional, there is no public leakage of internal activity, and member experiences respect seniority, privacy, and consent.
- MVP-first, future-ready architecture: ship a modular monolith with clear boundaries now, extract services later, and defer integration-heavy automation until governance/budget/readiness allows.

## Chosen Stack Baseline
Phase 0.1 decisions are captured in:
- `docs/adrs/ADR-001-runtime-stack.md`
- `docs/adrs/ADR-002-hosting-env-secrets.md`

Implementation baseline for checkpoint 1.1:
- Runtime: Node.js 22+ with ESM modules.
- Application layout:
  - `apps/web` for public/member/admin UI shells.
  - `apps/api` for internal APIs and data access.
- Data layer: SQLite using Node's built-in `node:sqlite` module with migration files.
- HTTP baseline: built-in `node:http`.
- Tests: Node built-in test runner (`node:test`).

## High-level Components
- Public website (marketing and mission content)
- Member portal (authenticated)
- Admin console (authenticated + elevated permissions)
- API (auth, events, signups, notifications, audit)
- Database (members, events, signups, roles, revisions)

## Key Design Principles
- Public pages contain no internal event data.
- All internal APIs require authentication.
- RBAC + event-scoped permissions.
- Audit logging for sensitive actions.
- Reliable notifications via queue.
- Privacy by design: minimize personal data and enforce consent before non-essential/public processing.
- No social publication path without explicit opt-in consent checks.
- Operational reliability by default: idempotent async jobs, retry safety, and visible admin outcomes.
- Security/privacy baseline details (inventory, consent, retention) are defined in `docs/privacy-baseline.md`.

## Integrations
- Microsoft Teams (Graph): create join links for online events where possible.
- Calendars: ICS + Google/Outlook add links (MVP), OAuth sync (Phase 3).
- SharePoint: store event documents with app-mediated access.
- Social media (optional): publish/schedule approved birthday posts via platform APIs.

## Background Jobs
- Use a queue/worker for:
  - notification fan-out
  - member import processing (Excel validation + create/update)
  - onboarding invite sending
  - credential reset sending
  - scheduled publishing (birthday social posts)
  - image rendering
  - daily automation runs

Reliability requirements:
- Jobs must be idempotent using stable dedupe/idempotency keys.
- Retries must not create duplicate side effects (duplicate sends, duplicate user creation, duplicate invites).
- Admin UI/API must expose clear job outcomes (queued, processing, succeeded, failed, retrying).

## Operational Intelligence (Designed-for, post-MVP)
- Attendance trends by programme type.
- Capacity vs demand insights (registrations, waitlists, no-shows where tracked).
- Leadership pipeline signals (host/chair/mentor participation over time).
- Conference readiness dashboards (for example Cornerstone preparation indicators).

## Approval Links (Security)
- If approvals are actioned via email links, use short-lived, single-use tokens.
- Store only a hash of the token; require authentication when risk policy demands it.

## Onboarding and Reset Links (Security)
- Invitation and credential reset links follow the same pattern: short-lived, single-use tokens.
- Store only hashed tokens; never log raw tokens.
- If a temporary password is used, it must be forced to change on first use and should expire.
