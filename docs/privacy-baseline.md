# Security and Privacy Baseline (Checkpoint 0.2)

This document is the operational POPIA-aligned baseline for:
- personal data inventory,
- consent requirements,
- retention expectations.

Status: Accepted baseline for restart-run checkpoint `0.2` (2026-02-08).

## 1) Personal Data Inventory

| Data Domain | Typical Fields | Why We Process It | Primary Surface |
| --- | --- | --- | --- |
| Account identity | username, email, password hash, status | authenticate members/admins and enforce access policy | API auth, admin |
| Member profile | full name, organisation, phone, photo URL, birthday month/day, birthday visibility | member operations, directory use, consent-gated member services | member portal, admin |
| Roles and groups | role assignments, group memberships, event editor grants | RBAC, audience gating, delegated edit permissions | admin, API authz |
| Event records | title, schedule, venue, host/chair, capacity, audience, status | event lifecycle, member participation, governance continuity | member portal, admin |
| Participation records | signup/waitlist/cancel status, timestamps | capacity management, waitlist promotion, attendance reporting basis | member portal, admin |
| Notification operations | queue status, delivery status, provider IDs, failure summaries | event-change communication and operational follow-up | admin notifications |
| Credential recovery | invite/reset token hashes, expiry/use timestamps, delivery status | secure onboarding and credential recovery | admin + auth flows |
| Import operations | source filename, normalized membership set snapshot, import actions/results | controlled bulk provisioning and auditability | admin import |
| Audit records | actor, action type, target, metadata, timestamp | governance traceability and accountability | admin/audit backend |
| Optional social workflow | consent flags, birthday post drafts/snapshots, publish attempts | approval-gated public communication where consent allows | admin social (optional) |

Data minimization rule:
- capture only what is needed for approved operational purpose and governance obligations.

## 2) Consent Requirements

| Use Case | Consent Requirement | Notes |
| --- | --- | --- |
| Member birthday visibility in portal | explicit opt-in (`membersOnly` or equivalent) | hide entirely when not opted in |
| Public birthday social posts (IWFSA members) | explicit social consent (`membersAndSocial` equivalent) | per-post do-not-post override required |
| IWF Global birthday posts (optional) | explicit individual consent | separate directory; do not infer from IWFSA member consent |
| Sister-organisation celebration posts (optional) | permission/usage confirmation for name/logo/tagging | keep permission evidence where required |
| Operational event notifications (registrants) | operational/transactional basis | not treated as marketing broadcast |
| Marketing/non-operational campaigns (optional) | explicit opt-in | keep channel-specific preference evidence |

Consent enforcement rules:
- no social publication path without explicit consent check at publish time,
- consent revocation must block future publication,
- consent-sensitive decisions must be audit logged.

## 3) Retention Baseline

These are baseline defaults for implementation and operations until superseded by formal policy/legal directive.

| Record Type | Baseline Retention | Rationale |
| --- | --- | --- |
| `audit_logs`, event revisions | 7 years | governance continuity and accountability |
| Notification queue/delivery operations | 24 months | operational support, incident traceability |
| Member import batch metadata and membership-set snapshots | 24 months | onboarding supportability and auditability |
| Raw uploaded import files | delete within 30 days after successful processing (unless incident/legal hold) | minimize retained raw personal data |
| Invite/reset request records (hashed token metadata) | 90 days after used/expired/revoked | security operations and fraud review |
| Authentication/operational logs | 12 months | security monitoring and abuse investigation |
| Optional social publish history | 24 months after publish/cancel | communications accountability |
| Consent evidence fields | while active + 24 months after revocation/deactivation | demonstrate consent governance decisions |

Retention controls:
- legal hold overrides scheduled deletion,
- deletion/archival jobs must be idempotent and audited,
- retention windows should be reviewed with governance/legal stakeholders periodically.

## 4) Implementation Alignment Requirements
- `docs/product-requirements.md` must stay aligned with this baseline for consent and privacy language.
- `docs/architecture.md` must reflect the same privacy-by-design and retention assumptions.
- `docs/notifications.md` and `docs/admin-runbook.md` must reflect operational vs marketing communication handling.
- Security principles in `SECURITY.md` must remain consistent with this baseline.
