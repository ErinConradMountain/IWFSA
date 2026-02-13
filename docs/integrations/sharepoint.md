# SharePoint Document Storage (Draft)

This document describes how to store event documents (agenda, minutes, attachments) in SharePoint while keeping access member-only.

## Goals
- Store event documents in SharePoint (preferred by IWFSA)
- Keep documents accessible only to eligible members (based on event audience)
- Provide reliable downloads in the app without leaking long-lived public links
- Support replacing/removing documents with audit trail

## Recommended Approach (MVP)
### 1) Store files in a dedicated SharePoint site/library
- Create a SharePoint site (e.g., “IWFSA Events”) with a document library (e.g., “Event Documents”).
- Organize folders per event (or per year/month), e.g.:
  - `Event Documents/2026/EVT-000123/agenda.pdf`
  - `Event Documents/2026/EVT-000123/minutes.pdf`

### 2) App stores SharePoint identifiers, not public URLs
When a document is uploaded, persist:
- `sharepointSiteId`
- `sharepointDriveId` (document library)
- `sharepointItemId` (driveItem id)
- `fileName`, `mimeType`, `sizeBytes`, `checksum` (optional)

This avoids depending on fragile or shareable URLs.

### 3) Download flow: app-mediated access (member-only)
Preferred pattern:
1. Member requests document download via the app.
2. App checks eligibility:
   - user is authenticated
   - user is allowed to view the event (audience rules)
   - document is available (e.g., minutes only after event)
3. If allowed, app fetches the file from SharePoint using Microsoft Graph and streams it to the member.

Benefits:
- No SharePoint link sharing required
- Centralized authorization in the app
- Works even if SharePoint link policies are strict

## Microsoft Graph Requirements (high level)
Two common patterns:

### A) Application permissions (server-to-server)
- Pros: members don’t need Microsoft accounts; app controls access.
- Cons: requires admin consent; must scope access carefully.

Typical permissions (subject to tenant policy/security review):
- `Sites.Selected` (recommended) + grant access only to the specific site
  - Then assign the app access to the SharePoint site via admin tooling
- Alternative (broader, usually discouraged): `Sites.Read.All` / `Sites.ReadWrite.All`

### B) Delegated permissions (user-based)
- Pros: uses member’s own SharePoint permissions.
- Cons: requires each member to have Microsoft 365 access and the right SharePoint permissions; often not feasible for mixed audiences.

## Upload flow (admin/editor)
- Admin/editor uploads document in the app.
- App writes to SharePoint via Graph into the configured library/folder.
- App records the driveItem identifiers on `EventDocument`.

## Link sharing (optional fallback)
If streaming is not feasible initially, you can generate SharePoint sharing links, but:
- Treat them as sensitive (they can be forwarded)
- Prefer time-limited links if available in your tenant
- Avoid embedding links into public channels

## Audience / Closed Group Events
- Documents inherit the event’s audience rules.
- For group/committee events, only group members can download.

## Operational Notes
- Keep a mapping table for environment configuration:
  - which SharePoint site/library is used in dev/staging/prod
- Log access attempts (success/denied) for auditability.
- Decide retention rules: keep minutes indefinitely vs archive.

## Future Enhancements
- Virus scanning / file type allowlist
- Version history: keep prior uploads as separate items or SharePoint versions
- “Publish document” workflow (draft vs visible to members)
