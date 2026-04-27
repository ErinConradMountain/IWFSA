# Project Representation

This document represents the IWFSA project for external agents, reviewers, and handover workflows.

## Project Identity

IWFSA is a governance-aware web platform for the International Women's Forum South Africa.

It provides three controlled surfaces:
- Public surface for mission, contact, and approved storytelling.
- Member portal for authenticated member participation and services.
- Admin console for governance, imports, communications, and audit-controlled operations.

## Technical Shape

- Architecture: modular monolith.
- Runtime: Node.js 22+.
- Language: JavaScript ESM using `.mjs`.
- HTTP stack: built directly on `node:http`.
- Database: SQLite via `node:sqlite`.
- Deployment model: standalone web application, with Vercel entry support and optional Microsoft 365 integrations.
- Frontend model: server-rendered templates, no SPA framework.

## Core Governance Principles

- Privacy and RBAC are first-order requirements, not secondary polish.
- Public pages must never leak internal member activity.
- Optional integrations must remain feature-flagged where required.
- Sensitive actions require auditability.
- The platform should preserve institutional memory without weakening consent or governance controls.

## Source Of Truth Order

When documents disagree, use this order first:
1. `docs/build-playbook.md`
2. `docs/roadmap.md`
3. `docs/product-requirements.md`
4. `AGENT.md`
5. `.github/copilot-instructions.md`
6. `docs/knowledge-source/current-state.md`

## Current Strategic Feature Themes

The current documented direction includes:
- core governance-aware public, member, and admin flows,
- optional Microsoft 365 integrations,
- annual membership fees and good-standing governance,
- member-controlled profiles and dignified public storytelling planning,
- admin-managed honorary and memorial experiences,
- privacy-aware sharing and conference memory foundations.

## How To Use This Representation

An external party should read these in order:
1. `docs/knowledge-source/project-representation.md`
2. `docs/knowledge-source/current-state.md`
3. `docs/knowledge-source/change-log.md`
4. the canonical feature plan or requirement doc linked from those summaries

This document stays stable unless the durable project identity or operating model changes.