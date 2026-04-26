---
applyTo: "docs/**/*.md"
---

# Documentation Files

## Source of Truth Priority

When documents disagree, resolution order is:
1. `docs/build-playbook.md` — execution details and checkpoint status table
2. `docs/roadmap.md` — phase and checkpoint sequencing
3. `docs/product-requirements.md` — functional and non-functional requirements
4. `AGENT.md` — build working agreement

If you update one, update all affected documents in the same change.

## Document Categories

### Planning and Governance
- `docs/build-playbook.md` — step-by-step delivery guide with checkpoint status table
- `docs/roadmap.md` — phase-based checkpoint sequence
- `docs/product-requirements.md` — full PRD (functional + non-functional)
- `docs/change-alignment-log.md` — breaking change decisions

### Architecture and Data
- `docs/architecture.md` — high-level system design
- `docs/data-model.md` — entity relationship draft (implementation-agnostic)
- `docs/web-deployment-model.md` — hosting topology and deployment guidance
- `docs/rbac-permissions.md` — role-based permission matrix

### Operations
- `docs/admin-runbook.md` — admin operational procedures
- `docs/notifications.md` — notification system design
- `docs/member-import.md` and `docs/member-import-service-contract.md` — import pipeline spec
- `docs/privacy-baseline.md` — POPIA-aligned data handling

### Integrations
- `docs/integrations/calendars.md` — calendar sync options
- `docs/integrations/microsoft-teams.md` — Teams Graph automation
- `docs/integrations/sharepoint.md` — document storage integration
- `docs/integrations/m365-setup-checklist.md` — tenant setup prerequisites
- `docs/integrations/social-media.md` — social celebration workflow

### Reference
- `docs/User-dictionary.md` — plain-language glossary (7th-grade reading level required)
- `docs/User-Journal.md` — user experience observations
- `docs/ux-notes.md` — UX design notes
- `docs/adr-template.md` — template for architecture decision records
- `docs/adrs/` — filed ADRs

## Writing Standards

- Use Markdown with clear heading hierarchy.
- `docs/User-dictionary.md` entries must use 7th-grade reading level: short sentences, plain language, real-world analogies. No jargon without immediate plain-language explanation.
- ADRs follow the template in `docs/adr-template.md`.
- Keep `docs/imports/` fixtures sanitized — no real PII.

## Change Alignment Gate

Before modifying requirement or scope documents, classify the change:
- **Enhancement (non-breaking):** verify MVP scope, feature flags, RBAC, consent, API compatibility, and reliability are preserved.
- **Breaking change:** log in `docs/change-alignment-log.md` with impact and mitigation before merging.
