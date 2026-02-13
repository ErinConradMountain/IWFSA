# ADR-001 Runtime Stack and App Structure

## Title
Runtime stack baseline for checkpoint 0.1 (foundation for 1.1)

## Status
Accepted

## Context
The repository entered implementation with no pinned stack, and package installation is currently constrained in the local build environment. We still need a reproducible baseline that supports:
- modular monolith boundaries (web + API surfaces),
- migration-controlled schema evolution,
- CI quality gates,
- low operational complexity for MVP.

## Decision
- Runtime: Node.js 22+ with ESM modules.
- Architecture shape: modular monolith with two app surfaces in one repository:
  - `apps/web` (public/member/admin UI shell),
  - `apps/api` (internal API + data access).
- Data layer baseline: SQLite via Node's built-in `node:sqlite` module.
- HTTP layer baseline: built-in `node:http`.
- Testing baseline: Node built-in `node:test`.
- Build artifact strategy: copy source + public assets + migrations into `dist/`.

## Consequences
- Immediate benefit: no external package dependency is required to bootstrap checkpoint 1.1 locally.
- Immediate tradeoff: this is intentionally minimal and will likely be replaced by framework-level tooling (for example typed contracts, richer routing, ORMs) once dependency constraints are removed.
- Follow-up:
  - preserve API/module boundaries so framework adoption stays incremental,
  - keep schema history in SQL migrations to avoid lock-in,
  - revisit stack ADR once auth/RBAC implementation begins (checkpoint 1.2).

## Restart-Run Revalidation (2026-02-08)
- Revalidated against current repository structure:
  - `apps/web` and `apps/api` remain the active modular monolith boundaries.
  - Node 22+ baseline remains enforced in `package.json`.
  - Runtime/test/build scripts still align to this stack decision.
- Decision remains accepted for the restart-run checkpoint sequence.
