# Data Model (Draft)

This is a draft, implementation-agnostic data model.

## Entities
### User
- id
- username
- email
- passwordHash
- accountStatus (active/blocked/deactivated/invited/notInvited)
- createdAt

### MemberProfile
- userId (FK)
- fullName
- displayName
- company
- title
- businessTitle
- businessDetails
- iwfsaPosition
- bio (target max 300 chars)
- publicBio
- memberBio
- linkedinUrl
- professionalLinksJson
- socialLinksJson
- contactDetailsJson
- expertiseTagsJson
- expertiseFreeText
- interestsJson
- profileVisibilityJson
- publicProfileStatus (draft|submitted|approved|rejected|archived)
- publicProfileSubmittedAt
- publicProfileReviewedAt
- publicProfileReviewedByUserId
- profileConfirmedAt
- photoUrl
- birthdayMonth (1-12)
- birthdayDay (1-31)
- birthdayVisibility (hidden|membersOnly|membersAndSocial)
- birthdayConsentConfirmedAt (nullable; when consent was captured)
- groupMemberships (via join table)

### MemberSocialLink
- id
- userId (FK)
- platform
- label
- url
- description
- visibility (private|admins_only|members_only|submitted_for_public_review|public_approved)
- reviewStatus (draft|submitted|approved|rejected|archived)
- displayOrder
- createdAt
- updatedAt

### ConferenceContribution
- id
- userId (FK)
- eventId (nullable FK)
- title (nullable)
- reflectionText
- lessonLearned
- externalLinksJson
- externalMediaJson
- sessionReference
- speakerReference
- followUpAction
- visibility (members_only|submitted_for_public_review|public_approved|archived)
- consentForPublicUse (boolean)
- reviewedByUserId (nullable FK)
- reviewedAt (nullable)
- createdAt
- updatedAt

### HonoraryMemberEntry
- id
- fullName
- title
- biography
- recognitionReason
- recognitionYear
- imageUrl
- publicDisplayStatus (draft|approved|hidden|archived)
- displayOrder
- createdByUserId (FK)
- updatedByUserId (FK)
- createdAt
- updatedAt

### MemorialEntry
- id
- fullName
- tributeText
- contributionText
- datesText
- imageUrl
- familyApprovedWording
- publicDisplayStatus (draft|approved|hidden|archived)
- displayOrder
- createdByUserId (FK)
- updatedByUserId (FK)
- createdAt
- updatedAt

### MembershipCategory
- id
- name
- isDefault
- isActive

### MemberCategoryAssignment
- id
- userId (FK)
- membershipCategoryId (FK)
- startsAt (nullable)
- endsAt (nullable)
- createdAt
- updatedAt

### MembershipCycle
Represents one annual membership cycle.

- id
- membershipYear
- dueDate (default: 31 March for the relevant year)
- status (draft|open|closed|archived)
- createdAt
- updatedAt

### MemberFeeAccount
Tracks a member's standing for a membership cycle.

- id
- userId (FK)
- membershipCycleId (FK)
- amountDue
- amountPaid
- balance
- paymentStatus (paid|outstanding|partial|waived|pendingReview)
- standingStatus (goodStanding|outstanding|partial|waived|pendingReview|blocked|deactivated)
- accessStatus (enabled|blocked|deactivated)
- lastPaymentAt (nullable)
- reviewedByUserId (nullable FK)
- reviewedAt (nullable)
- adminNote (nullable)
- createdAt
- updatedAt

### MemberFeeTransaction
- id
- memberFeeAccountId (FK)
- transactionType (payment|waiver|credit|adjustment|reversal)
- amount
- referenceText (nullable)
- notes (nullable)
- recordedByUserId (FK)
- recordedAt

### MemberStandingAudit
- id
- userId (FK)
- membershipCycleId (FK)
- previousPaymentStatus
- nextPaymentStatus
- previousStandingStatus
- nextStandingStatus
- previousAccessStatus
- nextAccessStatus
- reason
- actorUserId (FK)
- createdAt

### GlobalMemberProfile
Represents an IWF Global member that is *not* an IWFSA member account.

- id
- fullName
- organisation (optional)
- photoUrl (optional)
- birthdayMonth (1-12)
- birthdayDay (1-31)
- rolesPublicText (optional; short role labels)
- birthdayVisibility (hidden|socialAllowed)
- consentConfirmedAt (nullable)
- createdAt
- updatedAt

### SisterOrganization
Represents an IWF sister country organisation/chapter.

- id
- name
- countryOrRegion
- logoUrl (optional)
- primaryWebsiteUrl (optional)
- socialHandlesJson (optional; per platform)
- anniversaryMonth (1-12)
- anniversaryDay (1-31)
- postingAllowed (boolean; if confirmed permissible to post/tag)
- postingAllowedConfirmedAt (nullable)
- createdAt
- updatedAt

### OrgRole
Represents an IWFSA role/structure label that can be shown on profiles and (optionally) used in birthday messaging.

- id
- name (e.g., “Board Member”, “Events Committee”, “Mentorship Lead”)
- category (leadership|committee|workingGroup|other)
- isActive

### MemberOrgRole
- id
- userId (FK)
- orgRoleId (FK)
- displayLabel (optional override for public display)
- startsAt (nullable)
- endsAt (nullable)
- isPublic (boolean; whether it can be shown in member portal and social posts)
- displayOrder

### Group
- id
- name
- description

### GroupMember
- groupId (FK)
- userId (FK)

### EventSeries (recurring)
- id
- title
- description
- defaultVenueType
- defaultVenueName/address or defaultTeamsMode
- defaultCapacity
- defaultRegistrationClosesAt
- rrule / recurrenceRule

### Event (instance)
- id
- seriesId (nullable)
- title
- description
- startAt / endAt (timezone-aware)
- venueType (physical|online)
- venueName
- venueAddress (optional)
- onlineProvider (teams|other)
- onlineJoinUrl (sensitive)
- hostName (or hostUserId)
- capacity
- registrationClosesAt
- status (draft|published|postponed|cancelled; legacy records may still include pendingApproval)
- audienceType (allMembers|groups)

### EventDocument (optional)
Documents for delegates (agenda, minutes, attachments). Access follows the event’s audience.

- id
- eventId (FK)
- title
- documentType (agenda|minutes|attachment)
- storageProvider (sharepoint)
- sharepointSiteId
- sharepointDriveId
- sharepointItemId
- fileName
- mimeType
- fileSizeBytes
- isSensitive (boolean, optional)
- availableFromAt (nullable; can be set to endAt for “after event” docs)
- uploadedBy (userId)
- createdAt

### MeetingRSVPToken
- id
- token (secure random string)
- eventId (FK)
- userId (FK)
- createdByUserId (nullable FK)
- expiresAt
- usedAt (nullable)
- createdAt

### MeetingPlanningMessage
- id
- eventId (FK)
- senderUserId (nullable FK)
- audienceScope (allInvited|confirmedOnly|waitlistedOnly|pendingOnly)
- subject
- body
- createdAt

### EventAudienceGroup
- eventId (FK)
- groupId (FK)

### Signup
- id
- eventId (FK)
- userId (FK)
- status (confirmed|waitlisted|cancelled)
- createdAt
- updatedAt

### EventRevision
- id
- eventId
- revisionNumber
- snapshotJson
- createdBy
- createdAt

### AuditLog
- id
- actorUserId
- actionType
- targetType
- targetId
- metadataJson
- createdAt

### MemberImportBatch
Tracks an admin-initiated spreadsheet import run.

- id
- createdByUserId (FK)
- sourceFileName
- sourceFileStorageKey (optional)
- status (processing|completed|applied|failed)
- summaryJson (counts: created/updated/skipped/failed)
- membershipSetJson (TEXT; canonical membership-set snapshot for this batch)
- mode / usernamePolicy / activationPolicy / invitePolicy (import options captured at dry-run)
- blockingIssueCount (number of blocking issues preventing apply)
- invitesQueued / invitesFailed (optional invite outcome summary)
- createdAt
- completedAt (nullable)

### MemberImportRow
Stores per-row import outcomes for supportability and admin review.

- id
- batchId (FK)
- rowNumber
- rawDataJson
- dedupeKey (e.g., email)
- action (create|update|skip|error)
- errorMessage (nullable)
- createdUserId (nullable)
- updatedUserId (nullable)
- createdAt

Note: new implementations should treat the batch-level `membershipSetJson` on `MemberImportBatch` as the canonical representation for membership-set behaviour (preview, edit, apply, export). `MemberImportRow` remains useful for legacy batches and deep supportability but is not required for new functionality.

### AccountInvite
Represents a first-time onboarding invite for a member account.

- id
- userId (FK)
- createdByUserId (FK)
- tokenHash (store hash only; never store raw token)
- usernameSnapshot
- expiresAt
- sentAt (nullable)
- usedAt (nullable)
- status (queued|sent|bounced|expired|used|revoked)
- deliveryProviderMessageId (nullable)
- createdAt

### CredentialResetRequest
Represents an admin-triggered reset (private to the member).

- id
- userId (FK)
- createdByUserId (FK)
- tokenHash (store hash only; never store raw token)
- expiresAt
- sentAt (nullable)
- usedAt (nullable)
- status (queued|sent|bounced|expired|used|revoked)
- deliveryProviderMessageId (nullable)
- createdAt

Authentication note:
- The shared sign-in flow uses the member's current username or email plus password.
- First-time onboarding is completed through `AccountInvite` token usage and password setup during activation.

### Notification
- id
- userId
- eventId (nullable)
- channel (inApp|email|push|sms)
- templateKey
- payloadJson
- status (queued|sent|failed)
- providerMessageId
- createdAt

### BirthdayPost
Represents a drafted/scheduled/published birthday message (especially for social media).

- id
- targetType (iwfsaMember|iwfGlobalMember|sisterOrganization)
- targetId (FK; points to User/GlobalMemberProfile/SisterOrganization depending on targetType)
- nextBirthdayDate (computed/stored as month+day; yearless)
- status (draft|pendingApproval|approved|scheduled|published|failed|cancelled)
- captionText
- renderedImageAssetId (FK; points to stored generated image)
- platformsJson (e.g., ["x","instagram","facebook"])
- scheduledForAt (nullable)
- automationRunId (nullable; groups posts generated by a daily automation run)
- contentSnapshotHash (hash of caption + image asset id + platforms + target/date used to detect unreviewed changes)
- createdByUserId (FK)
- approvedByUserId (FK, nullable)
- publishedByUserId (FK, nullable)
- createdAt
- updatedAt

### PreApproval
Represents an approval granted ahead of time for a specific post snapshot.

- id
- birthdayPostId (FK)
- approvedByUserId (FK)
- approvedAt
- contentSnapshotHash (must match BirthdayPost.contentSnapshotHash at publish time)
- validForPublishAt (timestamp/date; optional constraint)
- revokedAt (nullable)
- revokedByUserId (nullable)
- createdAt

### BirthdayAutomationRun
Tracks the daily automation job that prepared birthday posts.

- id
- runDateLocal (date; in configured timezone)
- timezone
- scheduledPublishAt
- status (ran|noBirthdays|failed)
- createdAt

### ApprovalRequest
Represents an approval action that can be completed in-app or via secure email link.

- id
- targetType (birthdayPost|other)
- targetId
- requestedByUserId
- requestedToRole (admin|chiefAdmin)
- status (pending|approved|rejected|expired)
- tokenHash (for email approval link; never store raw token)
- expiresAt
- usedAt (nullable)
- approvedByUserId (nullable)
- approvedAt (nullable)
- rejectedByUserId (nullable)
- rejectedAt (nullable)
- createdAt

### MediaAsset
Generic stored media (e.g., rendered birthday card image).

- id
- storageProvider
- storageKey
- mimeType
- width
- height
- createdByUserId
- createdAt

### SocialPublishAttempt
Tracks per-platform publish attempts and responses.

- id
- birthdayPostId (FK)
- platform (x|instagram|facebook|other)
- status (queued|sent|failed)
- providerPostId (nullable)
- errorCode (nullable)
- errorMessage (nullable)
- createdAt

## Key Constraints
- Signup unique constraint: (eventId, userId)
- Capacity enforcement must be atomic to avoid oversubscription
- onlineJoinUrl should be access-controlled and not broadly logged
- Visible member-directory records must satisfy: `accountStatus = active` and current-cycle `standingStatus = goodStanding`
- Membership categories / committee labels must stay separate from fee standing and access status

## Notes
- EventDocument downloads should be authorized (member must be eligible to view the event).
- Admin is the final authority on standing and access changes, even when the system automatically flags arrears after 31 March.

Credential handling notes:
- Passwords are stored only as secure hashes (never plaintext).
- Invite and reset flows must use short-lived, single-use tokens stored only as hashes.
- Admins must never be able to view a member's current password or any raw activation/reset token.
- Document links should be short-lived/signed where possible to prevent forwarding/leakage.
- Birthday (month/day) and member photos are personal data; public social posting must be gated by explicit consent (birthdayVisibility = membersAndSocial).

