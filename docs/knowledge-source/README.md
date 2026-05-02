# Knowledge Source

This folder is the external-facing knowledge source for the IWFSA project.

Its purpose is to keep another agent, reviewer, or stakeholder informed about what this project is, what has changed, what is active now, and what should be referenced before new work starts.

Use this folder as the first orientation point when handing work to an external party.

## Files In This Folder

- `project-representation.md`: stable summary of what the project is, how it is shaped, and what principles govern it.
- `current-state.md`: live snapshot of the current delivery state, active initiatives, recent documentation decisions, and next expected work.
- `change-log.md`: append-only change summary for notable project, documentation, workflow, and implementation updates.

## Update Rules

Update this folder whenever a change does any of the following:
- changes product behavior,
- changes delivery sequence or roadmap meaning,
- adds a new canonical plan,
- changes governance or privacy rules,
- changes instructions for future agents,
- changes architecture, integrations, or project structure,
- closes or materially advances a major implementation step.

## Minimum Update Expectation

For every material change:
1. Update `change-log.md` with the date, summary, affected areas, and reference docs.
2. Update `current-state.md` if the active work, current baseline, or next steps changed.
3. Update `project-representation.md` only when the durable understanding of the project has changed.

## Writing Standard

- Write for an external reader with no prior session context.
- Prefer short factual summaries over long narrative notes.
- Reference canonical docs when detail belongs elsewhere.
- Keep this folder aligned with `AGENT.md`, `.github/copilot-instructions.md`, and the main docs in `docs/`.