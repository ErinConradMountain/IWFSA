# RBAC & Permissions (Draft)

## Roles
- ChiefAdmin
- Admin
- EventEditor (event-scoped)
- Member
- Public

## Permission Matrix (high-level)
### Public
- View public pages
- Access login

### Member
- View internal event listing and details (eligible events only)
- Register/cancel registration
- View waitlist status
- Manage own profile basics
- Create, edit, and publish own meetings
- Delete own draft meetings
- Assign/revoke event-scoped editor rights for meetings they created
- Choose event audience (all members or specific groups/committees)
- Send meeting planning updates to invitees by scope (all/confirmed/waitlisted/pending)
- Use internal collaboration workspace (draft notes + internal comments) on meetings they can edit (not member-visible)

### EventEditor (event-scoped)
- Create/edit/publish meetings for assigned events/series
- Edit event content and logistics within assigned event scope
- Manage planning updates and attendee communications for assigned meetings
- Use internal collaboration workspace (draft notes + internal comments) on assigned meetings (not member-visible)

### Admin
- CRUD members
- Bulk import members (Excel)
- Send/resend onboarding invites
- Trigger credential resets (private delivery to member)
- CRUD all events/series (including member-authored events)
- Assign/revoke EventEditor rights per event
- Manage and override any meeting details/communications lifecycle
- Draft birthday posts for members (where consent allows)
- Schedule birthday posts (if enabled by policy)
- View social publish history and failures
- Approve birthday posts only if policy allows (otherwise ChiefAdmin-only)
- Manage external directories (IWF Global members, sister organisations, other listings)

### ChiefAdmin
- All Admin rights
- Manage Admin users and system-wide settings
- Approve and publish birthday social posts to public channels
- Approve automated daily birthday posts (recommended)
- Pre-approve celebration posts in advance (recommended)
- Manage social media integration settings/credentials (or delegate to a restricted Admin)

## Notes
- All permission changes are audit logged.
- Meeting creation/publish, RSVP confirmations, and editor grant changes are audit logged.
- Closed group events require group membership checks.
- Social posting is marketing/promotional content and requires explicit member consent and strong audit logging.
- Pre-approvals must be audit logged and must be revocable.
