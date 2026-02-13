# IWFSA Web Application (Public + Member Portal + Admin)

This repository hosts the IWFSA (International Women's Forum South Africa) web application.

## Goal
Create a modern web experience that:
- Presents a public landing site (marketing + general information)
- Provides a member-only portal (authenticated) for internal events and member services
- Provides an admin console (restricted) for managing members, events, permissions, and content

## Core Features (MVP)
### Public (non-members)
- Marketing/brand site: mission, leadership, contact, partners/sponsors
- Member login entry point
- No internal event visibility

### Members (authenticated)
- Event listing with filters: week / month / year
- Event details: venue (physical) or Teams (online), time, chairperson/host, capacity
- Registration: one-click sign-up, capacity tracking, waitlist when full
- Countdown to registration close
- Notifications on event changes: postponed/cancelled
- Add-to-calendar options (manual): `.ics` download, Google add link, Outlook add link

### Administrators
- Full CRUD for events and member records
- Provision members via Excel import and send onboarding invites
- Trigger member credential resets (private delivery)
- Event publishing and delegation:
  - Members/event editors/admins can publish directly from draft (no moderation gate)
  - Event creators can assign event-scoped editors for their own events
- Delegate event editing rights per-event (event-scoped permissions)
- Event change notifications to registrants
- Audit log + rollback for event edits and permission changes

## Build Workflow (Step-by-Step)
During implementation, we build this system checkpoint by checkpoint with Codex guidance.

Start here:
1. `AGENT.md` - collaboration contract and build session protocol
2. `docs/build-playbook.md` - detailed phase/checkpoint execution guide
3. `docs/roadmap.md` - phase goals and exit criteria
4. `.github/copilot-instructions.md` - repository custom instructions for assistants

Working rule:
- Do not start a new checkpoint until the current one meets its exit criteria.

## Online Events (Microsoft Teams)
- Target: no anonymous join; guest access may apply depending on tenant policy.
- Preferred automation (when available): generate Teams join links via Microsoft Graph.
- Fallback (if tenant/app registration causes delays): admin manually pastes the Teams join link.

Details: see `docs/integrations/microsoft-teams.md`.

## Documentation Index
- Product requirements: `docs/product-requirements.md`
- Security and privacy baseline: `docs/privacy-baseline.md`
- Member import (Excel) spec: `docs/member-import.md`
- Member import service contract (API/process): `docs/member-import-service-contract.md`
- Change alignment log (break-risk decisions): `docs/change-alignment-log.md`
- Roles & permissions (RBAC): `docs/rbac-permissions.md`
- Data model (draft): `docs/data-model.md`
- Notifications & messaging: `docs/notifications.md`
- Admin runbook: `docs/admin-runbook.md`
- Calendar options: `docs/integrations/calendars.md`
- Microsoft Teams automation: `docs/integrations/microsoft-teams.md`
- Social media posting (optional): `docs/integrations/social-media.md`
- SharePoint document storage: `docs/integrations/sharepoint.md`
- Microsoft 365 tenant setup checklist: `docs/integrations/m365-setup-checklist.md`
- Architecture (draft): `docs/architecture.md`
- Build playbook: `docs/build-playbook.md`
- Custom assistant instructions: `.github/copilot-instructions.md`

## Status
This repo is now in active implementation.

Completed baseline:
- ADRs for stack/hosting/environment strategy
- Initial `apps/api` and `apps/web` scaffold
- SQLite migration runner and baseline schema
- CI checks for lint, typecheck, test, and build

Restart run (beginning from plan start):
- Restart at `0.1` and progress checkpoint-by-checkpoint through the full plan.
- Prior implemented work is carried forward as baseline and revalidated.
- Unfinished work from the prior cycle remains integrated and is executed in sequence (`2.2+` when reached).

Current checkpoint: `1.4 - Event Lifecycle and Listings`

## Local Run
1. `npm run migrate`
2. `npm run dev:api`
3. `npm run dev:web`

Or run both services together:
- `npm run dev:all`
- `npm run dev:stop`

## Temporary Bootstrap Admin (Local Dev)
- Username: `akeida`
- Password: `akeida123`

This account is seeded automatically during migrations if it does not already exist.
