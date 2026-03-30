# Optional Microsoft 365 Integration Checklist

## Purpose
Use this checklist only when IWFSA wants to turn on Microsoft 365 integrations for the standalone web platform.

This checklist is not required to host the application itself.

## Possible Integrations
- SharePoint document storage
- Teams meeting automation
- Calendar sync or calendar-linked workflows

## 1. Confirm the Hosting Boundary
- The application must already be running as a standalone web app on its own host or platform.
- Do not plan SharePoint as the UI host.
- Treat Microsoft 365 as an integration layer behind the API.

## 2. Prepare the Tenant
- confirm the Microsoft 365 tenant to be used
- create or confirm an Entra application registration for server-to-server access
- store tenant id, client id, and client secret securely

## 3. Decide Which Features Are Being Enabled
- SharePoint documents only
- Teams automation only
- both SharePoint and Teams

Keep disabled features off in environment config until they are tested.

## 4. Configure Environment Variables
- `M365_TENANT_ID`
- `M365_CLIENT_ID`
- `M365_CLIENT_SECRET`
- `M365_GRAPH_BASE_URL`
- `M365_ORGANIZER_UPN` when using Teams automation
- `FEATURE_SHAREPOINT_DOCUMENTS=true` when enabling SharePoint storage
- `FEATURE_TEAMS_GRAPH_AUTOMATION=true` when enabling Teams automation
- SharePoint site and drive ids when document storage is enabled

## 5. SharePoint Document Storage Checks
- create or confirm the target SharePoint site and library
- prefer scoped Graph permissions such as `Sites.Selected`
- upload and download one test event document through the web app
- confirm access rules are enforced by the app

## 6. Teams Automation Checks
- confirm the organizer account to use for automated meeting creation
- publish one online event from the admin console
- verify the API creates or updates the Teams meeting link correctly
- confirm manual link entry still works as a fallback

## 7. Smoke Test the Web Experience
- public route still loads
- member portal still loads
- admin console still loads
- enabling Microsoft 365 features must not break core web hosting

## 8. Rollback Plan
- keep feature flags available for fast disablement
- if Teams automation fails, allow manual online meeting links
- if SharePoint storage fails, disable document integration and continue running the web platform
