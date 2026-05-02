# Admin Runbook (Draft)

This runbook describes day-to-day operations for the IWFSA application.

## 0) Using the Admin Console
- **Navigation**: Use the top-level tabs to switch between public site, Member Portal, and Admin Console after signing in through the shared `Sign in` entry point. Inside the Admin Console, use the sub-navigation links to jump between modules (Directory, Membership & Fees, Imports, Event Hub, Notifications, Public Profile Review, Honorary Members, Memorials).
- **Event Hub**: Use this dashboard to see all upcoming events (published and draft) and access planning tools.
- **Help Banners**: Most admin screens have a help banner at the top explaining key tasks. You can click the **"X"** to dismiss these instructions. They will stay hidden on your device unless you clear your browser data.
- **Queue Status**: Check the "Notification Queue Status" card on the main admin dashboard for a quick health check of the email system (`Healthy`, `Degraded`, etc.).
- **Public Page Hero**: Use the Overview card called **Public Page Hero** to change the homepage lead image. Only Admin and ChiefAdmin can update it.

## Roles referenced
- **ChiefAdmin**: platform owner and escalation path (Akeida Bradley)
- **Admin**: supports membership, events, permissions
- **EventEditor**: drafts/edits assigned events
- **Member**: signs up, downloads delegate documents, and can create/manage their own meetings

## 1) Meeting workflow (create -> publish -> plan)
### Create a new event (Member, Admin, or EventEditor)
1. Create event and publish immediately (no approval step).
2. Fill mandatory fields:
   - Title, date/time, host/chairperson
   - Venue type (physical or online)
   - Capacity + registration close date/time
   - Audience (all members vs specific group/committee to target invited members)
3. If online and using Teams:
   - If automation is enabled, the join link will be generated on publish.
   - If automation is not enabled, add the Teams join link manually when available.
4. Confirm invitation fan-out:
   - Invitees receive in-app notifications.
   - Invitees receive email with RSVP confirmation link.
   - RSVP links allow two responses: **Confirm participation** or **Cannot attend**.
   - A **Cannot attend** response is recorded immediately, visible in Meeting Planning, and can trigger waitlist promotion when applicable.
5. If a scheduling overlap warning appears, decide whether to:
   - adjust the time, or
   - keep the time and continue (overlaps are allowed, but members may need to choose one meeting).

### Verify publish and planning readiness
1. Confirm status is **Published** immediately after create.
2. Confirm the member listing shows:
   - Seats remaining
   - Countdown to registration close
   - Correct audience visibility
3. Open Meeting Planning and monitor:
   - invited vs confirmed vs waitlisted vs pending
   - latest organiser updates

## 2) Delegating event editing rights
### Assign an EventEditor to a designated event (Admin/ChiefAdmin)
1. Ensure the user is an active member account.
2. Assign **EventEditor** permission scoped to the specific event (or series).
3. Confirm the editor can view the event in “My Events” and can manage meeting details/planning.

### Revocation
- Remove the event-scoped grant and confirm access is removed immediately.
- Audit log must record who granted/revoked and when.

## 3) Managing members
### Add or update member records (Admin)
- Maintain member profile data (name, company, photo, biography, links, expertise, role details) and membership status.
- Assign group/committee memberships.

### Annual membership and fees control
1. Open Admin -> Membership & Fees.
2. Confirm the active membership cycle and due date of **31 March**.
3. Review dashboard KPIs:
   - active members
   - good standing
   - outstanding
   - blocked
   - deactivated
   - onboarding incomplete
4. Review members flagged after the due date.
5. For any member whose dues are not up to date, Admin may:
   - mark paid / partially paid / waived
   - block access immediately
   - deactivate the member immediately
   - restore access when the record is corrected
6. Record the reason/note for each standing or access change.
7. Confirm audit history is present for the action.

### Initial provisioning (Excel import) + onboarding invites
1. Go to Admin → Members → Import from Excel.
2. Upload the spreadsheet and map columns if prompted.
3. Review validation results:
   - Fix errors in the spreadsheet and re-upload if needed.
   - Confirm how duplicates should be handled (update vs skip).
4. Run the import and review the summary report (created/updated/skipped/failed).
5. Send onboarding invites:
   - From Admin → Members → Invites/Onboarding, select members and click “Send invites”.
   - The invite email includes the member's username and a secure activation link.
   - The member completes activation by following the link and setting a password.
   - Where mobile numbers are available and the channel is configured, send a WhatsApp onboarding prompt as well.
6. Confirm invite delivery status and follow up on bounces.

### Member profile requirements
Members should be asked to complete or update:
- profile confirmation
- image
- biography (target max 300 characters)
- LinkedIn and professional links
- contact details
- current IWFSA position
- company / business details
- business role / title
- expertise / sector selections

Admin may edit or add to the same information when needed.

### Credential reset (Admin-triggered)
- Use when a member needs to reset their login credentials.
- From Admin → Members, select the member(s) → “Trigger credential reset”.
- The system sends a private email to the member with a secure, short-lived reset link.
- Admins cannot view the member’s password.

### Public profile review queue
1. Open Admin → Public Profile Review.
2. Review submitted profile elements, including public biography, display details, and links marked for public consideration.
3. Compare the submitted public preview against the member-visible profile to confirm nothing private is being exposed.
4. Approve, reject, request revision, or archive the submission.
5. Confirm the review action is reflected in the queue and captured in audit history.

## 4) Managing the public homepage hero image
1. Open Admin → Overview → Public Page Hero.
2. Choose one of these options:
   - paste a stable `https` image link, then select **Save linked image**
   - choose a JPG, PNG, or WebP file and select **Upload to site**
3. Add alt text that describes the scene and purpose of the image.
4. Choose the crop focus that best keeps the main subject visible on the homepage.
5. Use the preview to confirm the image still works inside the wide homepage frame before leaving the page.
6. If the image does not fit well, switch to a wider landscape image or move the crop focus.
7. Use **Use default image** to restore the original homepage image.

Recommended image guidance:
- Aim for a landscape image at about `1600 x 900` or larger.
- Keep the main subject near the upper middle of the image because the public page uses a 16:9 cover crop.
- Avoid images with small text or busy edges because they crop poorly on smaller screens.
- Keep uploaded files under `5 MB`.

### Honorary members and memorial management
1. Open Admin → Honorary Members or Admin → Memorials.
2. Create or edit entries with the approved portrait/image, biography or tribute text, and display ordering.
3. Keep unpublished drafts hidden until wording, imagery, and governance approvals are complete.
4. Publish only entries that are appropriate for the public site and aligned with IWFSA's respectful presentation standards.
5. If an entry needs to be withdrawn or revised, change it to hidden or archived and record the reason in the admin note or audit trail.

### Disable an account
- Suspend login and remove elevated permissions.
- Member should no longer access internal listings.
- A blocked or deactivated member should no longer appear in the member directory used by members.

## 4) Events: capacity, waitlist, and eligibility
### Capacity rules
- If seats remain: new signup becomes **Confirmed**.
- If full: new signup becomes **Waitlisted**.
- On cancellation: promote the earliest waitlisted member (automatic).

### Closed group/committee events
- Only eligible group members can see the event and register.
- If membership changes, eligibility changes immediately.

## 5) Postponements, rescheduling, cancellations
### Postpone/reschedule
1. Update date/time and optionally status to **Postponed/Rescheduled**.
2. Trigger automatic notifications to:
   - Confirmed attendees
   - Waitlisted members (if you want them informed)
3. If calendar/Teams automation is enabled:
   - update the organizer calendar event (and Teams details if applicable)

### Cancel
1. Change status to **Cancelled**.
2. Trigger automatic notifications to all signed-up members.
3. If calendar automation is enabled:
   - cancel/delete the organizer calendar event to send meeting cancellations.

## 6) Documents (agenda, minutes, delegate materials)
### Upload documents (Admins, EventEditors for assigned events, or event owners)
1. Upload to SharePoint via the app.
2. Tag document type: `agenda`, `minutes`, or `attachment`.
3. Use a suitable file format for the audience (for example PDF, Word, Excel, PowerPoint, CSV, or TXT).
4. Do not upload executable/program files (for example `.exe`) — these are blocked by the system.
5. Set availability:
   - immediate (agenda)
   - after event (minutes)
6. Verify that only eligible members can download.

### Replace/remove documents
- Replace by uploading a new document and unpublishing/removing the old.
- Ensure audit log captures who changed what.

## 7) Notifications operations
### Channels (MVP)
- In-app notifications (always)
- Transactional email (always for critical changes)

### Recommended notification policy
- Always email on cancellation and time/date changes within 7 days of start.
- Optional email when agenda/minutes become available.

### Delivery monitoring
- Use the **Notification Queue Status** card to check overall health:
   - If status is healthy and there are no recent failures, no action is required.
   - If status shows degraded or attention needed, open the **Notification Delivery Report** to see which members were affected.
- Use the **Notification Delivery Report** (member name, email, phone, organisation + status) to follow up on failed deliveries or to confirm who received a given notification.
- Track bounces/complaints and update member contact details.
- Avoid repeated sends: system must use idempotency keys.

### Membership activity alerts
- Review admin alerts for:
   - profile confirmations
   - profile edits
   - public profile submissions and review outcomes
   - image/bio/contact changes
   - onboarding delivery failures
   - members still incomplete after invitation
   - members flagged after 31 March
   - standing/access changes

## 8) Incident checklist (quick)
- Wrong audience visibility: unpublish → fix audience/groups → republish.
- Teams join link wrong: replace link → notify registrants.
- Overbooked capacity: freeze signups → contact affected members → correct waitlist ordering.
- Document leaked: remove/revoke access, rotate any tokenized feed links if used.

## 9) Audit expectations
The system must record:
- Publish approvals
- Permission grants/revocations
- Event edits and rollbacks
- Notification sends for cancellations/postponements
- Document upload/removal actions
- Public profile review decisions
- Honorary and memorial publication changes

## 9.1 Privacy and retention baseline
- Follow `docs/privacy-baseline.md` for:
  - personal data inventory boundaries,
  - consent enforcement requirements,
  - retention/deletion defaults.
- If legal hold or incident investigation applies, retention windows are suspended for affected records until release.

## 10) Birthday Posts: Daily Automation + Approvals (Optional)
If social birthday posting is enabled, it must be consent-gated and approval-gated.

### Configure daily automation time (ChiefAdmin or delegated Admin)
1. Go to Admin → Settings → Social Posting → Birthday Automation.
2. Enable automation.
3. Choose:
    - Timezone
    - Daily run time (the administrator can choose the time)
    - Optional approval cutoff time
    - Default platforms (only those connected)
    - Approval policy (Admin vs ChiefAdmin)
4. Send a test approval email to confirm delivery.

### Daily operations (approver)
- When birthday posts are prepared, you will see:
   - An in-app notification/popup prompting you to review and approve, and/or
   - An email with a secure approval link.
- Review each post:
   - Confirm member consent is present.
   - Confirm photo and roles displayed are appropriate.
   - Approve or reject.

### If approval is missed
- If posts are not approved by the cutoff time, they must not publish.
- The system should flag the missed approval and optionally notify admins.

### Troubleshooting
- Provider disconnected/expired token: reconnect the provider; retry publish.
- Image rendering failure: regenerate the card; verify member photo URL/asset.
- Caption too long: edit caption; re-preview platform truncation warnings.

### Pre-approve in advance (recommended)
To avoid approving posts every day:

1. Go to Admin → Social Posting → Approvals → Upcoming approvals.
2. Filter to the next week/2 weeks/month.
3. Review each post preview (caption + image + platforms) and click Approve.
4. Confirm the status changes to Pre-approved.

Notes:
- Any material edit after pre-approval (caption change, regenerated image, platform change) must invalidate the approval and require re-approval.
- If a member revokes consent, the post must not publish even if previously pre-approved.
- You can revoke a pre-approval at any time to force the daily approval prompt again.

## 11) Celebrations: IWF Global Members + Sister Organisations (Optional)
These lists are separate from the IWFSA member database.

### Maintain IWF Global member directory
- Add/update entries with:
   - name, birthday (month/day)
   - portrait (optional)
   - public roles (optional)
   - consent status (required for public social posting)
- Keep “do not post” honoured at all times.

### Maintain sister organisation list
- Add/update entries with:
   - organisation name, country/region
   - anniversary date (month/day)
   - social handles (per platform)
   - confirmation that posting/tagging/logo usage is allowed (if required)
- Use the organisation celebration template for caption + image.


