# Architecture

## Strategic Positioning
This platform is a governance-aware web operating system for IWFSA.

It is not a SharePoint page customization. It is a standalone web application with optional Microsoft 365 integrations.

## Delivery Model
- Standalone public web application served over a normal web host or container platform
- Separate web and API applications with a shared repository and deployment boundary
- Web-first routes for public, member, and admin experiences
- Optional integrations behind the API for documents, online meetings, and calendar sync

See also: `docs/web-deployment-model.md`

## Chosen Baseline
- Runtime: Node.js 22+ with ESM modules
- Web UI: `apps/web`
- API: `apps/api`
- Data layer: SQLite via Node built-ins and SQL migrations
- HTTP baseline: built-in `node:http`
- Tests: Node built-in test runner

## High-Level Components
- Public website
- Member portal
- Admin console
- API for auth, members, events, notifications, documents, and reporting
- Database for members, events, signups, roles, revisions, and audit history

## Core Design Principles
- Public pages never expose internal event data
- Internal APIs require authentication and role checks
- RBAC and event-scoped permissions govern operational access
- Privacy-by-design and consent-aware handling apply to birthdays, photos, and social posting
- Audit logging captures sensitive administrative actions
- Background work must be retry-safe and operationally visible

## Integration Strategy
Default platform operation does not require Microsoft 365.

Optional integrations:
- Microsoft Teams / Graph for creating online meeting links
- SharePoint for protected event document storage
- Calendar sync providers for direct insert/update behavior
- Social channels for approved celebration posts

## Hosting Guidance
- Co-host web and API behind one TLS boundary for MVP simplicity
- Keep `apps/web` and `apps/api` logically separate for future extraction
- Use environment-based secret injection in staging and production
- Treat integration features as feature-flagged and easy to disable

## Background Jobs
Use queue or worker processes for:
- notification fan-out
- member import processing
- onboarding invites
- credential resets
- scheduled social workflows
- image generation and other async tasks

Reliability requirements:
- idempotent execution
- retry safety
- clear admin-visible outcomes

## Security Notes
- Approval, activation, reset, and RSVP links must use short-lived single-use tokens
- Store hashes of sensitive tokens, not raw token values
- Never expose SharePoint or other provider credentials to end users
