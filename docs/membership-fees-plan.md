# Membership Fees and Good Standing Plan

This document is the canonical implementation plan for annual membership fees, member standing, directory eligibility, and admin-controlled access.

It must stay aligned with:
- `docs/product-requirements.md`
- `docs/data-model.md`
- `docs/rbac-permissions.md`
- `docs/member-import.md`
- `docs/member-import-service-contract.md`
- `docs/notifications.md`
- `docs/admin-runbook.md`
- `docs/roadmap.md`

## 1) Policy Summary
- Membership fees are annual.
- Fees for each membership year are due by **31 March**.
- Only members who are both:
  - active, and
  - in good standing for membership fees
  may appear in the member directory and use the member platform.
- Admin is the final authority that determines a member's standing and access.
- The system may flag members for arrears automatically after 31 March, but Admin confirms the final action.

## 2) Core Control Rule
Directory and member-platform eligibility must be enforced from one shared rule:

`eligible_member = account_status == active AND membership_standing == good_standing`

This rule must be applied consistently across:
- member directory visibility
- member login access
- member home/dashboard APIs
- event invite eligibility where applicable
- member search/picker views used by normal members

Admin views remain broader and may include all member records regardless of standing.

## 3) Separation of Concerns
The product must keep three related but distinct concepts:

### Account status
Controls whether a login account is technically active.

Recommended values:
- `active`
- `blocked`
- `deactivated`
- `invited`
- `not_invited`

### Membership standing
Controls whether the member is financially compliant and allowed to participate.

Recommended values:
- `good_standing`
- `outstanding`
- `partial`
- `waived`
- `pending_review`
- `blocked`
- `deactivated`

### Membership category / structure
Describes the member's role or category in IWFSA and must not be confused with standing.

Default category:
- `Active Member`

Supported categories / structures:
- `Honourary Member`
- `Board of Directors`
- `Advocacy and Voice Committee Member`
- `Catalytic Strategy Member`
- `Leadership Development Committee Member`
- `Member Affairs Committee Member`
- `Brand and Reputation Committee Member`

## 4) Admin Dashboard Requirements
Add a dedicated Admin Console module named `Membership & Fees`.

### Summary KPIs
- Total members
- Active members
- Members in good standing
- Members outstanding
- Members blocked
- Members deactivated
- Members still completing onboarding
- Fees collected for current year
- Outstanding balance for current year

### Member grid
Each row should include:
- full name
- email
- mobile/WhatsApp number
- company
- membership year
- membership category
- committee/structure labels
- payment status
- standing status
- account access status
- last payment date
- amount due
- amount paid
- profile completion status

### Filters
- membership year
- good standing / outstanding / blocked / deactivated
- active accounts only / all
- category
- committee / structure
- profile complete / incomplete

### Immediate actions
- mark paid
- mark partially paid
- mark waived
- mark outstanding
- block member immediately
- deactivate member immediately
- restore access
- edit member information
- send onboarding invite
- resend onboarding invite
- send dues reminder

### Auditability
Every status or access change must capture:
- actor
- timestamp
- previous value
- new value
- reason / note

## 5) Annual Membership Cycle
For each membership year:
1. Admin opens or confirms the current membership cycle.
2. Due date defaults to **31 March**.
3. Admin uploads the annual active member list from Excel.
4. System dry-runs and previews changes before apply.
5. System creates or updates member records.
6. System sends onboarding by email and WhatsApp after apply.
7. Members confirm profiles and set username/password.
8. Admin reviews payment compliance and profile completion.
9. After 31 March, the system flags non-compliant members for admin review.
10. Admin blocks or deactivates members whose dues are not up to date.

## 6) Import and Onboarding Requirements
Admin must be able to upload the full active member list via Excel.

The import flow should support:
- dry-run validation
- duplicate detection
- create or update behavior
- batch preview before apply
- per-row status and error reporting
- bulk category assignment
- bulk standing defaults
- bulk onboarding trigger after apply

### Post-import member notifications
Every uploaded active member should receive:
- an onboarding email
- a WhatsApp onboarding message
- instructions to confirm profile
- instructions to set password and username
- a link to complete required member details

## 7) Member Profile Requirements
Members must be able to:
- confirm their profile
- upload or update profile image
- add or amend a short biography
- add or amend LinkedIn and approved professional links
- add or update contact details
- add current IWFSA position
- add company / business details
- add business role / title
- add sector or area of expertise

Admin must also be able to edit and add to the same member information.

### Bio rule
- biography field target limit: approximately 300 characters
- validation should be enforced in both UI and API

### Expertise taxonomy
Use a controlled multi-select list with optional free text fallback.

Suggested default expertise options:
- Legal
- Financial Services
- Human Rights Law
- Corporate Law
- Governance
- Policy and Advocacy
- Leadership Development
- Brand and Communications
- Education and Training
- Entrepreneurship
- Technology and Digital
- ESG and Sustainability
- Public Sector
- Nonprofit / Civil Society
- Healthcare
- Academia / Research
- Media
- Strategy
- Risk and Compliance
- Other

## 8) Member Communication and Editing Expectations
Members should be informed that they can return to the member platform at any time to update:
- image
- contact details
- biography
- links
- professional information

The platform should make clear that profile information is ongoing, editable member data rather than one-time onboarding data.

## 9) Admin Alerts
Admin should receive alerts for activity in the membership workspace, including:
- profile confirmed
- profile updated
- image uploaded or changed
- bio changed
- contact details changed
- professional links changed
- onboarding delivery failure
- incomplete onboarding after invite
- member flagged after 31 March
- standing changed
- access blocked or restored

Alerts should appear in:
- admin dashboard activity feed
- operational notification channels where configured

## 10) Documentation and Implementation Consistency Rules
Any implementation work for membership and fees must keep the following aligned:
- PRD states the business rule and user expectations.
- Data model distinguishes account status, standing, category, and fee records.
- RBAC confirms Admin authority over standing and access.
- Import docs include annual active-member upload and onboarding behavior.
- Notification docs include onboarding, WhatsApp, dues reminders, and admin alerts.
- Runbook explains the yearly cycle and immediate block/deactivate workflow.

If one document changes these rules, the related documents above must be updated in the same change.
