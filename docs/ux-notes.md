# UX Notes (Draft)

## Public Landing
- Hero section + mission + membership value
- About IWFSA + leadership
- Contact form
- Clear links to Member Portal and Admin Console (top navigation + buttons)
- Do not display hardcoded username/password examples in public or admin-facing UI copy.

## Member Portal
- Event listing tabs: Week / Month / Year
- Each event card shows: date/time, venue (or online), host/chair, seats remaining, registration close countdown
- One-click: Sign up / Join waitlist / Cancel
- Notification center for changes

### Member Portal navigation (modular)
- Within `/member`, use a simple module layout so members do not have to scroll through one long page:
	- Dashboard (welcome + key next actions)
	- Events (list + filters)
	- Birthdays & Notifications (sidebar and notification center)
	- Profile (basic profile view/edit when enabled)
- Use anchors or tabs (for example `/member#events`, `/member#notifications`) so admins and members can jump directly to a module from the Public page or docs.

### Admin Console UX
- **Modular Layout**: Top-level tabs for high-level tasks (Directory, Imports, Event Hub, Notifications) to mimic the Member Modular approach.
- **Help Banners**:
	- **Problem**: Admin interfaces (especially imports/queues) are complex for infrequent users, but repetitive/noisy for power users.
	- **Solution**: Show blue/gray information banners by default at the top of complex modules.
	- **Interaction**: Provide a clear "X" (dismiss) button on each banner.
	- **Persistence**: Store the dismissed state in `localStorage` so the user doesn't see it again on that device.
- **Event Hub Card Layout**: Use a card-based grid (similar to Member events) but denser, focusing on "Status" (Draft/Published) and "Audience" controls.

### Events Page: Right Sidebar
The member event listing view includes a right-side panel for member-only “at a glance” content.

#### Upcoming Birthdays (Sidebar)
- Section title: “Upcoming Birthdays” (or “Celebrating Members”)
- Purpose: celebrate members and strengthen community alongside the events list.
- Window selector: 7 days / 14 days (default) / 30 days
- List order: soonest upcoming first (including year wrap)
- Each row:
	- Circular/rounded portrait thumbnail (high quality)
	- Member name
	- Date label (e.g., “Tue • 12 Feb”)
	- Role tags (e.g., “Board”, “Events Committee”, “Mentorship Lead”)
- Visual style:
	- Use IWFSA brand colors in a subtle gradient header or accent border
	- Soft shadows, elegant typography, and consistent spacing with the rest of the portal
	- Fallback avatar: initials monogram in brand colors if no photo is available
- Empty state: “No birthdays in the next 14 days” with a warm, minimal illustration/accent.
- Accessibility:
	- Provide alt text for portraits.
	- Ensure sufficient contrast for role tags and date labels.
	- Window selector is keyboard accessible.

### Event Documents (optional)
- Event detail page can show a “Documents” section when attachments exist.
- Typical docs:
	- Agenda (often available before the event)
	- Minutes (often available after the event)
	- Other delegate materials
- If a document is not yet available (e.g., minutes), show a clear “Available after event” message.

## Member / Admin / Editor Event Hub
- My Events (members/editors)
- All Events (admins)
- Immediate publish on create (no approval gate)
- Planning workspace: invitee response summary + scoped organiser updates
- Email RSVP-link confirmation for invitees
- Audit + rollback access

### Admin Console navigation (modular)
- Within `/admin`, present panels as modules rather than a single scroll-heavy page. Core modules:
	- Overview
	- Members (directory + actions)
	- Imports (Excel membership set workspace)
	- Events (Event Hub)
	- Notifications (Queue Status + Delivery Report)
- Each module should be reachable quickly via in-page navigation (for example a sidebar or module list) and via anchors such as `/admin#members` or `/admin#imports`.

### Admin: Members (Provisioning + Management)
Provide a dedicated Admin area to manage members, including initial onboarding from an Excel upload.

- Location: Admin → Members
- Tabs:
	- Members
	- Invites / Onboarding
	- Imports
	- External Directories (IWF Global, Sister Organisations)

#### Members tab
- Search + filter by status: Active / Suspended / Invited / Not invited
- Row actions:
	- View/edit member profile (name, company, photo, roles, groups)
	- Suspend/unsuspend access
	- Trigger credential reset (sends private email to member)
	- Resend invite (if not yet activated)
- Bulk actions:
	- Send invite email to selected
	- Trigger credential reset for selected

#### Import members (Excel)
- Entry point: “Import from Excel” button
- Stepper flow:
	1) Upload file (.xlsx)
	2) Map columns (if headers do not match expected fields)
	3) Validate + preview changes
	4) Import (create/update) + summary

Validation/preview UI:
- Show counts: New members / Updates / Duplicates / Errors
- For each row with issues, show an inline error message and whether it will be skipped.
- Import options:
	- Dedupe key: email (default)
	- Behavior: update existing profiles vs create-only
	- Default login creation: create accounts for all valid rows
	- Optional: “Send invites immediately after import” (checkbox)

#### Invites / onboarding
- Shows invite status per member:
	- Not invited
	- Invite sent
	- Invite accepted (activated)
	- Invite expired
	- Email bounced (if available from provider)
- Bulk actions:
	- Send invites
	- Resend invites
	- Re-issue temporary credentials (generates new temporary password, sends email)

Onboarding expectations:
- Invite email includes preset username + temporary password plus a secure link.
- First-time sign-in forces password change; optionally also offer username change.

#### Credential reset (admin-triggered)
- Triggered from member row action or bulk selection.
- Admin sees only that a reset was initiated and delivered/failed; admin never sees the new password.
- Member receives a private email containing a secure, short-lived reset link (and/or temporary password), then must set a new secret.

#### External directories (outside listings)
Support managing non-login lists for communications/celebrations and general directory needs.

- IWF Global members directory (separate from members)
- Sister organisations directory (separate from members)
- Admin can add/edit/delete entries and optionally bulk import

### Admin: Birthday Social Posts
Admins can generate public-facing birthday posts (where member consent allows).

- Entry point: from the birthday list (or from the member profile) → “Create birthday post”.
- Composer:
	- Platform selector (X / Instagram / Facebook)
	- Auto-generated caption with editable fields (greeting + leadership/empowerment line + member roles)
	- Branded image preview (portrait + name + roles + IWFSA mark)
	- Schedule or publish now
- Governance:
	- Require explicit member consent before enabling public posting.
	- Recommended: ChiefAdmin approval before publishing to public channels.
- Audit: store who drafted, approved, and published, with timestamps and final content.

### Admin: Celebrations (IWF Global + Sister Organisations)
Provide a single Admin area to manage and post celebratory messages beyond IWFSA member birthdays.

- Location: Admin → Social Posting → Celebrations
- Tabs / lists:
	- IWFSA Members (birthdays)
	- IWF Global Members (birthdays; separate directory)
	- Sister Organisations (anniversaries/celebration dates)

#### IWF Global Members (Birthdays)
- List behaves like the IWFSA birthday list, but entries come from a separate directory.
- Per-entry fields shown: name, portrait, birthday (month/day), public roles, consent status.
- Actions: Create post, Edit template, Mark as do-not-post.

#### Sister Organisations (Anniversary Posts)
- List shows upcoming celebration dates by month/day.
- Per-entry fields shown: organisation name, country, logo/mark (optional), social handles, celebration date.
- Composer differences:
	- Image uses organisation logo/mark (or a neutral celebratory design if no logo).
	- Caption includes: greeting + empowerment line + a short message addressed to the organisation.
	- Optional tagging of the organisation handle(s).

#### Admin Settings: Daily Birthday Automation
Provide a settings page for configuring the automated daily birthday posting workflow.

- Location: Admin → Settings → Social Posting → “Birthday Automation”
- Controls:
	- Toggle: Enable daily birthday automation
	- Time picker: Daily run time (e.g., 08:00)
	- Timezone selector (default to organization timezone)
	- Cutoff time (optional) for same-day approvals
	- Default platforms (multi-select; filtered to connected providers)
	- Approval policy (Admin vs ChiefAdmin required)
	- Approver recipients list for email approvals (role-based recommended)
- Helper actions:
	- “Send test approval email” (to validate deliverability)
	- “Preview today’s posts” (generates previews without publishing)
- Copy guidance:
	- Warn if no providers are connected.
	- Warn if consent is missing for any member whose birthday is today.

#### Pre-Approval: Approve in Advance
Provide a way for approvers to review and approve posts days/weeks ahead.

- Location: Admin → Social Posting → Approvals → “Upcoming approvals”
- Views:
	- List view (sortable by date)
	- Calendar view (week/month)
- Each item shows:
	- Date/time it will publish
	- Target (member / global member / sister organisation)
	- Platforms
	- Preview (image + caption)
	- Approval status badge: Pending / Pre-approved / Approved today / Rejected
- Actions:
	- Approve (pre-approve)
	- Reject
	- Edit draft (moves back to Pending and invalidates prior pre-approval)
	- Bulk approve for a date range (with safeguards)

Override behavior:
- If a post is Pre-approved, it does not appear in the daily “approve today” popup.
- If anything material changes after pre-approval (caption edited, image regenerated, consent revoked, platforms changed), the approval is invalidated and the post returns to Pending.

#### Automation: Daily Approval Prompt
When automation is enabled, the system prepares today’s birthday post(s) ahead of publish time.

- In-app prompt:
	- On admin login (and/or at the configured publish time), show a non-intrusive but clear modal/popup:
		- “Birthday posts ready for approval”
		- Count of posts and target platforms
		- Primary actions: “Review & approve” and “Skip for today”
	- Reviewing opens a list with per-post preview (image + caption) and Approve/Reject.

- Email approval link:
	- Send an email to approvers with secure links:
		- Approve all
		- Review individually
		- Reject
	- Links must be short-lived, single-use, and require re-authentication if risk policy demands it.

- Safeguards:
	- Clear indicator if consent is missing (post cannot be approved).
	- Clear warning if platform constraints apply (caption truncation, aspect ratio).

### Admin/Editor: Documents
- Upload documents per event with document type (agenda/minutes/attachment).
- Set availability timing (immediate vs after event).
- Remove/replace documents with audit trail.

