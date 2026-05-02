# Release Note - 2026-04-27

## Summary

- Published the current IWFSA build to the existing production alias: `https://iwfsa-platform.vercel.app`.
- Confirmed the production deployment responded successfully at `/health` and served the refreshed public homepage.
- Ran full repository validation before deployment with `npm run ci`.

## Verified Event Flows

- Member-created event flow verified locally with an active member session.
- Created `Member Verification Event 2026-04-27 15:39` from the member workspace.
- Confirmed the member-created event appears in the member event directory and in the admin Event Hub.
- Admin-created event flow verified with an authenticated admin session.
- Created and published `Admin Verification Board Event 2026-04-27 15:42` for the `Board of Directors` audience.
- Confirmed the admin-created board-only event appears in the admin Event Hub.
- Confirmed the non-board member event view does not show the board-only event.

## Outcome

- Public alias is ready to share for stakeholder testing.
- Event visibility is behaving correctly for the verified cases:
  - all-members events are visible in member and admin views,
  - board-only events remain visible in admin and hidden from the verified non-board member view.
- Profile moderation handoff is behaving correctly on the running build:
  - member profile visibility can be switched to `submitted_for_public_review`,
  - the admin review queue receives the pending submission,
  - the local test submission was cleared again after verification.

## Next Plan Items

1. Continue checkpoint `4.6` by extending member-profile rendering and review states beyond the current foundation.
2. Prepare checkpoint `4.7` work for social links and finer profile visibility controls without weakening privacy defaults.
3. Define the first implementation slice for checkpoint `4.8` conference sharing and institutional-memory foundations.
4. Run stakeholder review against the live alias and capture any visibility, profile, or storytelling adjustments before the next build slice.

Reference:
- `docs/2026-04-27-4.7-social-links-visibility-slice.md`