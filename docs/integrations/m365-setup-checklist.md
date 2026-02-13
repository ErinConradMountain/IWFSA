# Microsoft 365 / Entra Setup Checklist (Draft)

This checklist covers the Microsoft 365 tenant setup for:
- SharePoint document storage (agendas/minutes)
- Microsoft Teams online event automation (optional)

It is written to minimize risk and scope permissions narrowly.

## 1) Decide the operating model
Pick one:
- **MVP (lowest friction):**
  - SharePoint documents via app-mediated access
  - Teams join links can be pasted manually if needed
- **Automation (preferred when approved):**
  - App creates Teams-enabled calendar events via Microsoft Graph

## 2) Create service identities
### A) Organizer mailbox (recommended)
Create a dedicated Microsoft 365 user (or shared mailbox if appropriate), e.g.:
- `events@iwfsa.org.za`

Use this as the canonical organizer for:
- Teams-enabled Outlook calendar events (if automated)

### B) SharePoint site and library
Create a dedicated SharePoint site for the app, e.g.:
- Site: “IWFSA Events”
- Library: “Event Documents”

## 3) Register an Entra (Azure AD) application
In Microsoft Entra admin center:
- Register a new app (name: “IWFSA App”) and record:
  - Tenant ID
  - Client ID
- Create a client credential:
  - Prefer certificate in production
  - Client secret acceptable for dev/staging (with strict storage)

## 4) Graph API permissions (least privilege)
### SharePoint documents
Recommended:
- **`Sites.Selected`** (Application)

Avoid, unless explicitly required:
- `Sites.Read.All` / `Sites.ReadWrite.All`

### Calendar events (only if automating Teams-enabled events)
- `Calendars.ReadWrite` (Application)

Optional (only if the app will send emails itself):
- `Mail.Send` (Application)

After selecting permissions:
- Grant **admin consent**.

## 5) Grant `Sites.Selected` access to the SharePoint site
Because `Sites.Selected` starts with zero access, you must explicitly grant the app access to the specific SharePoint site.

Outcome required:
- The app can read/write only within the intended site/library.

(Exact commands/UI steps vary by tenant; capture them here once confirmed by the M365 admin team.)

## 6) Teams policy constraints (no anonymous join)
We require:
- **Anonymous meeting join disabled**
- Guest join may be allowed depending on your org policy

Document the tenant decision for:
- Anonymous join: OFF
- Guest access: ON/OFF (choose per IWFSA policy)
- Lobby behavior (who can bypass, who can admit)

## 7) Optional: Online meetings with app-only permissions
If you choose to create standalone `onlineMeetings` via Graph using application permissions:
- You may need Teams **application access policies** to allow the app to create meetings on behalf of specific users.

For the MVP/first automation pass, prefer creating Teams-enabled **calendar events** (Outlook events) instead.

## 8) Environment configuration (dev/staging/prod)
Plan separate configuration for each environment:
- Tenant (ideally separate non-prod tenant if available)
- SharePoint site/library IDs
- Organizer mailbox UPN
- App credentials

Recommended environment variables (names are placeholders until stack is chosen):
- `M365_TENANT_ID`
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET` (or certificate reference)
- `SP_SITE_ID`
- `SP_DRIVE_ID`
- `M365_ORGANIZER_UPN`

## 9) Verification checklist
- SharePoint: app can upload and download a test file from the target library
- Authorization: app enforces member-only eligibility before streaming documents
- Calendar (if enabled): app can create a Teams-enabled event and store the join URL
- Logging: no join URLs or tokenized links are written to general logs

## 10) Fallbacks if approvals are delayed
- Teams join URL entered manually by admin
- Member “Add to calendar” uses `.ics` + Google/Outlook add links
- App/email notifications remain the source of truth for cancellations/postponements
