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
- Database for members, events, signups, roles, profile review state, revisions, and audit history

## Core Design Principles
- Public pages never expose internal event data
- Internal APIs require authentication and role checks
- Authentication starts from one shared sign-in entry point, then routes users by authenticated role
- RBAC and event-scoped permissions govern operational access
- Privacy-by-design and consent-aware handling apply to birthdays, photos, public profile visibility, and social posting
- Member-managed profile visibility defaults to non-public states until the member chooses to share and an admin reviews public-facing content
- Honorary and memorial content is admin-managed and published only through explicit governance controls
- Audit logging captures sensitive administrative actions
- Background work must be retry-safe and operationally visible

## Identity and Routing
- The application exposes one `Sign in` entry point for members, event editors, admins, and chief admins.
- After authentication, the platform determines the correct workspace from the user's assigned role.
- Role-based routing keeps the public surface simple while preserving least-privilege access inside member and admin areas.
- Activation and reset flows remain separate from day-to-day sign-in and are served through dedicated tokenized routes.

## Profile Governance and Public Storytelling
- Member profiles support field-level visibility states for private, admin-visible, member-visible, submitted-for-review, and publicly approved content.
- Public profile publication is a review workflow, not a direct publish action from the member area.
- Admin review queues govern submitted public biographies, approved external links, and other member-approved public storytelling elements.
- Honorary member entries and memorial entries are curated institutional content, managed only from the admin surface and published to the public site once approved.
- Review and publication actions for sensitive profile or memorial content must be audit logged.

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
- public review notifications
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
