# Member Import Service Contract (Checkpoint 1.3)

This contract defines the API and processing behavior for member onboarding imports.

Scope:
- Admin uploads spreadsheet
- System validates and produces a dry-run report
- Admin applies import (create-only or create+update)
- System stores a unified membership-set snapshot (with import actions) and can queue onboarding invites
- Annual active-member import feeds the membership-fees governance workflow for the current cycle

## 1) Access and security
- Allowed roles: `Admin`, `ChiefAdmin`
- All endpoints require authenticated admin session.
- All calls must be audit logged:
  - who initiated
  - source filename
  - selected import mode
  - whether invites were queued
- Spreadsheet files are treated as sensitive personal data.
- Passwords are never accepted from spreadsheet input.

## 2) Canonical spreadsheet schema
Expected headers (row 1):
- `No`
- `First Name`
- `Surname`
- `Email`
- `Organisation`
- `Username`
- `Status`
- `Membership Category`
- `Current IWFSA Position`
- `Company Role`
- `Phone`
- `Groups`
- `Roles`

Required values per data row:
- `First Name`
- `Surname`
- `Email`

Optional but recommended:
- `Phone` (or `Mobile` in older templates) for the member's primary contact number; when present, this maps into the member profile phone field and can be surfaced in admin views such as the Delivery Report.
- `Membership Category` defaults to `Active Member` when blank.

## 3) API endpoints

### 3.1 Create dry-run batch
`POST /api/admin/member-imports/dry-run`

Purpose:
- Validate spreadsheet and compute row actions without mutating users/member profiles.

Request (multipart form-data):
- `file`: `.xlsx`
- `mode`: `create_only | create_or_update` (default: `create_or_update`)
- `default_status`: `Active | Suspended` (default: `Active`)
- `username_policy`: `from_column_or_generate | generate_random` (default: `generate_random`)
- `activation_policy`: `password_change_required | password_and_username_personalization_required` (default: `password_change_required`)
- `invite_policy`: `none | queue_on_apply` (default: `queue_on_apply`)
- `membership_cycle_year`: current year by default

Response `200`:
```json
{
  "batch_id": "imp_20260207_001",
  "status": "completed",
  "mode": "create_or_update",
  "summary": {
    "total_rows": 105,
    "create": 12,
    "update": 93,
    "skip": 0,
    "error": 0
  },
  "blocking_issue_count": 0,
  "has_blocking_issues": false
}
```

The dry-run response should also be able to carry membership-cycle metadata used by the Membership & Fees module, such as current cycle year and category defaults.

Response `422`:
- malformed workbook
- missing required headers
- unsupported file type

### 3.2 Get dry-run/apply batch summary
`GET /api/admin/member-imports/{batchId}`

Response `200`:
- batch metadata
- selected options
- summary counts
- timestamps

### 3.3 List membership-set import records
`GET /api/admin/member-imports/{batchId}/rows?cursor=...&limit=...`

Response `200`:
- paginated row results
- import action + reason code
- optional row field mapping snapshot

### 3.4 Apply import batch
`POST /api/admin/member-imports/{batchId}/apply`

Purpose:
- Execute user/profile/group/role mutations based on dry-run decisions.

Request:
```json
{
  "send_invites": true,
  "invite_expiry_hours": 72
}
```

Rules:
- Apply is blocked if `has_blocking_issues = true`.
- A batch can only be applied once (`idempotent apply` behavior).
- On success, set batch status to `applied`.

Response `200`:
```json
{
  "batch_id": "imp_20260207_001",
  "status": "applied",
  "applied_at": "2026-02-07T14:30:00Z",
  "summary": {
    "create": 12,
    "update": 93,
    "skip": 0,
    "error": 0
  },
  "invites": {
    "queued": 105,
    "failed": 0
  }
}
```

### 3.5 Export row report
`GET /api/admin/member-imports/{batchId}/report.csv`

Purpose:
- Admin support/export of membership-set import outcomes.

### 3.6 Membership-set representation (internal)
- For each batch, the system maintains a canonical membership-set snapshot as JSON (`membership_set_json` on `member_import_batches`). This snapshot contains the normalised membership records and import actions used for preview, editing, apply, and CSV export.
- Legacy per-row tables (`member_import_rows`) may still exist for older batches, but new implementations should treat `membership_set_json` as the source of truth for membership-set behaviour.

## 4) Row action model
Persist import action on each membership-set record:
- `create`
- `update`
- `skip`
- `error`

Recommended `reason_code` values (store in metadata):
- `created_new_member`
- `updated_existing_member`
- `skipped_existing_create_only`
- `missing_required_field`
- `invalid_email`
- `duplicate_email_in_file`
- `invalid_status_value`
- `unexpected_processing_error`

`skip` is non-fatal; `error` is fatal for that row.

## 5) Blocking issue rules
Batch is `has_blocking_issues = true` if any of:
- missing required headers
- any row with missing required fields
- invalid email format
- duplicate email in spreadsheet

Non-blocking examples:
- empty optional fields (`Organisation`, `Groups`, `Roles`)
- blank `Username` when generation policy allows fallback

## 6) Mapping and mutation rules
- Dedupe key: `Email` (trim + lower-case)
- `mode = create_only`:
  - existing email -> `skip`
  - new email -> `create`
- `mode = create_or_update`:
  - existing email -> `update`
  - new email -> `create`

Field mapping:
- `First Name` + `Surname` -> member full-name profile fields
- `Organisation` -> profile company/organisation
- `Status` -> user status (`Active`/`Suspended`, blank uses `default_status`)
- `Membership Category` -> member category assignment (`Active Member` when blank)
- `Current IWFSA Position` -> profile IWFSA position
- `Company Role` -> profile business title/role
- `Groups` -> group memberships (comma-separated)
- `Roles` -> org-role labels (comma-separated; create mapping rules per implementation)
- `Username`:
  - when provided and unique: use value
  - when blank or collision: generate random username

## 7) Credential and invite behavior
- Dry-run never creates or exposes credentials.
- Store only password hash; never store plaintext password.
- Invite/reset links are short-lived and single-use.
- First successful sign-in must force password change.
- Successful apply should support dual-channel onboarding (email plus WhatsApp where configured and available).
- Username personalization is policy-driven:
  - required only when `activation_policy = password_and_username_personalization_required`
  - otherwise optional (recommended when generated/default usernames are used)
- Unactivated accounts remain in DB but cannot authenticate to portal content.

## 8) Processing and transaction behavior
- Batch-level processing can continue after row errors.
- Each row should be processed in an isolated transaction boundary.
- Final summary must equal row-level totals.
- Apply endpoint must be safe against retry/double-submit.

## 9) Observability and audit requirements
- Emit structured logs for:
  - batch start/completion/failure
  - apply start/completion/failure
  - invite queueing summary
- Never log temporary passwords, raw invite tokens, or sensitive auth secrets.
- Capture audit log entries for:
  - dry-run initiated
  - batch applied
  - invite dispatch trigger
  - credential reset dispatch trigger

## 10) Minimum test coverage for implementation
- Header validation (required/expected)
- Dedupe behavior for `create_only` and `create_or_update`
- Row action assignment correctness
- Blocking issue detection and apply gating
- Username generation fallback on blank/collision
- Invite queueing and activation enforcement
- Idempotent apply behavior
