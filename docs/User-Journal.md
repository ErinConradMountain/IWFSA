Latest update (2026-03-08): Orientation summary up to calendar/SharePoint integration checkpoints, with current branch status for remote repo.

Repository status and branches
- Active branch in local and remote: feature/member-admin-portal-refresh (also tracking main on origin IWFSA).
- Remote branches present: main and feature/member-admin-portal-refresh under the IWFSA remote.
- Both branches currently point at the same HEAD commit, so the feature work on the member/admin portal refresh has been merged or fast‑forwarded into main.

High-level checkpoint progress
- Checkpoint 1.x: Membership data, imports, and notifications foundations were implemented and hardened, including queue-based fan-out, idempotent delivery handling, and an append-only audit trail aligned with RBAC and consent rules.
- Checkpoint 1.6 (Notifications and Audit Trail) is complete and validated with 65 passing tests and zero failures, and remains the stable foundation for later changes.
- Checkpoints 3.2 and 3.3 are now implemented in the API: Teams Graph automation for event collaboration and calendar OAuth sync for calendar integration.
- Documentation updates mark checkpoints 3.2 and 3.3 as complete and describe the Teams and calendar configuration required in Microsoft 365.

Recent API and docs work (from git log)
- Implemented Teams Graph automation (checkpoint 3.2) to support Microsoft Teams-enabled events via the API, with docs capturing Teams configuration and constraints (no anonymous join, app-only options, etc.).
- Implemented calendar OAuth sync (checkpoint 3.3) to connect events to calendar systems and store join URLs and related metadata safely.
- Updated the SharePoint / Microsoft 365 integration docs to cover phased rollout, tenant prerequisites, and least-privilege Graph permissions for SharePoint document storage.
- Refined member and admin portal templates to reflect the new event collaboration and document flows, while preserving top-level navigation (/ , /member, /admin) and feature-flagged rollout for optional integrations.

Microsoft 365 / Entra integration state
- SharePoint integration is documented around a dedicated “IWFSA Events” site and “Event Documents” library, using Sites.Selected for constrained app-only access.
- A beginner-friendly rollout checklist is in place for admins: prepare tenant prerequisites, connect environment variables, run smoke tests for upload/list/download, and verify role-based access (eligible vs ineligible members) before any production pilot.
- Calendar and Teams automation for events are structured as opt-in features behind appropriate flags and configuration, respecting RBAC and privacy guardrails (no plaintext secrets, no logging of join URLs or tokenized links).

Working agreement and guardrails (still in force)
- GitHub remains the single source of truth for code, PRs, and change history; Microsoft 365 is strictly an integration surface for identity, files, and meetings.
- Membership batch JSON remains the canonical representation for imports/member-set behavior; no duplicate staging pathways have been introduced.
- Navigation surfaces are preserved: core routes stay simple, with deeper admin/member tasks exposed via structured sections rather than monolithic pages.
- Notifications UX keeps delivery reports member-centric and operational, with technical diagnostics staying in logs/audit trails.

How to resume work from here
- Treat notifications/audit (1.6) and Teams/calendar integration (3.2–3.3) as stable baselines for further checkpoints.
- When picking up the next task, start on the feature/member-admin-portal-refresh branch (which is aligned with main) and keep exactly one checkpoint marked In Progress in docs/build-playbook.md.
- For any changes to requirements or rollout order, update docs/build-playbook.md, docs/roadmap.md, AGENT.md, and any affected feature docs so the next session has a single, consistent source of truth.