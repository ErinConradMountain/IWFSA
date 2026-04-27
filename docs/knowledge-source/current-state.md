# Current State

This document summarizes the current known state of the IWFSA project for external agents and handover use.

## Current Baseline

- The repository hosts the standalone IWFSA web platform.
- The application remains a modular monolith with separate API and web services.
- Public, member, and admin surfaces are established and remain the top-level UX structure.
- The repo uses Node.js 22+, SQLite, server-rendered templates, and built-in Node services rather than external frameworks.

## Current Documentation Baseline

- Core build guidance exists in `docs/build-playbook.md` and `docs/roadmap.md`.
- Governance, privacy, RBAC, requirements, data, and integrations are documented under `docs/`.
- The repo now includes a dated implementation plan for member-controlled profiles, connected sharing, honorary members, memorial entries, and unified sign-in in `docs/2026-04-27-member-profiles-connected-sharing-plan.md`.
- The repo now includes this `docs/knowledge-source/` folder as a standing external reference layer.

## Most Recent Documented Feature Waves

- Membership fees and good-standing governance were documented as a canonical implementation plan on 2026-04-26.
- Member-controlled profiles, connected sharing, unified sign-in, honorary members, and memorial planning were documented on 2026-04-27.
- The member-profile implementation wave is now in progress on 2026-04-27 with richer professional fields, field-level visibility controls, a public-profile review queue, and admin-managed honorary-member and memorial entry storage/UI foundations.
- The current build was published on 2026-04-27 to the stable production alias `https://iwfsa-platform.vercel.app` after full CI validation.
- Post-deploy verification confirmed both event-creation paths are working for the checked cases: a member-created all-members event appeared in both member/admin listings, and an admin-created board-only event appeared in admin while staying hidden from the verified non-board member view.
- The running authenticated profile flow was rechecked on 2026-04-27: member profile fields can be submitted for public review and the admin public-profile queue receives the pending request correctly.
- A concrete checkpoint `4.7` implementation slice is now documented for approved public rendering of social/profile fields, safe link normalization, and the next API/web test additions.
- The public, unified sign-in, member, and admin surfaces were visually hardened on 2026-04-27 with stronger IWFSA logo integration, cleaner responsive structure, sticky-header preservation, and keyboard-friendly admin overview tiles.
- Member/admin directory display now guards against mojibaked placeholder text in organisation/contact fields so encoded dash strings render as clean empty-state dashes instead of visible corruption.
- The admin member module now includes a clearly named Historical Figures & Past Members section, compact member controls, and richer list filtering/sorting for status, role, group, and search.
- Event creation now returns Event Hub and member event listings to the broad list view after save so newly entered meetings are visible immediately.
- Custom project instructions were updated to require maintaining this knowledge-source folder as part of ongoing work.

## Active Documentation Expectations

Any material change should keep the following aligned:
- `docs/build-playbook.md`
- `docs/roadmap.md`
- `docs/product-requirements.md`
- `AGENT.md`
- `.github/copilot-instructions.md`
- `docs/knowledge-source/change-log.md`
- `docs/knowledge-source/current-state.md`

## Current Next-Step Direction

The next expected documentation and implementation path is:
1. build on checkpoint `4.6` with public-profile rendering rules, richer approval states, and clearer member/admin profile review transitions,
2. execute the documented checkpoint `4.7` slice for approved public rendering, safe social-link output, and visibility-aware public data shaping while preserving privacy-first defaults,
3. shape the first checkpoint `4.8` implementation slice for conference sharing and institutional-memory foundations,
4. use the live production alias for stakeholder review and convert any accepted feedback into the next scoped enhancement slice.

## Notes For External Agents

- Treat `docs/knowledge-source/` as the orientation layer, not the detailed source of truth.
- Use the linked canonical docs for policy and implementation detail.
- Update this file when the active baseline or next-step direction changes materially.
