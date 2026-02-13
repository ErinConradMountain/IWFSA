# ADR-002 Hosting, Environment Strategy, and Secret Handling

## Title
Initial hosting and environment strategy for MVP build start

## Status
Accepted

## Context
Phase 0.1 requires explicit decisions for hosting model, environment progression, and secret management before significant implementation. The solution must stay simple for MVP and enforce secure handling of credentials and tokens.

## Decision
- Hosting model (MVP baseline):
  - deploy API and web services together on a single host boundary (single VM or container group) behind TLS termination.
  - keep app processes logically separated (`apps/api`, `apps/web`) even when co-hosted.
- Environments:
  - `dev`: local workstation using `.env` (never committed).
  - `staging`: production-like config, isolated data, used for release validation.
  - `prod`: hardened runtime with least-privilege credentials.
- Secret management:
  - do not store secrets in repository.
  - use environment variable injection from a platform secret store in staging/prod.
  - keep a committed `.env.example` for required keys and non-secret defaults only.

## Consequences
- Benefit: deployment path stays operationally simple while preserving clear upgrade routes.
- Tradeoff: co-hosted services have tighter failure coupling than fully separated services.
- Follow-up:
  - add platform-specific runbooks once infrastructure provider is finalized,
  - introduce environment-specific health checks and release promotion rules in CI/CD,
  - reassess when queue workers and external integrations move into active scope.

## Restart-Run Revalidation (2026-02-08)
- Revalidated environment and secret-handling alignment:
  - `.env.example` exists and contains non-secret runtime keys only.
  - CI workflow keeps a reproducible Node 22 quality gate path.
  - Repository policy and docs remain aligned on "no secrets in git".
- Decision remains accepted for restart-run execution.
