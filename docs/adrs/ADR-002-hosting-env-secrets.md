# ADR-002 Hosting, Environment Strategy, and Secret Handling

## Title
Initial web hosting and environment strategy for MVP build start

## Status
Accepted

## Context
The IWFSA product is delivered as a standalone web application. We need a hosting model that keeps MVP delivery simple while preserving clean paths for future scaling and secure integration work.

## Decision
- Hosting model:
  - deploy the application as a normal web platform, not as a SharePoint-hosted surface
  - co-host web and API behind one TLS boundary for MVP simplicity
  - keep `apps/web` and `apps/api` logically separate even when deployed together
- Environments:
  - `dev`: local workstation using `.env` that is never committed
  - `staging`: production-like validation environment with isolated data
  - `prod`: hardened runtime with least-privilege credentials
- Secret handling:
  - never store secrets in the repository
  - inject secrets from a platform secret store or deployment environment
  - keep `.env.example` limited to non-secret defaults and required key names
- Integrations:
  - treat SharePoint, Teams, and similar provider features as optional back-end integrations
  - do not make external platforms prerequisites for basic web hosting

## Consequences
- Benefit: the product can ship and operate as a normal website without waiting on Microsoft 365 setup
- Benefit: optional integrations can be enabled progressively behind feature flags
- Tradeoff: co-hosted services have tighter operational coupling than fully separated services
- Follow-up:
  - document platform-specific deployment runbooks once the infrastructure provider is finalized
  - add health checks and release promotion rules per environment
  - reassess the topology when dedicated workers and external integrations become critical-path services

## Revalidation
- `.env.example` remains aligned with a standalone web deployment model
- repository policy remains "no secrets in git"
- decision still fits the current architecture and build flow
