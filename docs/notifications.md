# Notifications (MVP + Extensions)

## Goals
- Members who signed up must be notified automatically when events are postponed, rescheduled, or cancelled.

## Queue status (plain language)
- Think of the notification queue as a simple health indicator, not a technical log. The admin console shows a compact status card that answers:
	- Are notifications flowing?
	- Are any jobs stuck or failing?
	- Do I need to look at the Delivery Report?
- The queue status card shows a short health label (for example `Healthy`, `Degraded`, or `Attention needed`) plus a few counts, such as how many items are queued, sending, or failed in the last day. If it shows anything other than healthy, the next step is to open the Delivery Report to see which members were affected.

## Delivery report (admin view)
- The Notification Delivery Report is a member-focused view of recent sends. It is designed for operational follow-up, not deep debugging.
- Columns in the default report are:
	- Member name
	- Email
	- Phone
	- Organisation
	- Status (for example Sent / Failed) as a compact badge
- Time stamps, internal user ids, notification type keys, and raw error text remain available in the underlying audit tables and logs, but are not shown in the main Delivery Report grid. Admins use the report to see who was contacted (or failed) and which contact details to use when following up.

## How it works (technical)
- Table `notification_queue` uses statuses `pending`, `processing`, `sent`, `failed`, with `attempts`, `last_error`, and timestamps. Unique idempotency keys stop duplicate enqueues.
- The worker pulls pending rows, marks them processing, increments attempts, and fan-outs per-user sends. Per-user results are written to `notification_deliveries` with status `sent` or `failed` plus an optional `error_message`.
- A batch finishes as `sent` if all per-user sends succeed; otherwise it finishes as `failed` with a short `last_error` summary (for example `missing_email:123`).
- Admin APIs: `/api/admin/notification-queue` (queue status backing data) and `/api/admin/notification-deliveries` (per-send view). The admin UI surfaces both as:
	- a simplified Queue Status card (health + basic counts), and
	- a member-centric Delivery Report for per-recipient outcomes.

## MVP Channels
1. In-app notifications (notification center)
2. Transactional email (delivery receipts and bounce handling)

## Triggers
- Event status changes: published → postponed/rescheduled/cancelled
- Time/date changes
- Venue changes (including switching to/from online)
- Capacity changes that affect waitlist promotion
- Waitlist promotion (waitlisted → confirmed)
- New event document published (optional): agenda/minutes/materials become available
- Member onboarding invite sent (admin-triggered; transactional)
- Credential reset initiated (admin-triggered; transactional)
- Invite/credential email bounce detected (operational; admin-facing)
- Birthday posts pending approval (daily, when automation enabled)
- Birthday post approval reminder (optional; before cutoff)

## Recommended Implementation Pattern
- Use a background job/queue for fan-out sending.
- Use idempotency keys per (targetId, changeVersion, userId, channel) to prevent duplicates.
- Store an immutable send log (provider message id, status).

Note: admin approval emails for birthday posts are operational messages to admins; member-facing birthday social posts are marketing and must be consent-gated.

## Optional Future Channels
- Web push (opt-in)
- SMS (opt-in, urgent-only)

## Compliance Notes
- Service notifications for signed-up events are operational/transactional.
- Marketing messages require explicit consent.
- Public birthday posts (name/photo/roles) are marketing/promotional and require explicit, per-member consent.
- Baseline consent and retention expectations are defined in `docs/privacy-baseline.md`.

## Member Onboarding / Credential Emails

### Security requirements (minimum)
- Do not store member passwords in the database in plaintext.
- Do not log generated passwords or include them in application logs/traces.
- Use a *temporary* password and force a password change at first sign-in.
- Prefer a short-lived onboarding link/token and expire it after first use.

### Email template: Onboarding credentials (admin-triggered)

**Subject:** IWFSA Member Portal \u2013 Your login details

**Body (plain text):**

Hello {{firstName}},

Your IWFSA Member Portal account has been created.

The Member Portal is the official place to view upcoming IWFSA events, manage registrations, receive event updates/notifications, and access member-only information.

Website: {{portalUrl}}
Username: {{username}}
Temporary password: {{temporaryPassword}}

Access requirement: To access the portal, you must change the temporary password. Depending on portal policy, you may also be asked to personalise your username (recommended when generated/default usernames are used). Until activation is completed, your member profile remains on our database for administration purposes, but you will not be able to log in using temporary credentials.

Please sign in as soon as possible and complete the activation step. Once updated, keep your password private and do not share your login details with anyone.

POPIA notice: The IWFSA Member Portal is managed in accordance with the Protection of Personal Information Act (POPIA). Your login credentials are treated as confidential and will not be disclosed to third parties. Only you will have access to your username and password, and you are encouraged to change your temporary password on first login.

If you did not expect this email, or if you believe your account has been compromised, please contact us at {{supportEmail}}.

Kind regards,
Akeida Bradley
IWF Administrator

### Email template: Credential reset (admin-triggered)

**Subject:** IWFSA Member Portal \u2013 Password reset

**Body (plain text):**

Hello {{firstName}},

A password reset was initiated for your IWFSA Member Portal account.

Username: {{username}}
Reset link (expires): {{resetUrl}}

If you did not request this change, please contact us at {{supportEmail}}.

Kind regards,
Akeida Bradley
IWF Administrator
