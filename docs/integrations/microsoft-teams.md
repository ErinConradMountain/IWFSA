# Microsoft Teams Integration (Draft)

## Objective
For online events, generate a Teams join link automatically when publishing (preferred), while supporting a manual fallback.

## Constraints
- No anonymous joining.
- Guest joining may apply depending on the IWFSA Microsoft 365 tenant policy.

## Recommended Approach
Use Microsoft Graph to create a Teams-enabled calendar event:
- Create/patch an Outlook calendar `event` with:
  - `isOnlineMeeting = true`
  - `onlineMeetingProvider = teamsForBusiness`
- Persist the returned `joinUrl` (treat as sensitive).

## Requirements
- Microsoft Entra (Azure AD) app registration
- Admin consent for required Graph permissions
- Recommended: a dedicated organizer mailbox/service account
- Feature flag and config:
  - `FEATURE_TEAMS_GRAPH_AUTOMATION=true`
  - `M365_TENANT_ID`
  - `M365_CLIENT_ID`
  - `M365_CLIENT_SECRET`
  - `M365_ORGANIZER_UPN`

## Security
- Do not log join URLs broadly.
- Apply least privilege and restrict which organizer accounts can be used.

## Fallback
If Graph setup is delayed:
- Admin can paste the Teams join link into the event.

## Future Enhancements
- Enforce meeting policy templates/labels if tenant supports them.
- Optional: sync attendees into meeting invites when scale permits.
