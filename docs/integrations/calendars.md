# Calendar Integration (Draft)

## MVP: Manual Add-to-Calendar (Broad Coverage)
Provide a UI dropdown with:
- Download `.ics`
- Add to Google Calendar (prefilled link)
- Add to Outlook (prefilled link)

## Limitation to Communicate
One-off `.ics` downloads and add-links do not reliably auto-update when an event changes.

Operational rule:
- In-app and email notifications remain the source of truth for postponements, reschedules, and cancellations.

## Optional: Subscription Feed (webcal)
Offer a per-user tokenized `webcal://` feed for members who want an auto-updating view.
- Treat feed URLs as secrets.
- Support revocation/rotation.

## Phase 3: OAuth Calendar Sync
Add an opt-in integration to insert/update/cancel events directly in a member calendar.
- Google Calendar API (OAuth)
- Microsoft Graph Calendar API (OAuth)

This remains optional and may require enterprise security review.

## Current Implementation (Checkpoint 3.3)
Feature flag:
- `FEATURE_CALENDAR_OAUTH_SYNC`

Member API surface:
- `POST /api/calendar-sync/oauth/start`
- `POST /api/calendar-sync/oauth/callback`
- `GET /api/calendar-sync/connections`
- `POST /api/calendar-sync/disconnect`

Behavior:
- Sync is opt-in per member/provider.
- Confirmed registrations trigger calendar insert/update.
- Event publish/update propagates updates to connected confirmed participants.
- Registration cancellation and event deletion trigger calendar cancellation attempts.
- Provider errors are recorded in `calendar_sync_failures` and surfaced via in-app notifications (`calendar_sync_failed`).
