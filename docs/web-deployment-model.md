# Web Deployment Model

## Positioning
IWFSA is deployed as a standalone web application.

That means:
- members and administrators use normal browser routes on a dedicated domain
- the application is hosted on standard web infrastructure
- SharePoint is not the place where the app UI lives

## Recommended Topology
- Reverse proxy or platform edge with TLS termination
- `apps/web` exposed publicly for `/, /member, /admin, /activate, /reset, /meetings/rsvp`
- `apps/api` exposed behind the same domain boundary or a private service URL
- SQLite for MVP or pilot environments

Typical layout:
1. Browser requests the web UI.
2. The web UI calls the API for auth, events, members, notifications, and admin actions.
3. Optional integrations are invoked from the API only when enabled.

## Optional Integrations
The web platform can operate without Microsoft 365.

Optional integrations include:
- SharePoint for protected event document storage
- Microsoft Teams / Graph for automatic online meeting creation
- Calendar sync providers for direct insertion and updates

These integrations extend the platform but do not define where it is hosted.

## Responsive Delivery Rules
- Public, member, and admin routes must work on phone, tablet, laptop, and wide desktop widths.
- Navigation must support direct module links such as `/member#events` and `/admin#reports`.
- Critical workflows must remain usable with keyboard navigation and clear focus states.

## Deployment Guidance
- Keep web and API logically separate even if they are co-hosted.
- Terminate TLS at the edge and forward only trusted traffic to app services.
- Store secrets in environment injection or platform secret stores, never in git.
- Use staging before production when enabling SharePoint, Teams, or calendar automation.

## Operational Notes
- Start with a single-host or single-project deployment for simplicity.
- Add health checks for both web and API services.
- Treat Microsoft 365 features as feature-flagged integrations with fast rollback paths.
