# Roadmap (Restart Run: Begin From Checkpoint 0.1)

This roadmap is executed with `docs/build-playbook.md`.

## Build Execution Model
- Restart execution from the beginning of the approved plan.
- Run checkpoints strictly in sequence from `0.1` onward.
- Carry forward prior implemented work as baseline evidence, then validate and complete gaps.
- Keep unfinished items from the previous cycle integrated in the same checkpoint order.
- Keep exactly one checkpoint marked `In Progress` in the playbook tracker.

## Current Restart Baseline (2026-02-10)
- Active checkpoint is now `1.4` after closing `1.3`.
- Checkpoint `1.3` was closed with member provisioning hardening: import validation, onboarding invites, credential resets, activation gating, and admin batch outcome visibility.
- Overlapping meeting times are warning-based (not blocking): creators receive in-app clash notifications during meeting creation.
- Invitees confirm participation via email RSVP links or in-app registration, and organisers can manage planning updates from Event Hub.
- Prior cycle outputs are retained and revalidated during this restart run.
- Previously unfinished work (`2.2+`) is explicitly carried forward and remains in scope.

## Phase 0 - Blueprint and Decision Lock (Done)
Goal:
- Reconfirm architecture, security, and scope decisions as the restart foundation.

Checkpoints:
1. `0.1` Stack and hosting ADRs.
2. `0.2` Security and privacy baseline.
3. `0.3` MVP scope lock and feature flags.

Exit criteria:
- Decisions remain aligned with current implementation and no unresolved drift exists.

## Phase 1 - MVP Core Delivery (Active)
Goal:
- Revalidate and harden core MVP flows end-to-end.

Checkpoints:
1. `1.1` Scaffold, CI, environment validation, migrations.
2. `1.2` Auth, RBAC, and audit foundation.
3. `1.3` Member provisioning and onboarding flows.
4. `1.4` Event lifecycle and member visibility controls.
5. `1.5` Registration, capacity, and waitlist reliability.
6. `1.6` Notifications and audit/revision reliability.
7. `1.7` Calendar actions and Teams fallback.
8. `1.8` Birthdays sidebar (consent-gated).
9. `1.9` Admin console UX/Event Hub baseline.

Exit criteria:
- Core flows are validated and any identified gaps are closed.

## Phase 2 - Consistency and UX Hardening (Queued; Carry-Forward)
Goal:
- Execute integrated unfinished items from the prior cycle in approved order.

Checkpoints:
1. `2.1` Planning and knowledge-base reset.
2. `2.2` Membership data consistency hardening.
3. `2.3` Navigation and UX v2 across Public/Member/Admin.
4. `2.4` Notifications UX simplification (Delivery Report + Queue Status).
5. `2.5` Regression and release readiness gates.

Exit criteria:
- Data consistency, modular navigation, and notifications operations are all production-ready.

## Phase 3 - Integrations and Automation (Queued)
Goal:
- Add integrations while preserving governance, reliability, and fallback behavior.

Checkpoints:
1. `3.1` SharePoint document flow with app-mediated authorization.
2. `3.2` Teams Graph automation (feature-flagged).
3. `3.3` Optional OAuth calendar sync.

Exit criteria:
- Integration controls and operational safety checks are validated.

## Phase 4 - Enhancements (Backlog)
Goal:
- Extend value only after core and integration checkpoints are stable.

Checkpoints:
1. `4.1` Web push / SMS opt-in.
2. `4.2` Reporting and exports.
3. `4.3` Operational intelligence dashboards.
4. `4.4` Optional social celebration workflow.

Exit criteria:
- Enhancements do not regress MVP reliability, security, or governance controls.
