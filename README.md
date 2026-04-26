# IWFSA Web Platform

This repository hosts the standalone IWFSA web application.

The product is delivered as its own web platform rather than as a SharePoint-hosted experience. Microsoft 365 services remain optional integrations for event documents, Teams meeting automation, and calendar sync.

## Product Surfaces
- Public website for mission, conference, contact, and external storytelling
- Member portal for events, registrations, notifications, birthdays, SMS preferences, and celebration threads
- Admin console for member operations, imports, event management, notification monitoring, reporting, and moderation

## Architecture Summary
- `apps/web`: Node-served web UI shells for public, member, and admin routes
- `apps/api`: Node API for auth, events, notifications, members, imports, documents, and reporting
- `data`: SQLite database used by the modular monolith
- `docs`: product, architecture, deployment, operations, and integration guidance

Default deployment model:
- Web and API run as a standalone web application behind TLS on a normal web host or container platform.
- SharePoint is not the host for the app itself.
- SharePoint and Microsoft Teams can be switched on later as optional back-end integrations.

## Core Capabilities
- Public content that never leaks internal member activity
- Authenticated member event directory with waitlist and calendar support
- Birthday visibility and celebration tooling with consent-aware handling
- Admin member import from Excel plus invite and credential-reset flows
- Admin-controlled annual membership fees and good-standing access governance
- Event publishing, collaboration, notification delivery, and reporting

## Documentation Index
- Product requirements: `docs/product-requirements.md`
- Membership fees and good-standing implementation plan: `docs/membership-fees-plan.md`
- Architecture overview: `docs/architecture.md`
- Web deployment model: `docs/web-deployment-model.md`
- Security and privacy baseline: `docs/privacy-baseline.md`
- Roles and permissions: `docs/rbac-permissions.md`
- Data model: `docs/data-model.md`
- Notifications and messaging: `docs/notifications.md`
- Member import spec: `docs/member-import.md`
- Member import service contract: `docs/member-import-service-contract.md`
- Admin runbook: `docs/admin-runbook.md`
- Calendar integration options: `docs/integrations/calendars.md`
- Microsoft Teams integration: `docs/integrations/microsoft-teams.md`
- Optional SharePoint document storage integration: `docs/integrations/sharepoint.md`
- Optional Microsoft 365 setup checklist: `docs/integrations/m365-setup-checklist.md`
- Social media and celebration workflow: `docs/integrations/social-media.md`

## Current Status
- Runtime baseline, database migrations, tests, and build pipeline are already in place.
- The web UI is now aligned to a web-first delivery model with responsive public, member, and admin surfaces.
- Current checkpoint in the build status table: `4.1 - Enhancements Wave`

## Local Development
1. `npm run migrate`
2. `npm run dev:api`
3. `npm run dev:web`

Or run both services together:
- `npm run dev:all`
- `npm run dev:stop`

## Temporary Bootstrap Admin
- Username: `akeida`
- Password: `1possibility`

This account is seeded automatically during migrations and refreshed if an older database snapshot drifts from the expected credentials.
