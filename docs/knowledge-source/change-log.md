# Change Log

This is the append-only summary of notable project changes for external agents and stakeholders.

Use it to understand what changed, when it changed, and where to read more.

## Entries

### 2026-05-02 - Seeded profile preview and member gallery asset serving refined
- Summary:
  - Added a richer seeded member profile for live directory preview with mock portrait imagery, gallery media, leadership details, contact preferences, and external links.
  - Added mock portrait assets for several seeded members so the browse rail and viewed-profile strip can be validated with actual imagery instead of initials only.
  - Fixed the web server to serve any file from `apps/web/public/` at `/assets/*` rather than only a small hardcoded asset list, preventing new profile imagery from 404ing.
- Affected areas:
  - seeded member directory preview data
  - read-only profile browsing and paging validation
  - web static asset serving
- Reference docs:
  - `apps/api/src/server.mjs`
  - `apps/web/src/server.mjs`
  - `apps/web/src/templates.mjs`
  - `apps/web/public/styles.css`
  - `apps/web/public/member-portrait-ayanda.svg`
  - `apps/web/test/server.test.mjs`

### 2026-05-02 - Member leadership directory and richer profile settings expanded
- Summary:
  - Extended the member profile data model and API to store richer directory details, linked media records, and contact-preference metadata without relying on heavy local image storage.
  - Expanded the member `Profile Settings` workspace with premium-directory fields, linked-media inputs, richer visibility controls, and a direct `View My Public Profile` path into the read-only directory surface.
  - Upgraded the read-only member directory/profile experience so cards and profile views foreground leadership, sector, location, expertise, contributions, media links, and privacy-aware contact details.
  - Added approval-aware linked-media behavior so newly submitted gallery items stay out of the read-only directory until admin review is completed through the existing public-profile review flow.
- Affected areas:
  - member directory and read-only profile browsing
  - member profile settings and visibility controls
  - linked media and contact-preference persistence
  - API and web verification coverage
- Reference docs:
  - `apps/api/src/server.mjs`
  - `apps/api/migrations/0020_member_profile_directory_extras.sql`
  - `apps/api/test/server.test.mjs`
  - `apps/web/src/templates.mjs`
  - `apps/web/public/styles.css`
  - `apps/web/test/server.test.mjs`

### 2026-05-02 - Admin-managed public homepage hero image added
- Summary:
  - Added persisted site settings for the public homepage hero image so the lead public image is no longer hardcoded.
  - Added a public read API plus admin-only save, upload, and reset routes for the homepage hero image with audit logging.
  - Added an Admin Console Overview card that lets admins link an external image or upload one into the site, choose crop focus, review fit guidance, and preview the homepage crop.
- Affected areas:
  - public homepage hero image
  - admin Overview workflow
  - site settings storage and audit trail
- Reference docs:
  - `apps/api/src/server.mjs`
  - `apps/api/migrations/0021_site_settings.sql`
  - `apps/api/test/server.test.mjs`
  - `apps/web/src/templates.mjs`
  - `apps/web/test/server.test.mjs`

### 2026-05-02 - Admin console navigation unified around Governance Console modules
- Summary:
  - Removed the separate admin hero pills for Members, Events, and Audit so the Governance Console uses one consistent module navigation set.
  - Added an Audit button to the main admin module row and mapped it to the existing Membership & Fees workspace so audit history stays in the governance flow.
  - Refined the admin hero guidance text to explain the consolidated navigation pattern.
- Affected areas:
  - admin console navigation
  - membership and fees audit access path
  - governance console hero guidance
- Reference docs:
  - `apps/web/src/templates.mjs`
  - `apps/web/test/server.test.mjs`

### 2026-04-27 - Profile moderation handoff verified and 4.7 slice documented
- Summary:
  - Verified the current member-profile moderation handoff on the running build by submitting profile fields for public review and confirming the admin review queue received them.
  - Cleared the local verification submission after the review check.
  - Added a concrete checkpoint `4.7` implementation slice covering approved public rendering, link normalization, API/web test additions, and validation order.
- Affected areas:
  - member profile visibility workflow
  - admin public profile review queue
  - checkpoint 4.7 planning
- Reference docs:
  - `docs/2026-04-27-4.7-social-links-visibility-slice.md`
  - `docs/2026-04-27-release-note.md`

### 2026-04-27 - Production alias refreshed and event visibility verified
- Summary:
  - Published the current build to the existing production alias `https://iwfsa-platform.vercel.app` after a clean `npm run ci` validation pass.
  - Verified the live deployment via the public homepage and `/health` endpoint.
  - Manually verified that a member-created all-members event appears in both the member event directory and the admin Event Hub.
  - Manually verified that an admin-created board-only event appears in the admin Event Hub while remaining hidden from a verified non-board member view.
- Affected areas:
  - production deployment
  - member event creation/listing
  - admin Event Hub listing
  - audience-gated visibility
- Reference docs:
  - `docs/2026-04-27-release-note.md`
  - `docs/knowledge-source/current-state.md`

### 2026-04-27 - Admin members, events, and legacy sections refined
- Summary:
  - Made the honorary and memorial admin area explicit as a Historical Figures & Past Members section for institutional memory and significant founding figures.
  - Added compact admin member directory filters for status, role, group, sorting, and reset so admins can work with the list more efficiently.
  - Tightened the admin member add controls into a denser layout to reduce full-width form sprawl.
  - Reset event list filters after event creation/update so newly entered meetings remain visible in the Event Hub and member event list.
- Affected areas:
  - admin member directory
  - honorary member and memorial record administration
  - admin Event Hub
  - member event creation/listing
- Reference docs:
  - `apps/web/src/templates.mjs`
  - `apps/web/public/styles.css`
  - `apps/web/test/server.test.mjs`

### 2026-04-27 - Member directory display encoding guard
- Summary:
  - Added client-side display normalization for member organisation/contact values so mojibaked dash placeholders such as `â€”` do not appear in member lists, invitee search results, notification delivery rows, or import review surfaces.
  - Replaced existing encoded placeholder illustration text with clear ASCII labels.
  - Added web route assertions to catch reintroduced mojibake in rendered member and admin pages.
- Affected areas:
  - admin member directory
  - member/admin invitee search results
  - notification delivery report
  - member import review/edit surface
- Reference docs:
  - `apps/web/src/templates.mjs`
  - `apps/web/test/server.test.mjs`

### 2026-04-27 - UI structure and logo integration hardening
- Summary:
  - Tightened the public, sign-in, member, and admin visual structure around the supplied IWFSA logo assets.
  - Added logo-backed context cards to the member and admin hero areas and a compact logo mark to the public hero.
  - Repaired responsive CSS reliability, restored sticky-header behavior, and made admin overview tiles keyboard/touch-friendly buttons.
- Affected areas:
  - public web surface
  - unified sign-in surface
  - member portal dashboard
  - admin console overview
- Reference docs:
  - `apps/web/src/templates.mjs`
  - `apps/web/public/styles.css`

### 2026-04-27 - Public-profile review and honorary/memorial admin foundations added
- Summary:
  - Extended the member profile implementation slice from basic visibility to field-level visibility overrides with explicit public-review states.
  - Added backend storage and admin-facing workflow for pending public-profile reviews, including approve/reject decisions.
  - Added admin-managed honorary member and memorial entry storage plus initial admin console forms/tables for managing those records.
- Affected areas:
  - member profile visibility model
  - admin review workflow
  - honorary and memorial data storage
  - admin console member-management surface
- Reference docs:
  - `apps/api/src/server.mjs`
  - `apps/api/migrations/0020_member_profile_reviews_and_legacy_honours.sql`
  - `apps/api/test/server.test.mjs`
  - `apps/web/src/templates.mjs`
  - `docs/build-playbook.md`

### 2026-04-27 - Member profile foundation implementation started
- Summary:
  - Propagated the 2026-04-27 member-controlled profile and connected-sharing plan into the main requirements, roadmap, privacy, RBAC, UX, and data-model docs.
  - Started the first technical slice by extending the member profile API and member portal form with richer professional fields, manual professional links, and a basic visibility model.
  - Confirmed that unified sign-in and role-aware routing were already present in the current web and API flow, so implementation moved directly to the profile foundation.
- Affected areas:
  - member profile API
  - member portal profile UI
  - roadmap and governance docs
  - build status tracking
- Reference docs:
  - `docs/product-requirements.md`
  - `docs/privacy-baseline.md`
  - `docs/rbac-permissions.md`
  - `docs/data-model.md`
  - `docs/ux-notes.md`
  - `docs/roadmap.md`
  - `docs/build-playbook.md`
  - `apps/api/src/server.mjs`
  - `apps/api/migrations/0019_member_profile_visibility.sql`
  - `apps/web/src/templates.mjs`

### 2026-04-27 - Knowledge-source folder and external project tracking added
- Summary:
  - Added `docs/knowledge-source/` as the dedicated external reference and handover layer for the project.
  - Added stable project representation, current-state summary, and append-only change tracking.
  - Updated project instructions so future work must keep this knowledge source current.
- Affected areas:
  - documentation workflow
  - external handover
  - project instructions
- Reference docs:
  - `docs/knowledge-source/README.md`
  - `docs/knowledge-source/project-representation.md`
  - `docs/knowledge-source/current-state.md`
  - `AGENT.md`
  - `.github/copilot-instructions.md`

### 2026-04-27 - Member-controlled profiles, connected sharing, honorary members, memorials, and unified sign-in planned
- Summary:
  - Added a canonical implementation plan for unified sign-in, member-controlled profiles, social links, conference sharing, honorary members, and memorial sections.
  - Logged the proposal in the change-alignment process as a coordinated documentation-first enhancement.
- Affected areas:
  - product requirements planning
  - privacy and RBAC planning
  - public/member/admin surface planning
- Reference docs:
  - `docs/2026-04-27-member-profiles-connected-sharing-plan.md`
  - `docs/change-alignment-log.md`

### 2026-04-26 - Membership fees and good-standing governance plan added
- Summary:
  - Added a canonical plan for annual membership fees, good-standing rules, and admin-controlled access governance.
- Affected areas:
  - membership governance
  - access policy
  - admin operations
- Reference docs:
  - `docs/membership-fees-plan.md`
  - `docs/change-alignment-log.md`
