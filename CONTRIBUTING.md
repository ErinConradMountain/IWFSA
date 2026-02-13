# Contributing

## Workflow
- Use small, reviewable pull requests.
- Keep changes focused on a single feature or fix.
- Link each PR to a phase/checkpoint from `docs/build-playbook.md`.

## Build-Phase Discipline
- Confirm checkpoint entry criteria before starting work.
- Include evidence for checkpoint exit criteria in the PR description.
- If blocked, document the blocker and continue with approved fallback scope.
- Do not expand scope into optional features unless the checkpoint explicitly includes them.
- If a proposal may break approved behavior/scope, document it in `docs/change-alignment-log.md` before implementation.
- Keep exactly one checkpoint marked `In Progress` in `docs/build-playbook.md`.

## Change Alignment Gate
For requirement or scope suggestions, classify before implementation:
- `Enhancement (non-breaking)`:
  - Confirm MVP scope and feature-flag boundaries remain intact.
  - Confirm role/permission and consent expectations are unchanged.
  - Confirm existing API/workflow behavior remains compatible (or versioned).
  - Confirm operational reliability expectations are preserved.
- `Breaking change`:
  - Open/update `docs/change-alignment-log.md` with impact, affected docs, and mitigation.
  - Do not merge until explicit alignment decision is documented.

## Documentation First
- Update docs when requirements change.
- Add an ADR when a major choice is made (stack, auth, hosting, queue, integration policy).
- Keep `AGENT.md`, `docs/roadmap.md`, `docs/build-playbook.md`, and `.github/copilot-instructions.md` aligned.

## Security
- Do not commit secrets.
- Use `.env.example` once the stack is chosen.
- Treat join URLs and tokenized calendar links as sensitive.

## Quality
- Add tests for permission checks, capacity/waitlist, and notifications.
- Keep mobile and desktop UX responsive.
- Prefer deterministic tests for direct publish lifecycle, notification idempotency, and waitlist promotion.
