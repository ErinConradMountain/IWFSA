# SharePoint Document Storage

This document describes the implemented checkpoint `3.1` flow for event documents (agenda, minutes, attachments) stored in SharePoint with app-mediated authorization.

## Goals
- Store event documents in SharePoint (preferred by IWFSA)
- Keep documents accessible only to eligible members (based on event audience)
- Provide reliable downloads in the app without leaking long-lived public links
- Support replacing/removing documents with audit trail

## Implemented Approach
### 1) Store files in a dedicated SharePoint site/library
- Create a SharePoint site (e.g., “IWFSA Events”) with a document library (e.g., “Event Documents”).
- Organize folders per event (or per year/month), e.g.:
  - `Event Documents/2026/EVT-000123/agenda.pdf`
  - `Event Documents/2026/EVT-000123/minutes.pdf`

### 2) App stores SharePoint identifiers, not public URLs
When a document is uploaded, the API persists:
- `sharepoint_site_id`
- `sharepoint_drive_id`
- `sharepoint_item_id`
- `sharepoint_web_url`
- `file_name`, `mime_type`, `size_bytes`, `checksum_sha256`
- availability metadata (`availability_mode`, `available_from`)

Persistence table:
- `event_documents`

This avoids depending on fragile or shareable URLs.

### 3) Download flow: app-mediated access (member-only)
Implemented pattern:
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

## API Endpoints (checkpoint 3.1)
- `POST /api/events/:id/documents`
  - Multipart upload (`file`) with fields: `documentType`, `availabilityMode`, optional `availableFrom`, optional `availabilityOffsetMinutes`.
  - Common document formats are accepted (for example PDF, DOC/DOCX, XLS/XLSX, PPT/PPTX, CSV, TXT) for agenda, minutes, and attachment document types.
  - Executable/program file types are blocked for safety (for example `.exe`).
  - Allowed roles: admins, event owners, event-scoped editors.
- `GET /api/events/:id/documents`
  - Lists active documents for eligible users.
- `GET /api/events/:id/documents/:documentId/download`
  - Enforces event visibility and availability window before streaming the file.
- `DELETE /api/events/:id/documents/:documentId`
  - Soft-removes document metadata (`removed_at`, `removed_by_user_id`) with audit logging.

## Availability Modes
- `immediate`: available as soon as uploaded.
- `after_event`: available from event end time plus optional offset minutes.
- `scheduled`: available from a specific timestamp (`availableFrom`).

## Microsoft Graph Permissions (recommended)
Application-permission model (server-to-server):

Typical permissions (subject to tenant policy/security review):
- `Sites.Selected` (recommended) + grant access only to the specific site
  - Then assign the app access to the SharePoint site via admin tooling
- Alternative (broader, usually discouraged): `Sites.Read.All` / `Sites.ReadWrite.All`

## Environment Variables
- `FEATURE_SHAREPOINT_DOCUMENTS` (`true`/`false`)
- `SHAREPOINT_TENANT_ID`
- `SHAREPOINT_CLIENT_ID`
- `SHAREPOINT_CLIENT_SECRET`
- `SHAREPOINT_SITE_ID`
- `SHAREPOINT_DRIVE_ID`

If the feature is disabled or required values are missing, uploads/downloads fail fast with integration configuration errors.

## Security and Audit
- Upload/remove/download actions are recorded in `audit_logs`.
- Event audience and RBAC checks are enforced before list/download operations.
- Access remains app-authorized; members do not receive direct SharePoint credentials or long-lived public links.

## Operational Notes
- Configure site/library per environment (dev/staging/prod) using environment variables.
- Keep tenant app consent scoped to the target site/library.
- Decide retention strategy for minutes/attachments according to governance policy.

## Future Enhancements
- Virus scanning / file type allowlist
- Version history: keep prior uploads as separate items or SharePoint versions
- “Publish document” workflow (draft vs visible to members)
