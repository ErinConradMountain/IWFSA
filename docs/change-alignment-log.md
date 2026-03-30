# Change Alignment Log

This log records potential plan-breaking suggestions and how they were aligned.

Use this when a new proposal might alter approved scope, behavior, or delivery order.

## Status values
- `Open`: potential break identified, decision pending.
- `Resolved`: aligned to original plan and accepted.
- `Rejected`: proposal declined due to unacceptable break risk.

## Entry template
Use this structure for each new proposal:
- `CAL-XXX - <short title>`
- Date
- Status (`Open`, `Resolved`, `Rejected`)
- Classification (`Enhancement (non-breaking)` or `Breaking change`)
- Potential break
- Non-breaking checklist result (for enhancements):
  - MVP scope + feature flags preserved
  - role/permission + consent expectations preserved
  - API/workflow compatibility preserved (or versioned)
  - reliability expectations preserved (idempotency, auditability, admin reporting)
- Impacted docs
- Alignment decision
- Mitigation applied

## Entries

### CAL-001 - Activation policy consistency for onboarding
- Date: 2026-02-07
- Status: Resolved
- Potential break:
  - New docs introduced mandatory username change at first login.
  - Original PRD behavior allowed username change as optional.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/member-import.md`
  - `docs/notifications.md`
  - `docs/member-import-service-contract.md`
- Alignment decision:
  - Keep password change mandatory.
  - Make username personalization policy-driven (optional by default, recommended for generated/default usernames).
- Mitigation applied:
  - Updated all impacted docs to consistent policy wording.
  - Added explicit `activation_policy` field to import service contract.

### CAL-002 - Future analytics vs MVP scope control
- Date: 2026-02-07
- Status: Resolved
- Potential break:
  - Operational intelligence proposals could be interpreted as MVP deliverables.
- Impacted docs:
  - `docs/product-requirements.md`
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `docs/architecture.md`
- Alignment decision:
  - Keep operational intelligence as designed-for future layer, not MVP.
- Mitigation applied:
  - Explicitly placed dashboards/insights in Phase 3 and marked as post-MVP.

### CAL-003 - Planning renumbering and session reset alignment
- Date: 2026-02-08
- Status: Resolved
- Potential break:
  - Playbook contained branch-style checkpoint numbering (`1.1.1`) and roadmap phase naming drift.
  - Status-table-facing docs could diverge from active build execution order.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `docs/change-alignment-log.md`
- Alignment decision:
  - Keep historical completed work under `0.x` and `1.x`.
  - Start the new consistency wave under sequential `2.x` checkpoints.
  - Move integration/enhancement waves to `3.x` and `4.x`.
- Mitigation applied:
  - Renumbered planning checkpoints to a single sequential structure.
  - Set one active in-progress checkpoint (`2.1`) for status-table clarity.
  - Synced roadmap phase/checkpoint IDs to the playbook.

### CAL-004 - Incorporating UX and notification suggestions into the active wave
- Date: 2026-02-08
- Status: Resolved
- Potential break:
  - New suggestions for modular navigation and simplified notification operations were added after the initial reset wave definition.
  - Regression readiness was sequenced before those UX changes, which could have caused execution-order ambiguity.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `AGENT.md`
  - `docs/product-requirements.md`
  - `.github/copilot-instructions.md`
- Alignment decision:
  - Keep the new suggestions inside Phase 2, but enforce one sequential order: `2.1` planning reset, `2.2` membership consistency, `2.3` navigation/UX v2, `2.4` notifications UX simplification, `2.5` regression/readiness.
  - Move the active checkpoint to `2.2` now that `2.1` planning reset is complete.
- Mitigation applied:
  - Reordered and renumbered Phase 2 checkpoints in playbook and roadmap.
  - Updated working agreement and custom instructions to match the same sequence.
  - Updated requirements wording for modular navigation and member-centric notification monitoring.

### CAL-005 - Restart execution from plan beginning with prior-cycle carry-forward
- Date: 2026-02-08
- Status: Resolved
- Potential break:
  - Prior documentation set the active execution start at Phase 2 (`2.2` in progress), which conflicted with a new request to restart from the beginning of the plan.
  - Restarting could lose visibility of unfinished prior-cycle scope if not explicitly integrated.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `AGENT.md`
  - `.github/copilot-instructions.md`
  - `README.md`
- Alignment decision:
  - Restart active execution at `0.1`, then proceed sequentially through all checkpoints.
  - Keep prior implementation as carry-forward baseline evidence at each checkpoint.
  - Keep unfinished prior-cycle work (especially `2.2+`) explicitly integrated in the same order.
- Mitigation applied:
  - Updated status table current checkpoint to `0.1` with one active in-progress row.
  - Reframed roadmap and agent/custom instruction files to the restart-run model.
  - Updated public plan messaging to match restart-run execution state.

### CAL-006 - Checkpoint 0.1 restart-run closure and transition to 0.2
- Date: 2026-02-08
- Status: Resolved
- Potential break:
  - Restart-run sequencing required explicit proof that 0.1 decisions (runtime, hosting, environment strategy, secret handling) were revalidated before advancing.
  - Advancing without evidence could create hidden drift between ADR decisions and active implementation.
- Impacted docs:
  - `docs/adrs/ADR-001-runtime-stack.md`
  - `docs/adrs/ADR-002-hosting-env-secrets.md`
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `README.md`
- Alignment decision:
  - Close checkpoint `0.1` after explicit revalidation notes are recorded in ADRs.
  - Move active checkpoint to `0.2` and preserve single in-progress status-table rule.
- Mitigation applied:
  - Added restart-run revalidation sections in both ADRs.
  - Updated status table and current-checkpoint references from `0.1` to `0.2`.

### CAL-007 - Checkpoint 0.2 privacy-baseline closure and transition to 0.3
- Date: 2026-02-08
- Status: Resolved
- Potential break:
  - Checkpoint `0.2` required explicit baseline decisions for personal data inventory, consent scope, and retention expectations.
  - Existing privacy references were distributed across docs without one canonical baseline artifact.
- Impacted docs:
  - `docs/privacy-baseline.md`
  - `docs/product-requirements.md`
  - `docs/architecture.md`
  - `docs/notifications.md`
  - `docs/admin-runbook.md`
  - `SECURITY.md`
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `README.md`
- Alignment decision:
  - Establish `docs/privacy-baseline.md` as the checkpoint `0.2` baseline reference for inventory, consent, and retention.
  - Keep one in-progress checkpoint by closing `0.2` and moving active execution to `0.3`.
- Mitigation applied:
  - Added and linked canonical privacy baseline documentation.
  - Updated checkpoint statuses and active checkpoint references to `0.3`.

### CAL-008 - Checkpoint 0.3 change-alignment gate operationalization and transition to 1.1
- Date: 2026-02-08
- Status: Resolved
- Classification: Enhancement (non-breaking)
- Potential break:
  - Checkpoint `0.3` required scope-lock and feature-flag controls to be operational, not just stated.
  - Gate behavior was defined in the playbook but not fully codified across contributor and assistant instructions.
- Non-breaking checklist result:
  - MVP scope + feature flags preserved: Yes.
  - Role/permission + consent expectations preserved: Yes.
  - API/workflow compatibility preserved: Yes (documentation/process change only).
  - Reliability expectations preserved: Yes.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `CONTRIBUTING.md`
  - `AGENT.md`
  - `.github/copilot-instructions.md`
  - `README.md`
  - `docs/change-alignment-log.md`
- Alignment decision:
  - Keep the approved MVP scope lock and out-of-scope boundaries.
  - Formalize gate execution workflow and classification checklist across project instructions.
  - Close checkpoint `0.3` and advance restart-run execution to checkpoint `1.1`.
- Mitigation applied:
  - Added explicit gate workflow and feature-flag register in the playbook.
  - Added classification rules to contributor/agent/custom instruction docs.
  - Updated active checkpoint references to `1.1`.

### CAL-009 - Event lifecycle moderation removal and member-led publishing
- Date: 2026-02-10
- Status: Resolved
- Classification: Breaking change
- Potential break:
  - Existing approved event workflow required `draft -> submit for approval -> ChiefAdmin publish`.
  - New direction removes moderation as a publish dependency and allows members to publish directly.
  - Event-editor assignment authority expands from admin-only to include event creators for their own events.
- Impacted docs:
  - `docs/build-playbook.md`
  - `docs/roadmap.md`
  - `AGENT.md`
  - `README.md`
  - `docs/product-requirements.md`
  - `docs/rbac-permissions.md`
  - `CONTRIBUTING.md`
- Alignment decision:
  - Accept the breaking change for checkpoint `1.4`.
  - Members/event collaborators can publish events directly without ChiefAdmin moderation.
  - Event creators retain ownership, can edit their own meetings, and can assign event-scoped editors on their own events.
  - Published-event discovery and signup remains member-facing via the authenticated portal event directory.
- Mitigation applied:
  - Updated lifecycle/RBAC docs to remove mandatory moderation for event publish.
  - Updated API authorization and lifecycle behavior to support direct publish and creator-managed grants.
  - Updated automated tests to assert new publish/permissions behavior and unauthorized cases.
