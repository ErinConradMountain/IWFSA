# Product Requirements (PRD) — IWFSA Web App

## 0) Strategic Design Goals (Why This Platform Exists)
### Strategic Positioning Statement
This platform is not “a website with logins.”
It is a governance-aware digital operating system for an elite women’s leadership forum — designed to protect trust, enable participation, and quietly strengthen the global IWF ecosystem.

### 0.1 Institutional Memory & Governance Continuity
- Convert IWFSA intellectual capital, decisions, and programmes into durable institutional memory.
- Support board continuity across changing office bearers.
- Preserve decision trails for conferences (for example Cornerstone 2025), programmes, and policy.
- Enable clean auditability aligned with ethical leadership and POPIA obligations.
- Global value: create a repeatable forum-operating model that IWF Global can reference, benchmark, or replicate.

### 0.2 Cross-Cutting Capabilities (Quiet but Powerful)
#### 0.2.1 Privacy-by-Design and Ethical Leadership
- POPIA-aligned data minimisation.
- Explicit consent gates.
- No social posting without opt-in.
- Secure internal APIs with RBAC enforcement.
- This directly reflects IWFSA's Code of Ethical Leadership and governance culture.
- Baseline data inventory, consent matrix, and retention defaults are documented in `docs/privacy-baseline.md`.

#### 0.2.2 Background Jobs and Reliability
- Event notifications, imports, and invitations run asynchronously.
- Idempotent processing is mandatory (safe retries, no duplicates).
- Admins need clear success/failure reporting for operational actions.

#### 0.2.3 Operational Intelligence (Future Layer)
- Not MVP, but designed-for from early architecture decisions.
- Attendance trends by programme type.
- Capacity vs demand insights.
- Leadership pipeline signals (who hosts, who chairs, who mentors).
- Conference readiness dashboards (for example Cornerstone).

Global value:
- Positions IWFSA as a data-informed leadership forum, not just an events host.

### 0.3 Experience & Delivery Guardrails
- Member value without overexposure: deliver high-trust, high-signal member value without turning IWFSA into a noisy social network.
- Events are intentional, not broadcast-driven; no public leakage of internal activity.
- Member experience respects seniority, privacy, and consent (including consent-gated personal data like birthdays).
- MVP-first, future-ready architecture: modular monolith now → service extraction later; deferred integrations until governance/budget/readiness allows.


## 1) Overview
The IWFSA web app is delivered as a standalone web platform and supports:
- A public marketing site
- A member-only portal
- An admin console with delegated event editing

### 1.0 Deployment Model
- The application runs on the web as its own product surface.
- SharePoint is not the host for the UI.
- Microsoft 365 services, when used, are optional integrations behind the API.

### 1.1 Surface Boundaries (Public vs Member vs Admin)
- Public-facing site: brand/storytelling and conference landing pages only; no member details, no internal calendars, and no leakage of private network activity.
- Member portal: trust-based participation (events, registration, notifications, calendar actions) with consent-gated personal data.
- Admin console: governance and control (member provisioning, delegated event editing, audit logs, rollback) with least-privilege access.

## 2) Users
- Non-member (public visitor)
- Member
- Event editor (member with event-scoped permissions)
- Admin
- Chief admin (governance authority: Akeida Bradley)

## 3) Core Member Value
- See internal events (week/month/year) only when active and in good standing
- View capacity remaining and key event details
- Register quickly; be waitlisted when full
- Receive notifications on postponements/cancellations
- Add events to calendar

## 4) Core Admin Value
- Manage members and membership status
- Manage annual membership fees, good-standing decisions, and immediate access control
- Create and manage events and recurring series
- Delegate event editing rights per event
- Support direct publish from draft by authorized collaborators (no moderation gate)
- Audit + rollback
- Preserve governance history and handover-ready institutional records

## 5) Functional Requirements
### Public
- No internal event visibility
- About/mission/contact content
- Homepage hero image is admin-managed only, with support for either a stable external image URL or a direct site upload.
- Homepage hero guidance must help admins choose a landscape image that fits the page crop well, including recommended size, file types, and focal-position guidance.
- Login entry point

### Auth & Membership
- Members, event editors, admins, and chief admins use one unified sign-in entry point.
- The system authenticates the user once, then routes the user to the correct workspace by role.
- Members sign in with username or email plus password after activation is complete.
- Admin-managed membership (no public signup unless explicitly added later)
- Membership fees are annual and due by **31 March** each membership year.
- Only members marked by Admin as active and in good standing may appear in the Members section or use the member portal.
- Admin may block or deactivate a member immediately when dues are not up to date.

Unified sign-in routing rules:
- `chief_admin` -> Admin Console
- `admin` -> Admin Console
- `event_editor` -> Admin Console or the relevant event-management module
- `member` -> Member Portal

#### Member provisioning (Admin)
- Initially, administrators will provision the member database by uploading an Excel spreadsheet.
- The import creates and/or updates member records (and associated login accounts), producing an initial set of members that can be invited to activate their accounts.
- The annual active-member spreadsheet is the operational source for yearly membership administration and onboarding.
- Import must support:
	- Column mapping (if headers differ)
	- Validation (required fields, email format, duplicates)
	- Dedupe rules (by email as primary key; optionally membership number if later added)
	- Update vs create behavior (admin chooses: update existing profiles, create missing)
	- Membership-year and standing defaults for the uploaded active list
	- A clear import results report: created/updated/skipped/failed with error reasons

#### Initial invite + first-time sign-in
- After import, admins can send an invitation email to a member or a selected set of members.
- The initial invitation provides the member's username plus a secure activation link to complete onboarding.
- Active imported members should receive both email and WhatsApp onboarding notifications where contact details are available.
- On activation, the member must set a password and may optionally personalise the username when policy requires it.
- Invite tokens must be short-lived, single-use, and never retrievable by admins once generated.
- Onboarding must require the member to confirm their profile and complete required profile fields before the profile is considered complete.

#### Admin-initiated credential reset (private)
- Administrators can trigger a credential reset for an individual member or a batch selection.
- Reset delivery is private to the member (email to the member address on file). Admins cannot view the member’s new password.
- The reset flow should generate a secure, short-lived, single-use link that allows the member to choose a new password.

#### External directories (Admin)
- Administrators can maintain separate, non-login directories for external listings such as:
	- Sister organisations
	- IWF Global members
	- Other related listings as needed
- These directories are distinct from the IWFSA member login database and are managed via admin CRUD (import or manual entry).

### Admin console UX and help
- Admin console is modular (not one long page) with clear module-level navigation:
	- Overview
	- Members
	- Membership & Fees
	- Imports (Excel membership-set workspace)
	- Events (Event Hub)
	- Notifications (Delivery Report + Queue Status)
- Public/member/admin top-level navigation remains canonical: `Public` (`/`), `Member Portal` (`/member`), `Admin Console` (`/admin`).
- The admin Overview module must include a public-page hero-image management card that is restricted to `admin` and `chief_admin` roles.
- Member and admin modules must support deep-link entry points (for example `/member#events`, `/admin#imports`) so users can jump directly without long-page scrolling.
- All actionable controls expose hover/focus help and ARIA labels; help/tooltips and panel configuration persist between sessions.
- Event Hub uses a card layout with a primary floating Create New Event action, centered filters/tools (view dropdown with counts, refresh icon, reminders with badge), contextual card actions with critical Extend Deadline emphasis, bulk select actions, and an empty state prompt.
- Accessibility: keyboard focus states, contrast compliance for badges/actions, and auditability of critical admin actions.

### Events
- Fields: title, description, start/end, venue type (physical/online), venue details, host/chairperson, capacity, registration close time, audience (Board of Directors; Member Affairs; Brand and Reputation; Strategic Alliances and Advocacy; Catalytic Strategy and Voice; Leadership Development; All Members), status
- Filters: week/month/year + search
- Capacity display: remaining seats; waitlist when full
- Sign-up/cancel flows update availability immediately

### Event Documents (optional per event)
- Events may have attached documents such as **agenda**, **minutes**, or other delegate materials.
- Not all events require documents.
- Documents are **member-only** and must respect event audience rules (all members vs specific group).
- Upload/management rights:
	- Admins can add/remove documents for any event.
	- Event editors can add/remove documents only for events they are assigned.
- Documents can be configured as:
	- available immediately (e.g., agenda)
	- available only after the event (e.g., minutes)
- Members can view/download documents only when eligible for the event.

### Recurrence
- Support recurring event series with per-instance overrides

### Closed Group Meetings
- Event audience can be restricted to one or more IWFSA groupings/committees
- Only eligible members can see/join

### Publishing & Meeting Operations
- Members, EventEditors, and Admins can create/edit meetings (within scope) as drafts and publish directly without moderation
- Event creators can assign event-scoped editors to collaborate on their meetings
- Creators can edit meetings they created (except cancelled records), and event-scoped editors can edit meetings they are granted
- Audit log for creation/publish, edits, RSVP confirmations, and planning communications
- Scheduling clash checks are warning-only: overlapping meetings are allowed, but creators receive an in-app warning when date/time and audience windows overlap existing meetings.
- Invitees receive email RSVP links and can confirm participation via one-click link or in-app registration.
- Meeting organizers can manage planning communications to invitees by scope (all invited / confirmed / waitlisted / pending).

### Notifications
- Automatic notifications to registrants when an event is postponed, rescheduled, or cancelled
- Channels: in-app + transactional email (MVP)
- Membership operations also require onboarding, dues, and admin activity alerts; see `docs/membership-fees-plan.md`.
- Admin monitoring must be member-centric:
	- Delivery Report default columns: Member name, Email, Phone, Organisation, Status
	- Queue Status default view: health label + aggregate counts (pending/processing/sent/failed)
- Internal ids, raw error text, and other low-level diagnostics stay in audit/log tables and are not shown in the default admin grid.

### Admin Worksurface
- **Modular Navigation**: The Admin Console is divided into distinct functional modules (Member Directory, Import, Event Hub, Notifications Audit) to prevent scrolling fatigue.
- **Membership & Fees**: A dedicated admin workspace manages annual fee cycles, payment standing, profile completion, onboarding progress, and immediate access control.
- **Event Hub**: A dedicated dashboard for admins to manage the event lifecycle, including published events, upcoming drafts, and meeting planning.
- **Persistent Help**:
	- Complex admin screens (Import, Event Hub, Queue) include explanatory help banners.
	- Admins can dismiss these banners once read.
	- Dismissal state is saved locally per-device so experienced admins do not see repetitive help text.

### Member Directory and Profile Governance
- The visible Members section must function as a controlled and up-to-date directory of active members in good standing only.
- Admin must be able to edit and add to member information at any time.
- Members must be able to:
	- confirm their profile
	- upload/update their image
	- add or amend a short biography
	- add LinkedIn and approved professional links
	- add or update contact details
	- add current IWFSA position, company, business role, and business details
	- add sector or area of expertise
- The biography field should be limited to approximately 300 characters for consistency and readability.
- Members should be informed that their image, contact details, and bio can be updated at any time by signing in.

Member-controlled profile visibility requirements:
- Profile information is private by default until the member actively changes visibility.
- Members must be able to control whether profile fields are:
	- private,
	- visible to admins,
	- visible to members,
	- submitted for public review,
	- publicly approved.
- Public display of member-created profile information requires explicit member action plus admin approval.
- Public-facing profile highlights must never expose private fields or internal-only activity.

Supported member-controlled profile areas should expand to include:
- display name,
- title,
- organisation,
- short biography,
- public biography,
- member biography,
- professional sector,
- expertise,
- interests,
- optional contact details,
- profile image,
- professional and social links.

Social and external link requirements:
- Members may add manual links such as LinkedIn, Instagram, Facebook, X, YouTube, websites, publications, podcasts, articles, and other approved references.
- Each link must store:
	- platform,
	- URL,
	- short description,
	- visibility,
	- public-review status.
- External links are hidden by default until the member chooses otherwise.
- External links must be validated before storage or display.

Conference sharing and memory requirements:
- Members should be able to contribute member-only conference reflections and follow-up notes.
- Contributions may include text, lessons learned, useful links, external media references, session references, speaker references, and follow-up actions.
- Conference contributions remain member-only by default.
- Any later public storytelling use requires member consent and admin approval.

Public storytelling governance:
- Admins act as stewards of public presentation rather than silent owners of member identity.
- The system should support a review flow for member-submitted public profile content.
- Sensitive public-profile changes and approvals must be audit logged.

Honorary members and memorial requirements:
- The public surface should support an admin-managed Honorary Members section.
- The public surface should support an admin-managed Memorial section for members who have passed away.
- Honorary and memorial entries must be curated, dignified, and governed by admins or chief admins only.
- Public display of honorary and memorial entries must follow governance and appropriateness checks before publication.

### Member Categories and Structures
- Default category: `Active Member`
- Additional categories / structures:
	- `Honourary Member`
	- `Board of Directors`
	- `Advocacy and Voice Committee Member`
	- `Catalytic Strategy Member`
	- `Leadership Development Committee Member`
	- `Member Affairs Committee Member`
	- `Brand and Reputation Committee Member`
- These classifications must remain separate from fee standing and access status.

### Documents & Notifications (nice-to-have)
- Optional: notify signed-up members when a new document is added (e.g., agenda published, minutes available).

### Calendars
- Manual add-to-calendar: ICS + Google link + Outlook link
- Phase 3: OAuth calendar sync for direct insertion/updates

### Microsoft Teams
- Online events may use Teams
- No anonymous joining; guest join depends on tenant policies
- Automation preferred; manual fallback allowed

### Member Services: Birthdays (Events Sidebar)
- On the **member portal event listing** view, show a right-side panel section (member-only) for **upcoming member birthdays**.
- Time window selector:
	- 7 days (week)
	- 14 days (two weeks, default)
	- 30 days (month)
- Sorting: show **soonest upcoming** birthdays first within the selected window (handle year wrap).
- Each birthday entry shows:
	- Member photo (preferred) or a graceful fallback avatar
	- Member name
	- Birthday day/date (month + day; year is never shown)
	- Member’s active IWFSA roles/structures (e.g., committee roles, leadership roles) as short labels
- Privacy/consent:
	- Only include members who have opted in to birthday visibility.
	- Support “show in portal only” vs “show in portal + allow social media posts”.
	- A member can hide their birthday entirely.
	- The portal should not reveal full date-of-birth year.

### Admin: Birthday Social Media Posts (Optional)
- Administrators can create a **birthday post** for an upcoming birthday from the birthday list.
- A birthday post includes:
	- A branded birthday image/card using the member photo and IWFSA visual style
	- A caption that includes:
		- A birthday greeting from IWFSA
		- A short leadership/empowerment message aligned to women’s leadership
		- The member’s current IWFSA roles/structures (to promote involvement)
	- Platforms: all supported platforms via a provider system (see docs/integrations/social-media.md)
- Workflow:
	- Draft → preview (caption + image) → schedule/publish
	- Publishing requires appropriate permission and must be audit logged.
	- Support an approval step (recommended: ChiefAdmin approves posts that go to public channels).
	- Automation (optional): generate birthday posts daily and require approval before publishing.
- Compliance:
	- Social posts are marketing/promotional content and require explicit member consent to use their photo/name in public posts.
	- Provide per-member opt-out and per-post “do not post” override.
	- Store post history and the exact content that was published.

### Admin: IWF Global Member Birthdays (Optional)
- Support a separate directory/list of **IWF Global members** who are not IWFSA members.
- These entries are managed by admins (import or manual) and are kept distinct from the IWFSA member database.
- Admins can generate the same style of birthday posts for IWF Global members:
	- Birthday greeting from IWFSA
	- Leadership/empowerment message
	- The person’s roles (IWF Global roles/structures, if provided and marked public)
	- Platforms: all supported platforms via provider system
- Consent:
	- Explicit consent is required to publish an individual’s name/photo publicly.
	- Allow per-entry opt-out and per-post “do not post”.

### Admin: Sister Organisations (IWF Sister Countries) Celebrations (Optional)
- Support a separate list of **sister organisations** (e.g., IWF country chapters).
- For each sister organisation, store:
	- Name, country/region
	- Logo/brand mark (optional)
	- Social handles/links (optional)
	- Celebration date(s): e.g., anniversary/founding day (month + day)
- Admins can generate an organisation celebration post with:
	- A greeting (e.g., “Happy Anniversary”)
	- A women’s empowerment message
	- A short message addressed to the organisation (collaboration, solidarity)
	- Optional tagging of the organisation handle(s)
	- Platforms: all supported platforms via provider system
- Governance:
	- Same approval/audit requirements as member birthday posts.
	- If the organisation/logo usage requires permission, store confirmation before automated/public posting.

### Automation: Daily Birthday Posting (Optional)
- The system can automatically prepare birthday posts for members whose birthday is “today” (based on configured timezone).
- Admin config:
	- Enable/disable automation
	- Daily run time (admin-selectable; default e.g., 08:00 local time)
	- Target timezone
	- Platforms enabled by default
	- Approval policy: Admin approval vs ChiefAdmin approval required
	- Cutoff time (optional): latest time approval can be granted for same-day posting
- Approval requirement:
	- No automated post is published without explicit approval.
	- Approval can be completed either:
		- in-app via an admin popup/notification (“Approve today’s birthday posts”), or
		- via an email containing a secure approval link (Approve / Reject).
	- Pre-approval override (optional): approved-in-advance posts do not require daily approval.
- If not approved by a cutoff time (configurable), the post remains un-published and is flagged for admin attention.
- All automated actions (generation, approval, publish) must be fully audit logged.

### Pre-Approval: Approve In Advance (Optional)
To reduce daily admin workload, the system supports approving posts well in advance.

- An approver can review a calendar/list of upcoming celebration posts (birthdays and organisation anniversaries) and **pre-approve** them.
- When a valid pre-approval exists, the daily approval prompt is skipped and the post can publish automatically at the scheduled time.
- Pre-approval must only apply if all validation checks still pass at publish time:
	- consent/visibility still allows posting
	- required provider accounts are still connected
	- caption/image match the approved snapshot (no unreviewed edits)
	- target date still matches the intended celebration date (month/day)
- Pre-approval can be revoked at any time, re-enabling daily approval.

## 6) Non-Functional Requirements
- Responsive mobile/desktop UI
- Accessibility target: WCAG 2.1 AA
- Performance: fast event listing and filters
- Security: least privilege, strong password policies, rate limiting
- Privacy/compliance: POPIA-aligned handling of personal data (birthday and photo), including consent for public social posting
- Consistency: membership-fee standing and access rules must be enforced centrally across UI, API, imports, reporting, and admin operations

## 7) Open Questions
- Event size expectations (influences whether Outlook attendee meetings are viable at scale)
- Whether non-members ever see “teaser” events (current: no)
- Whether member self-registration is ever allowed
