# IWFSA Copilot Instructions

Use these instructions first. Only explore the codebase if the docs here are incomplete or out of date.

## How To Work In This Repo

1. Start with the source of truth in this order: `docs/build-playbook.md`, `docs/roadmap.md`, `docs/product-requirements.md`, `AGENT.md`.
2. Confirm the current checkpoint and the smallest acceptable scope before editing.
3. Read the nearest implementation and the nearest test before changing behavior.
4. Make the smallest complete slice that can be validated locally.
5. Update the related docs when the change affects behavior, sequencing, security, or workflow.
6. Keep `docs/knowledge-source/` current so an external agent can understand the project, its current state, and notable changes without reconstructing session history.

If those documents disagree, fix them together in the same change.

## Project Shape

IWFSA is a governance-aware web platform for the International Women's Forum South Africa.

- Public surface: mission, brand, contact, and external storytelling.
- Member surface: authenticated event participation and member services.
- Admin surface: restricted operations for governance, imports, notifications, and audit.

The codebase is a modular monolith with two Node.js services backed by SQLite.

- Runtime: Node.js 22+
- Language: JavaScript only, ESM `.mjs`
- Server stack: `node:http`, `node:test`, `node:sqlite`
- No frameworks: no Express, no React, no TypeScript
- Local dev on Windows uses PowerShell scripts

## Repository Conventions

- Keep route and business logic in the existing Node service modules instead of introducing new frameworks.
- Treat `apps/api/src/server.mjs` and `apps/web/src/server.mjs` as the main control points for behavior.
- Keep migrations sequential and additive in `apps/api/migrations/`.
- Preserve the RBAC model: `chief_admin`, `admin`, `event_editor`, `member`.
- Keep feature flags for optional integrations such as SharePoint, Teams Graph, and calendar sync.
- Treat member data, tokens, and import files as sensitive information.

## Change Discipline

- Prefer the narrowest possible edit that fixes the actual behavior.
- If a change could affect scope, security, permissions, or deployment order, classify it before implementing it.
- Log breaking changes in `docs/change-alignment-log.md` and update the linked docs in the same change.
- Do not create parallel implementations for the same workflow or data shape.
- Reuse the canonical fixtures and established import paths instead of introducing duplicates.

## Validation Order

Use this order unless a narrower check is clearly better:

1. `npm run lint`
2. `npm run typecheck`
3. Focused tests for the touched area
4. `npm run test`
5. `npm run build`

When you add a new `.mjs` source file, add it to the relevant lint script in `package.json`.

## Local Development Notes

- `npm run migrate` creates or updates the SQLite database and is safe to rerun.
- `npm run dev:all` starts the API and web servers together after migration.
- `npm run dev:stop` and `npm run dev:clean` are PowerShell-oriented helpers.
- SQLite experimental warnings during migrate or test are expected in Node 22+.
- If `.env.example` is missing, create it with the keys required by `scripts/typecheck.mjs` before running typecheck.

## Security And Privacy

- Never print or hardcode real credentials, tokens, or join links.
- Never store plaintext passwords or raw auth tokens.
- Keep invite, reset, RSVP, and approval links short-lived and single-use where possible.
- Follow data minimization and consent-aware handling for personal information.
- Keep low-level diagnostics in backend logs or audit tables, not in default UI surfaces.

## Documentation Hygiene

When a change affects behavior, update the matching documentation at the same time.

- `docs/build-playbook.md`
- `docs/roadmap.md`
- `docs/product-requirements.md`
- `AGENT.md`
- `README.md`
- `CONTRIBUTING.md` when contributor workflow changes
- `docs/knowledge-source/change-log.md` for material changes
- `docs/knowledge-source/current-state.md` when baseline or next-step direction changes

Use `docs/knowledge-source/project-representation.md` as the stable project brief for external orientation and handover.

Keep user-facing glossary content in `docs/User-dictionary.md` short, plain, and readable at about a 7th-grade level.

## UX Guardrails

- Preserve the top-level surfaces: `/`, `/member`, and `/admin`.
- Favor module-level deep links and clear navigation over long scroll-heavy pages.
- Keep admin reporting member-centric and operational rather than overly technical.
- Public pages must not leak internal member activity.

## When Unsure

- Read a nearby implementation and a nearby test before guessing.
- Prefer existing patterns over new abstractions.
- Ask for clarification only when the repo docs and nearby code still do not resolve the decision.
