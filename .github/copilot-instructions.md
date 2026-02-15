# IWFSA Custom Instructions

These instructions keep assistant outputs aligned with the active delivery plan.

## 1) Planning Source of Truth
- Primary execution source: `docs/build-playbook.md`.
- Planning sequence source: `docs/roadmap.md`.
- Working agreement source: `AGENT.md`.
- Requirement source: `docs/product-requirements.md`.

If any of these disagree, update them together in the same change.

## 2) Active Sequence (Restart Run, 2026-02-08)
- Start from checkpoint `0.1` and move forward sequentially.
- Revalidate carried-forward implemented work at each checkpoint.
- Execute unfinished prior-cycle scope when reached (especially `2.2+`).

Keep exactly one checkpoint marked `In Progress` in the playbook tracker table.

## 3) Scope and Governance Guardrails
- Do not broaden scope outside the active checkpoint.
- Do not bypass RBAC, consent, privacy, or audit controls.
- Keep optional integrations/automation behind feature flags.
- Classify requirement suggestions before implementation:
  - `Enhancement (non-breaking)`: verify scope/flags, consent/RBAC expectations, compatibility, and reliability are preserved.
  - `Breaking change`: log it in `docs/change-alignment-log.md` with impact/mitigation and require explicit alignment decision before merge.

## 4) Documentation Hygiene
When changing requirements or execution order, update:
- `docs/build-playbook.md`
- `docs/roadmap.md`
- `AGENT.md`
- `README.md` and `CONTRIBUTING.md` when contributor workflow changes
- Any feature-specific docs touched by the change (for example notifications/import docs)

### User Dictionary writing standard
- All entries in `docs/User-dictionary.md` must be written for a 7th-grade reading level (ages 12–13).
- Use short sentences, everyday words, and real-world analogies.
- Avoid jargon; if a technical term is needed, explain it in plain language immediately.
- When adding or editing dictionary entries, follow the format and tone of existing entries.

## 5) Carry-Forward Focus Rules
### Membership data consistency
- Treat batch `membership_set_json` as canonical for import/member-set behavior.
- Avoid introducing duplicate membership staging pathways.
- Use one sanitized canonical fixture under `docs/imports/`.

### Navigation UX
- Preserve top-level surfaces (`/`, `/member`, `/admin`).
- Use module-level navigation and deep links (`#events`, `#imports`, etc.).
- Avoid monolithic scroll-heavy admin/member pages for core tasks.

### Notifications UX
- Delivery report should be member-centric and operational.
- Queue status should be a plain-language health summary.
- Keep technical diagnostics in logs/audit, not default admin display.

## 6) Security Basics
- Never expose real credentials in public/admin UI copy.
- Never store or log plaintext passwords/tokens.
- Treat member spreadsheets as sensitive data.
