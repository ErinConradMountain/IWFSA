# Optional SharePoint Document Storage Integration

## What This Document Means
The IWFSA application is hosted on the web as a standalone platform.

SharePoint is not the place where the app UI runs.

If IWFSA wants Microsoft 365-backed document storage, SharePoint can be enabled as an optional integration that the API uses for event documents.

## Intended Use
Use SharePoint only for:
- agenda files
- minutes
- event attachments that should stay behind the IWFSA web app

The member experience still happens in the web application. Users do not browse raw SharePoint libraries directly.

## Integration Model
1. Admin or event editor uploads a document through the IWFSA web app.
2. The API stores the file in SharePoint using Microsoft Graph.
3. The database stores SharePoint identifiers and document metadata.
4. Members download through the IWFSA app, which enforces event access and availability rules before streaming the file.

## Why This Model
- keeps the product web-first
- centralizes authorization in the application
- avoids long-lived public document links
- lets IWFSA switch the feature off without affecting the main app host

## Data Stored by the App
When SharePoint integration is enabled, the app stores:
- `sharepoint_site_id`
- `sharepoint_drive_id`
- `sharepoint_item_id`
- `sharepoint_web_url`
- file metadata and availability metadata

## Relevant Endpoints
- `POST /api/events/:id/documents`
- `GET /api/events/:id/documents`
- `GET /api/events/:id/documents/:documentId/download`
- `DELETE /api/events/:id/documents/:documentId`

## Required Environment Variables
- `FEATURE_SHAREPOINT_DOCUMENTS`
- `SHAREPOINT_TENANT_ID`
- `SHAREPOINT_CLIENT_ID`
- `SHAREPOINT_CLIENT_SECRET`
- `SHAREPOINT_SITE_ID`
- `SHAREPOINT_DRIVE_ID`

If these are missing while the feature flag is enabled, the integration should fail fast with a configuration error.

## Operational Guidance
- keep separate SharePoint sites or libraries per environment
- prefer `Sites.Selected` over broad Graph permissions
- treat this integration as optional and reversible
- keep the web application working even when SharePoint is disabled

## Smoke Test
1. Enable `FEATURE_SHAREPOINT_DOCUMENTS=true`.
2. Upload a test agenda from the admin console.
3. Verify the document appears in SharePoint.
4. Download it through the IWFSA web route as an eligible member.
5. Confirm ineligible users are denied.
