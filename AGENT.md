# AGENT.md - Build Working Agreement for IWFSA

This file defines how delivery decisions are made and how checkpoint work is executed.

## 1) Source of Truth Order
Use documents in this order when there is ambiguity:
1. `docs/build-playbook.md` (execution details and status table)
2. `docs/roadmap.md` (phase and checkpoint sequencing)
3. `docs/product-requirements.md` (functional/non-functional requirements)
4. `.github/copilot-instructions.md` (custom assistant behavior for this repo)

If two documents disagree, update them in the same change before implementation continues.

## 2) Current Active Plan (2026-02-08)
Execution restarts from the beginning of the plan:
1. Start at `0.1` and proceed sequentially through all checkpoints.
2. Revalidate existing implemented work at each checkpoint.
3. Complete missing scope before moving forward.
4. Execute carry-forward unfinished work from the previous cycle at checkpoints `2.2+`.

Rule:
- Keep exactly one checkpoint marked `In Progress` in `docs/build-playbook.md`.

## 3) Build Guidance Commitment
For every checkpoint, delivery must include:
- Objective and prerequisite confirmation
- Concrete implementation tasks (files, APIs, tests, config)
- Validation steps and expected outcomes
- Exit criteria
- Handover note (done, blocked, next)

Progress rules:
- Finish the current checkpoint before starting the next.
- Keep optional features behind feature flags.
- Record major architecture decisions with ADRs.

## 4) Product Boundaries
- Public surface: mission/brand/CTA only, no internal events or private member activity.
- Member portal: authenticated event participation and member services.
- Admin console: restricted operations for governance, provisioning, and audit.

## 5) Roles and Access (RBAC)
Minimum roles:
- `ChiefAdmin`: governance authority with full admin rights.
- `Admin`: full member/event operations and permission administration.
- `EventEditor`: event-scoped edit/publish rights for assigned events.
- `Member`: internal event participation, own event draft/publish rights, and creator-scoped editor assignment.

Non-negotiables:
- Event publishing does not require moderation; authorized collaborators can publish directly from draft.
- Permission grants/revokes are audit logged.
- Non-members cannot access internal event data.

## 6) Carry-Forward Guardrails
### 6.1 Membership consistency
- `membership_set_json` on import batches is canonical for membership-set behavior.
- Legacy row tables are support-only and must not become a second source of truth.
- Dev/test/demo uses one canonical sanitized member fixture in `docs/imports/`.

### 6.2 Navigation and UX
- Top-level navigation remains `Public`, `Member Portal`, `Admin Console`.
- Member/Admin surfaces must support module-level navigation and deep-link anchors.
- Public page CTAs must land users in the correct module quickly.

### 6.3 Notifications UX
- Queue status is a health summary card, not a technical job dump.
- Delivery report is member-centric (identity/contact + status).
- Low-level diagnostics remain in backend audit/log tables, not default admin UI.

## 7) Security and Privacy
- Least privilege for internal access and integrations.
- Treat join links, approval links, and reset/invite tokens as sensitive.
- POPIA-aligned handling:
  - data minimization
  - explicit consent for non-essential/public processing
  - retention-aware auditability

Credential handling:
- Never store plaintext passwords or raw auth tokens.
- Invite/reset links are short-lived and single-use where possible.

## 8) Definition of Done (Feature/Checkpoint)
Work is not done until:
- RBAC and privacy behavior is correct and tested.
- Audit coverage exists for sensitive actions.
- Negative paths are handled cleanly.
- Admin/member UX is usable on desktop and mobile.
- Documentation is updated and aligned across source-of-truth files.

## 9) Session Protocol
At session start:
1. Confirm active checkpoint from `docs/build-playbook.md`.
2. Restate non-goals and scope boundaries.
3. Implement the smallest complete, testable slice.

At session end:
1. Record completed work.
2. Record validation results.
3. Record blockers/risks.
4. Set next step tied to checkpoint exit criteria.

If blocked by external dependencies (for example M365 tenant approvals), continue with approved fallback paths.

## 10) Change Alignment Gate
When a new suggestion could break approved scope, behavior, security posture, or sequence:
1. Classify it as `Enhancement (non-breaking)` or `Breaking change`.
2. For non-breaking:
   - confirm MVP scope/feature-flag boundaries remain intact,
   - confirm role/permission and consent expectations are unchanged,
   - confirm API/workflow compatibility (or explicit versioning),
   - confirm reliability expectations remain intact.
3. For breaking:
   - log it in `docs/change-alignment-log.md`,
   - document impact, affected docs, and mitigation,
   - do not merge until explicit alignment decision is recorded.
