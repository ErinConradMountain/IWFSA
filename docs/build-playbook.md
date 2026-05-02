# Build Playbook (Step-by-Step Delivery Guide)

This document is the implementation guide used during the build phase.

## 0) Strategic Design Goals (Why This Platform Exists)
### Strategic Positioning Statement
This platform is not “a website with logins.”
It is a governance-aware digital operating system for an elite women’s leadership forum — designed to protect trust, enable participation, and quietly strengthen the global IWF ecosystem.

If you’d like, the next step could be:
- A capability maturity map (MVP → Year 3).
- A governance risk register mapped to features.
- A Cornerstone Conference 2025 digital control model aligned to this architecture.

### 0.1 Institutional Memory & Governance Continuity
- Convert IWFSA intellectual capital, decisions, and programmes into durable institutional memory.
- Support board continuity across changing office bearers.
- Preserve decision trails for conferences (for example Cornerstone 2025), programmes, and policy.
- Enable clean auditability aligned with ethical leadership and POPIA obligations.
- Global value: create a repeatable forum-operating model that IWF Global can reference, benchmark, or replicate.

Build implications for this playbook:
- Treat audit logging, revision history, workflow controls, and import traceability as core MVP requirements.
- Design for leadership handover: records must remain interpretable without institutional memory being held by one person.
- Keep governance records exportable/reportable for board and compliance review.

## 0.2) Cross-Cutting Capabilities (Quiet but Powerful)
### 0.2.1) Privacy-by-Design and Ethical Leadership
- POPIA-aligned data minimisation.
- Explicit consent gates.
- No social posting without opt-in.
- Secure internal APIs with RBAC enforcement.
- This directly reflects IWFSA's Code of Ethical Leadership and governance culture.

### 0.2.2) Background Jobs and Reliability
- Event notifications, imports, and invitations run asynchronously.
- Idempotent processing is mandatory (safe retries, no duplicates).
- Admins get clear success/failure reporting for operational actions.

### 0.2.3) Operational Intelligence (Future Layer)
- Not MVP, but designed-for from early architecture decisions.
- Attendance trends by programme type.
- Capacity vs demand insights.
- Leadership pipeline signals (who hosts, who chairs, who mentors).
- Conference readiness dashboards (for example Cornerstone).
- Event records must always capture and surface a clear host for each meeting/event to support leadership pipeline insights.

Global value:
- Positions IWFSA as a data-informed leadership forum, not just an events host.

## 0.3) Change Alignment Gate (Protect the Original Plan)
Every new suggestion must be classified before adoption:
- `Enhancement (non-breaking)`: extends value without changing approved MVP behavior or phase order.
- `Breaking change`: alters approved behavior, sequence, security posture, or delivery scope.

Non-breaking acceptance checklist:
- Preserves MVP scope boundaries and feature-flag strategy.
- Preserves approved role/permission and consent expectations.
- Preserves existing committed API and workflow behavior unless versioned.
- Preserves operational reliability expectations (idempotency, auditability, admin reporting).

If breaking:
- Record impact, affected docs, and mitigation in `docs/change-alignment-log.md`.
- Do not merge until explicit alignment decision is documented.

Gate execution workflow:
1. Classify proposal as `Enhancement (non-breaking)` or `Breaking change`.
2. For non-breaking proposals, validate all non-breaking checklist items explicitly before implementation.
3. For breaking proposals, open/update `docs/change-alignment-log.md` first and document acceptance/rejection decision.
4. Only merge when classification, decision, and affected-doc updates are complete.


## 1) Purpose
- Convert planning documentation into an executable build sequence.
- Keep scope controlled so the team reaches a testable MVP quickly.
- Define exactly how Codex will guide each checkpoint.

## 1.1 Beginner-Friendly Guide (Plain English)
If you are new to this, use this section as a map for the rest of the document.

Key terms in simple words:
- Strategy Goals: why the platform exists and what it protects.
- Cross-Cutting Capabilities: features that must apply everywhere (privacy, reliability, reporting).
- Change Alignment Gate: a rule that stops unapproved scope changes.
- Phase: a big group of work (for example, foundations vs integrations).
- Checkpoint: a smaller milestone inside a phase.
- Tasks: the specific things to build.
- Validation: how we check that the work is correct.
- Exit criteria: the pass/fail rule for finishing a checkpoint.

Plain-English checkpoint map:
- 0.1 Stack and Hosting ADRs: decide the technology choices and write them down.
- 0.2 Security and Privacy Baseline: list what personal data exists and how it is protected.

- 0.3 MVP Contract and Feature Flags: lock the MVP scope and park extras behind flags.
- 1.1 Project Scaffold and CI: set up the project so it can build, test, and run.
- 1.2 Auth and RBAC Core: build login and role-based access control.
- 1.3 Member Provisioning: allow admins to import members and send invites/resets.
- 1.4 Event Lifecycle and Listings: create events and show the right events to members.
- 1.5 Registration, Capacity, Waitlist: handle signups safely with limits and waitlists.
- 1.6 Notifications and Audit Trail: send updates and keep immutable logs of actions.
- 1.7 Calendar Actions and Teams Fallback: give members calendar links and manual Teams links.
- 1.8 Birthdays Sidebar: show upcoming birthdays only when consent allows.
- 1.9 Admin Console UX and Event Hub: separate admin panels, persist help/tooltips, ship the Event Hub card layout, add queue status visibility, and expose business audience options.
- 2.1 Planning and Knowledge Base Reset: refresh docs, checkpoint sequencing, and status-table alignment for a new build session.
- 2.2 Membership Data Consistency Hardening: enforce one canonical member-import membership set and remove duplicate import staging structures.
- 2.3 Navigation & UX v2: introduce modular navigation within Public, Member Portal, and Admin Console so admins and members can jump between modules instead of scrolling.
- 2.4 Notifications UX Simplification: simplify Notification Delivery Report and Queue Status views so admins see clear, member-centric information and queue health at a glance.
- 2.5 Regression and Release Readiness: run focused regression, lock acceptance criteria, and prepare the next feature wave.
- 3.1 SharePoint Document Flow: store event documents safely and control access.
- 3.2 Teams Graph Automation: auto-create Teams meetings when ready.
- 3.3 Calendar Sync: optional live sync to personal calendars.

## 2) How We Work With Codex Each Step
For each checkpoint, Codex provides:
1. Objective: what we are building now and why.
2. Prerequisites: what must already be complete.
3. Implementation tasks: concrete code/config/documentation changes.
4. Validation: tests and manual checks to run.
5. Exit criteria: pass/fail gate.
6. Handover: what was completed and what comes next.

Execution rule:
- Do not begin the next checkpoint until the current one passes exit criteria.

## 3) Global Delivery Guardrails
- MVP first. Optional social and advanced automation stay feature-flagged.
- Keep architecture simple: modular monolith first, extend later.
- External dependency delays must not block core delivery.
- All sensitive actions must be audited.
- Access control and data privacy checks are mandatory.

### Member Value Without Overexposure
Goal: deliver high-trust, high-signal value to members without turning IWFSA into a noisy social network.

- Events are intentional, not broadcast-driven.
- No public leakage of internal activity.
- Member experience respects seniority, privacy, and consent.

Global value: demonstrates how elite, invitation-only networks can modernise without diluting prestige.

### MVP-First, Future-Ready Architecture
Goal: build a controlled digital core that can scale when governance, budget, and readiness allow.

- Modular monolith now → service extraction later.
- Deferred integrations (Teams automation, CRM sync, global federation APIs).
- Avoid “tech debt by ambition”.

Global value: provides IWF Global with a reference architecture for forums at different maturity levels.

### Surface-by-Surface Goals & Features

#### A) Public-Facing Site
Purpose: brand, legitimacy, narrative control.

Core goals:
- Reinforce IWFSA’s ethical leadership mandate.
- Support sponsorship, advocacy, and visibility.
- Clearly separate public mission from the private network.

Key features:
- Mission, pillars, leadership, sponsors, flagship programmes.
- Controlled storytelling (no calendars, no member details).
- Conference landing pages (for example Cornerstone 2025) with explicit boundaries.

IWF Global alignment:
- Brand consistency with the global IWF narrative.
- Localised storytelling that can feed into global advocacy themes.

#### B) Member Portal
Purpose: trust-based participation and engagement.

Core goals:
- Make participation effortless, not demanding.
- Reduce admin friction for high-calibre women.
- Encourage attendance, mentoring, and continuity.

Key features:
- Event discovery (week / month / year views).
- One-click registration with capacity + waitlist logic.
- Clear authority signals: host, chair, purpose.
- Calendar actions (`.ics`, Google, Outlook).
- Change notifications (reschedule / cancel / move online).
- Consent-gated personal data (birthdays, visibility).

IWF Global alignment:
- Members experience local forum excellence that reflects global standards.
- Potential future bridge to global events and leadership pipelines.

#### C) Admin Console (Restricted)
Purpose: governance, control, and operational intelligence.

Core goals:
- Protect the organisation from risk.
- Enable delegation without loss of control.
- Ensure no single person becomes a bottleneck.

Key features:
- Bulk member provisioning via Excel (mapping, validation, deduping).
- Invitation-based onboarding (no password exposure).
- Event lifecycle: draft → delegated edit → direct publish (no moderation gate).
- Event-scoped permissions (who may edit this event).
- Audit logs for sensitive actions.
- Rollback for critical changes (dates, capacity, links).

IWF Global alignment:
- Demonstrates best-practice forum governance.
- Creates confidence in IWFSA as a host, partner, and custodian of global initiatives.

## 4) MVP Scope Lock
In scope for MVP:
- Auth + RBAC + audit foundation
- Member provisioning (Excel import + invite + credential reset)
- Event listing and event lifecycle workflow
- Registration + capacity + waitlist
- In-app + transactional email notifications
- Manual calendar actions (`.ics` + Google/Outlook links)
- Teams manual link fallback
- Birthdays sidebar in member portal (consent-gated, member-only)

Out of scope for MVP launch (feature-flagged/off by default):
- OAuth calendar sync
- Automated Teams Graph creation (unless tenant setup is ready)
- Full social publishing automation

Feature-flag register for out-of-scope capabilities (default `false`):
- `FEATURE_CALENDAR_OAUTH_SYNC`
- `FEATURE_TEAMS_GRAPH_AUTOMATION`
- `FEATURE_SOCIAL_AUTOMATION`

## 5) Phase and Checkpoint Plan

Restart run directive (2026-02-08):
- Restart execution from checkpoint `0.1` and walk the full plan in sequence.
- Keep prior implementation outcomes as carry-forward baseline evidence (do not discard working code).
- At each checkpoint, validate what already exists, then complete missing scope from prior unfinished work.
- Unfinished items from the prior cycle (notably `2.2+`) remain integrated and are executed when reached in order.

## Phase 0 - Blueprint and Decision Lock
Status: Done (restart run)

### Checkpoint 0.1 - Stack and Hosting ADRs
Status: Done (restart run)

Objective:
- Finalize backend/frontend/runtime/database/queue choices and hosting model.

Tasks:
- Create ADRs for stack and hosting choices.
- Define environment strategy (dev/staging/prod).
- Define secret management approach.
- Revalidate ADR decisions against current codebase/runtime scripts before sign-off in restart run.

Validation:
- Architecture and roadmap docs reference the same chosen stack.

Exit criteria:
- ADRs approved and committed.

### Checkpoint 0.2 - Security and Privacy Baseline
Status: Done (restart run)

Objective:
- Establish POPIA-aligned baseline before implementation.

Tasks:
- Confirm personal data inventory.
- Confirm consent requirements for birthday visibility/social use.
- Define retention expectations for audit and notifications.
- Publish/revalidate baseline in `docs/privacy-baseline.md` and align references in PRD/architecture/operations docs.

Validation:
- Security/privacy decisions reflected in requirements and architecture docs.
- `docs/privacy-baseline.md` is present and referenced by requirements, architecture, and operational docs.

Exit criteria:
- Privacy baseline documented and accepted.

### Checkpoint 0.3 - MVP Contract and Feature Flags
Status: Done (restart run)

Objective:
- Prevent scope creep during build.

Tasks:
- Publish MVP in-scope and out-of-scope list.
- Define feature flags for non-MVP capabilities.
- Operationalize the change alignment gate across contributor instructions (`CONTRIBUTING.md`, `AGENT.md`, `.github/copilot-instructions.md`) and the CAL log format.

Validation:
- Roadmap and AGENT docs align with same scope boundary.
- Gate workflow and breaking/non-breaking classification instructions are consistent across planning and contributor docs.

Exit criteria:
- MVP contract and feature-flag boundaries are visible in repository docs, and the change alignment gate is operational.

## Phase 1 - MVP Core Delivery
Status: In Progress (restart run sequence)

### Checkpoint 1.1 - Project Scaffold and CI
Status: Done (restart run)

Objective:
- Establish reliable local and CI build/test pipelines.

Tasks:
- Scaffold app and API structure.
- Add lint/typecheck/test/build CI jobs.
- Add `.env.example` and environment validation.
- Set up migration baseline.

Validation:
- Clean clone can run and pass CI checks.

Exit criteria:
- Development baseline is reproducible.

### Checkpoint 1.2 - Auth and RBAC Core
Objective:
- Enforce role-based access and event-scoped permissions, including member-authored event drafts.

Tasks:
- Implement login/logout/password flows.
- Implement role model and policy checks.
- Allow members to create, edit, and publish their own draft events.
- Implement event-scoped EventEditor grants.
- Add audit records for permission changes.

Validation:
- Automated tests for role matrix and protected routes.

Exit criteria:
- Unauthorized access is blocked consistently.

### Checkpoint 1.3 - Member Provisioning
Objective:
- Let admins onboard members without self-signup.

Tasks:
- Add Excel import workflow.
- Add onboarding invite workflow.
- Add credential reset workflow for admins.
- Add import validation and error reporting.
- Populate and display member full names in the Admin Member Directory list once records are imported/updated.
- Run dry-run validation on the source spreadsheet and produce summary/issues artifacts before import execution.
- Implement API/service behavior from `docs/member-import-service-contract.md` (dry-run, unified membership-set outcomes, apply, report export).
- Enforce an activation requirement: members must change temporary passwords before portal access is granted; username personalisation is policy-driven (recommended when generated/default usernames are used). Unactivated accounts remain in the database but cannot authenticate with temporary credentials.
- Align import behavior to the baseline spreadsheet spec in `docs/member-import.md` (headers, mapping, and dedupe rules).
- Add a sanitized import fixture (fake data, same headers) for automated testing; do not use real member data in fixtures.

Validation:
- Import test file produces expected members and clear error handling.
- Admin Member Directory shows each member's full name (falling back to username only when full name is missing).
- Dry-run summary reports zero blocking issues (missing required fields, invalid emails, duplicate emails).
- Invite and reset emails are transactional, private to the member, and use short-lived, single-use links/tokens.
- Admins can review clear batch outcomes (created/updated/skipped/failed plus row-level reasons).
- Tests confirm unactivated users cannot log in until activation is completed.

Exit criteria:
- Admin can onboard and recover member access end-to-end.

### Checkpoint 1.4 - Event Lifecycle and Listings
Objective:
- Deliver end-to-end event creation and member visibility.

Tasks:
- Event CRUD for members (own meetings), event editors (assigned scope), and admins (all events).
- Draft -> direct publish workflow (no approval gate).
- Event creators can edit their own meetings and collaborate with event-scoped editors via grants.
- Event creators can assign/revoke event-scoped editors on their own events.
- Week/month/year member filters.
- Audience gating with enumerated options: Board of Directors; Member Affairs; Brand and Reputation; Strategic Alliances and Advocacy; Catalytic Strategy and Voice; Leadership Development; All Members.
- Detect schedule clashes (time + overlapping audience) during meeting creation and issue creator-facing in-app warnings without blocking creation.
- Add meeting planning management endpoints (summary + organizer updates) and email RSVP-link confirmations for invitees.
- Maintain a member-facing published event directory where eligible members can browse and register while capacity is available.

Validation:
- Tests for lifecycle transitions and visibility rules.
- Tests confirm overlap warnings are generated while overlapping meetings still create successfully.
- Tests confirm RSVP links register participation and organisers can send planning updates by scope.
- Tests confirm creator-managed event-editor grants and permission audit metadata.

Exit criteria:
- Members see only eligible published events.
- Members can publish events without moderation and collaborate through event-scoped grants with audited permission changes.

### Checkpoint 1.5 - Registration, Capacity, Waitlist
Objective:
- Handle signup flow safely under concurrency.

Tasks:
- Implement one-signup-per-member-per-event constraint.
- Implement atomic capacity checks.
- Implement waitlist and promotion on cancellation.
- Implement registration close countdown behavior.

Validation:
- Concurrency tests demonstrate no oversubscription.

Exit criteria:
- Capacity/waitlist behavior is reliable and deterministic.

### Checkpoint 1.6 - Notifications and Audit Trail
Objective:
- Keep members informed and preserve operational traceability.

Tasks:
- In-app notification center.
- Transactional email integration.
- Queue-based fan-out with idempotency keys.
- Immutable send logs and delivery status.
- Event revision snapshots and rollback flow.
- Admin-facing delivery reporting for notification and invite outcomes (success/failure/retry state).

Validation:
- Trigger tests verify one send per user/channel/version.

Exit criteria:
- Notification and rollback paths are production-ready for MVP.

### Checkpoint 1.7 - Calendar Actions and Teams Fallback
Objective:
- Provide immediate scheduling utility without dependency risk.

Tasks:
- `.ics` generation.
- Google/Outlook add links.
- Manual Teams link entry and display.

Validation:
- Event details generate correct links and downloads.

Exit criteria:
- Members can add events to calendar and join online events via managed links.

### Checkpoint 1.8 - Birthdays Sidebar (Member Portal)
Objective:
- Deliver community value while honoring consent.

Tasks:
- Add sidebar UI with 7/14/30 day windows.
- Sort upcoming birthdays correctly with year wrap.
- Display image/fallback initials, name, and role labels.
- Enforce visibility consent gates.

Validation:
- Tests for date-window logic and consent filtering.

Exit criteria:
- Sidebar is accurate, accessible, and consent-compliant.

### Checkpoint 1.9 - Admin Console UX and Event Hub Layout
Objective:
- Separate admin panels, persist contextual help, and redesign the Event Hub for clarity and speed.

Tasks:
- Present dedicated admin panels (Admin Login, Member Directory, Member Import, Event Hub, Notification Delivery Report, Notification Queue Status).
- Persist help/tooltip content and panel configuration across sessions (non-sensitive only).
- Implement Event Hub card layout (FAB create action, filter/tools bar, reminder badge, bulk actions, responsive cards).
- Align audience selectors to business audiences and enforce the same mapping in API visibility checks.
- Keep RBAC, audit, and accessibility guardrails for all admin controls.

Validation:
- UI states, roles, and audience behavior remain server-authoritative and test-covered.
- Admin panel guidance/tooltips persist and remain keyboard accessible.

Exit criteria:
- Admin experience is consistent and operationally clear for daily use.

## Phase 2 - Consistency and UX Hardening Wave
Status: Queued (carry-forward unfinished work integrated here)

### Checkpoint 2.1 - Planning and Knowledge Base Reset
Status: Not Started (restart run)

Objective:
- Prepare a clean, current planning system for this week's development wave.

Tasks:
- Renumber checkpoint plan to keep one sequential structure.
- Align `docs/build-playbook.md`, `docs/roadmap.md`, and status-table language.
- Refresh delivered features and open work in the progress model.
- Refresh session templates and handover expectations for iterative build sessions.

Validation:
- Status table resolves one clear in-progress checkpoint.
- Roadmap and playbook do not disagree on active phase/checkpoint naming.

Exit criteria:
- Planning docs are coherent enough to drive daily implementation without ambiguity.

### Checkpoint 2.2 - Membership Data Consistency Hardening
Status: Not Started (restart run)

Objective:
- Keep import and member-directory data as one coherent membership dataset.

Tasks:
- Consolidate import batch member snapshots into one canonical membership-set representation (`membership_set_json` on `member_import_batches`) and treat it as the single source of truth for each batch.
- Prevent duplicate storage of row/member data structures while preserving audit/report needs (migrate legacy `member_import_rows` where needed, then treat that table as legacy-only support).
- Ensure import editing/apply/report behaviors all operate against the same canonical structure.
- Keep admin directory display and import summary semantics aligned so the Admin Member Directory and Membership Set Preview agree after apply.
- Standardize on a single canonical member fixture spreadsheet (fake/sanitized data) under `docs/imports/` for dev/test/demo, and document that all environments in this phase use that one dataset.
- Update import docs (`docs/member-import.md`, `docs/member-import-service-contract.md`, `docs/data-model.md`, `docs/imports/README.md`) so schema, optional columns (including phone), canonical fixture, and membership-set representation all align.

Validation:
- Dry-run/apply/report/edit flows remain functional with no duplicate member staging records.
- Member directory and import summaries agree after apply.
- The repository contains one canonical member fixture dataset and one associated validation summary set; superseded artifacts are removed or clearly marked.

Exit criteria:
- Import and directory data flow is structured, consistent, and non-duplicative, and the single-dataset rule is documented and enforced in tooling and docs.

### Checkpoint 2.3 - Navigation and UX v2 (Public / Member / Admin)
Status: Not Started (restart run)

Objective:
- Make the interface modular and easy to navigate so admins and members can move between modules without long-page hunting.

Tasks:
- Keep three top-level surfaces as canonical: `Public` (`/`), `Member Portal` (`/member`), and `Admin Console` (`/admin`).
- Add lightweight module navigation in Member Portal (for example: Dashboard, Events, Birthdays and Notifications, Profile) so one module is primary at a time.
- Add lightweight module navigation in Admin Console (for example: Overview, Members, Imports, Events, Notifications) instead of one monolithic page.
- Use anchors or hash-based routing (for example `/member#events`, `/admin#imports`) so Public CTAs and docs can deep-link directly.
- Keep Public CTAs clear and direct (Member Portal, Member demo flow, Admin Console).
- Remove visible hardcoded username/password examples from public/admin UI while keeping bootstrap guidance in developer/admin docs.

Validation:
- From Public, users can reach core modules (Member Events, Member Birthdays, Admin Members, Admin Imports, Admin Notifications) in at most two clicks.
- Top navigation labels and URLs are consistent across templates and docs.
- No hardcoded usernames/passwords are shown in public-facing or admin UI copy.

Exit criteria:
- Navigation is modular (top-level plus module-level), and non-technical admins can find core modules quickly.

### Checkpoint 2.4 - Notifications UX Simplification (Delivery Report and Queue Status)
Status: Not Started (restart run)

Objective:
- Make Notification Delivery Report and Queue Status clear, member-centric, and operationally useful.

Tasks:
- Simplify Delivery Report to a compact member-focused table with: Member name, Email, Phone, Organisation, Status badge.
- Update admin delivery endpoints/tests so delivery rows join canonical member data while richer technical audit data remains stored.
- Replace engineering-style queue row dumps with a plain-language health summary card.
- Drive queue summary from `notification_queue` aggregates (pending/processing/sent/failed) plus a simple health label (`Healthy`, `Degraded`, `Attention needed`).
- Update admin copy so next action is explicit when issues appear (check Delivery Report and follow up by member).
- Align documentation (`docs/notifications.md`, `docs/admin-runbook.md`, `docs/product-requirements.md`) to this simplified view.

 Beginner-friendly task summary (what this really means):
 - Make the Delivery Report screen show a simple table about people (who they are and whether their message went through), not technical IDs or error blobs.
 - Turn the Queue Status view into a small health card that says if the system is okay (`Healthy`), struggling (`Degraded`), or needs attention, with only a few clear counts.
 - Ensure a non-technical admin can quickly answer two questions: "Did this member get the message?" and "Is the notification system healthy right now?".
 - Keep deep technical details (internal IDs, raw error JSON, low-level queue keys) in logs/audit, not in the default admin grids.
 - Update screenshots and wording in notifications-related docs so they match the simplified, member-centric views.

Validation:
- A non-technical admin can quickly tell if the notification system is healthy and whether follow-up is needed.
- Delivery Report no longer exposes internal IDs, raw error text, or technical notification keys in the default grid.
- Queue Status shows plain-language health plus basic counts without low-level diagnostics.

Exit criteria:
- Notifications monitoring is understandable and useful for operations without losing auditability.

### Checkpoint 2.5 - Regression and Release Readiness
Status: Done (restart run)

Objective:
- Lock quality gates before starting integration wave work.

Tasks:
- Run targeted API/web regression for changed checkpoints.
- Verify migrations, status-table parsing, and admin/member critical flows.
- Capture residual risks and define go/no-go criteria for integration wave start.

Validation:
- Required lint/test/build checks are green for touched areas.

Exit criteria:
- The codebase is stable enough for the next direction wave.

## Phase 3 - Integrations and Automation
Status: Queued

### Checkpoint 3.1 - SharePoint Document Flow
Objective:
- Upload and serve event docs with app-mediated authorization.

Tasks:
- Upload to SharePoint library via Graph.
- Store site/drive/item identifiers.
- Stream downloads through app authorization checks.
- Enforce availability windows (for example minutes after event).

Validation:
- Authorized users can access docs; unauthorized users are denied.

Exit criteria:
- Document flow is secure and operational.

### Checkpoint 3.2 - Teams Graph Automation (Optional if ready)
Objective:
- Automate Teams-enabled meeting creation.

Tasks:
- Use organizer mailbox integration.
- Create Teams-enabled event via Graph.
- Persist join URL as sensitive data.
- Keep manual fallback active.

Validation:
- Publish flow can create/patch online meetings reliably.

Exit criteria:
- Automation can be enabled safely behind a feature flag.

### Checkpoint 3.3 - Calendar Sync
Objective:
- Add optional direct calendar sync.

Tasks:
- Add OAuth flow(s) for providers.
- Add insert/update/cancel sync behavior.
- Add revocation and sync failure handling.

Validation:
- Calendar updates propagate correctly for opted-in users.

Exit criteria:
- Sync is stable and opt-in only.

## Phase 4 - Enhancements
Status: In Progress

Planned enhancements:
- Push/SMS opt-in
- Reporting/exports
- Operational intelligence dashboards (attendance trends, capacity vs demand, leadership pipeline signals, conference readiness)
- Optional social celebration automation
- Unified sign-in and member profile foundation
- Social links and profile visibility controls
- Conference sharing and memory foundation
- Public storytelling review workflow
- Honorary members and memorial sections

Each enhancement follows the same checkpoint model and must not regress MVP behavior.

## 6) Test and Quality Gates (All Phases)
Required before checkpoint sign-off:
- Unit/integration tests for changed behavior
- Role and permission checks for protected actions
- Negative-path tests for invalid/unauthorized requests
- Audit trail verification for sensitive operations
- Accessibility check for changed UI surfaces
- Updated docs for behavior/configuration changes

## 7) Session Template (Use Every Time)
Use this short template at the start of each build session:
1. Active checkpoint ID
2. Objective
3. Planned tasks for this session
4. Validation to run
5. Exit criteria expected today

Use this short template at the end of each build session:
1. Completed work
2. Validation results
3. Open risks/blockers
4. Next checkpoint or remaining tasks

## 8) Execution Status
Maintain a simple status table in this file as work proceeds.

Suggested status values:
- Not Started
- In Progress
- Blocked
- Done

Status Table Last Updated: 2026-04-27
Current Checkpoint: 4.6 - Unified Sign-In and Member Profile Foundation (In Progress)

| Checkpoint | Status | Notes |
| --- | --- | --- |
| 0.1 Stack and Hosting ADRs | Done | ADR-001 and ADR-002 were revalidated for restart run against runtime, environment, and secret-management artifacts. |
| 0.2 Security and Privacy Baseline | Done | Privacy baseline revalidated and documented in `docs/privacy-baseline.md`, with consent and retention expectations aligned across requirements, architecture, security, notifications, and runbook docs. |
| 0.3 MVP Contract and Feature Flags | Done | MVP scope lock and non-MVP feature-flag boundaries are explicitly documented, and the change alignment gate workflow is operationalized across planning/contributor docs. |
| 1.1 Project Scaffold and CI | Done | CI (`npm run ci`) green on 2026-02-09; env example validated and build artifacts generated. |
| 1.2 Auth and RBAC Core | Done | Revalidated auth/login/logout/reset constraints, tightened protected-route role checks, added audited role-change path, and expanded RBAC matrix tests (including unauthorized paths). |
| 1.3 Member Provisioning | Done | Revalidated and hardened import + onboarding flows: canonical membership-set dry-run/apply/report paths, activation-gated login, full-name directory behavior, invite/reset privacy safeguards (hashed/single-use tokens), dispatch audit trails, and expanded checkpoint-aligned tests. |
| 1.4 Event Lifecycle and Listings | Done | Completed and revalidated: direct publish (no moderation), creator-managed event-scoped grants (assign/revoke), published-event visibility gating, warning-only overlap handling, meeting planning endpoints, and RSVP-link confirmation flow with coverage in API tests. |
| 1.5 Registration, Capacity, Waitlist | Done | Registration logic fully validated: atomic capacity, one-signup-per-member, deterministic waitlist FIFO promotion, countdown edge-cases, and concurrency tests all green. |
| 1.6 Notifications and Audit Trail | Done | Revalidated and completed: in-app notification center (list + mark-read + markAll), transactional email integration (stub provider), queue-based fan-out with idempotency keys for event_published/event_updated/event_cancelled, immutable send logs in notification_deliveries, event revision snapshots and rollback flow, event cancellation participant notifications, waitlist promotion in-app notifications, enriched admin delivery report (full_name/phone/organisation), queue health summary with counts/label, and 6 dedicated checkpoint 1.6 validation tests. |
| 1.7 Calendar Actions and Teams Fallback | Done | Revalidated and completed: .ics generation with DTSTART/DTEND/SUMMARY/LOCATION/DESCRIPTION, Google Calendar and Outlook add-link builders (client-side), manual Teams link entry/display via onlineJoinUrl/onlineProvider fields, URL validation for onlineJoinUrl (http/https required), onlineProvider included in ICS description, physical venue in LOCATION, and 6 dedicated checkpoint 1.7 validation tests. |
| 1.8 Birthdays Sidebar (Member Portal) | Done | Completed: Slick UI with gold branding/watermarks, API exposes photoUrl for display, Social automation stubbed (Phase 4). |
| 1.9 Admin Console UX and Event Hub Layout | Done | Implemented persisent help banners with dismissal state (localStorage), verified Event Hub card layout, and confirmed access to Business Audience options. Validated via automated tests. |
| 2.1 Planning and Knowledge Base Reset | Done | Updated docs (product requirements, runbook, ux-notes) to reflect current Admin UX and restart status. |
| 2.2 Membership Data Consistency Hardening | Done | Canonical `membership_set_json` is enforced for active import workflows while retaining a one-time legacy read fallback to keep historical batches readable. Removed duplicate `members-fixture.csv`. |
| 2.3 Navigation and UX v2 (Public / Member / Admin) | Done | Implemented modular navigation (hash-based routing) for Member Portal and Admin Console, preventing scroll fatigue, and added an admin-only public homepage hero-image control with linked-image and direct-upload options. |
| 2.4 Notifications UX Simplification (Delivery Report and Queue Status) | Done | Consolidated Delivery Report with member-centric data (name/org) and Queue Status (health summary + global counts) to reduce admin cognitive load. |
| 2.5 Regression and Release Readiness | Done | Quality gates revalidated on 2026-02-14 (`npm run ci` + focused API/Web regression) with typecheck, tests, and build green. |
| 3.1 SharePoint Document Flow | Done | Implemented event document flow with SharePoint-backed metadata persistence (`event_documents`), app-mediated upload/download endpoints, availability windows (immediate/after_event/scheduled), RBAC + audience enforcement on document access, and checkpoint validation tests for authorized download, availability gating, and restricted-audience denial. |
| 3.2 Teams Graph Automation | Done | Added feature-flagged Microsoft Graph automation for online meetings: publish creates Teams meetings, updates patch existing meetings, manual join-link fallback remains active, and meeting metadata is persisted in `event_online_meetings`. |
| 3.3 Calendar Sync | Done | Added feature-flagged OAuth sync foundations for Google/Outlook: connect/disconnect endpoints, insert/update/cancel propagation on registration and event lifecycle changes, mapping persistence, and failure tracking with member-visible in-app alerts. |
| 4.1 Enhancements Wave | Done | Delivered member SMS opt-in controls with limits/quiet-hours safety, admin reporting/export dashboard, publish-gated event minutes/agenda access policy for invited+attended members, organisation-wide celebration thread with moderator delete controls, and clear member/admin navigation for these features. |
| 4.6 Unified Sign-In and Member Profile Foundation | In Progress | Documented the 2026-04-27 member-controlled profile wave across requirements, privacy, RBAC, UX, data-model, and roadmap docs. Unified sign-in was already present in the web/API flow; the active profile slice now includes richer profile fields, directory-detail metadata, linked-media/contact-preference storage, and the supporting member/admin UI foundation. |
| 4.7 Social Links and Profile Visibility Controls | In Progress | Manual professional links and field-level profile visibility are now persisted and editable, the read-only member directory/profile experience now uses those settings to shape privacy-aware output, and newly submitted linked gallery media stays hidden until admin review is approved. Remaining work is concentrated in richer moderation tooling and stricter media-validation refinements. |
| 4.8 Conference Sharing and Memory Foundation | Not Started | Member-only conference reflections and approved storytelling workflow remain to be implemented. |
| 4.9 Public Storytelling Review Workflow | In Progress | Admin review and approval workflow is now in place for member public-profile field requests; broader storytelling and publishing flows remain. |
| 4.10 Honorary Members and Memorial Sections | In Progress | Admin-governed honorary member and memorial records now have storage and initial admin-console management; public presentation surfaces remain to be implemented. |
