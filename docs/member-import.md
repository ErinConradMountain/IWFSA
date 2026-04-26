# Member Import (Excel) - Working Spec

This document defines the spreadsheet format and import behavior for admin-managed member provisioning.

Implementation contract:
- `docs/member-import-service-contract.md`

## Canonical Dataset Rule (Phase 2)
- Dev/test/demo must use one sanitized canonical fixture:
  - `docs/imports/members-fixture.xlsx`
- Optional companion artifacts for review:
  - `docs/imports/members-fixture.csv`
  - `docs/imports/members-fixture-summary.json`
  - `docs/imports/members-fixture-issues.csv`

Real member files (for example local `Members.xlsx`) are local-only and must not be committed.

## Canonical Membership Set (Plain-English Explainer)

Goal:
- For every import batch, keep one clear, authoritative snapshot of the rows and actions that the system will use from start (dry-run) to finish (apply and reporting).

Key ideas:
- Canonical membership set: the official list of all rows in a batch, including the cleaned data for each row and what will happen to it (`create`, `update`, `skip`, or `error`).
- In the database, this canonical set is stored as JSON on `member_import_batches.membership_set_json`.
- Staging structures (for example `member_import_rows`) are temporary holding places for raw/legacy data; they must not become a second source of truth.

Intended flow (conceptual):
1. Admin uploads the spreadsheet and runs a dry-run import.
2. The system validates each row (required fields, email format, duplicates, mode rules) and decides an action per row.
3. The system writes one canonical snapshot for the batch into `membership_set_json` (this includes row data plus actions and reason codes).
4. Preview screens and CSV reports read from this canonical snapshot so that what the admin sees in the preview is exactly what will be applied.
5. When the admin applies the batch, the system reads from the same canonical snapshot to create or update real member records.
6. After apply, the Admin Member Directory view should match what the canonical snapshot said would happen for that batch.

Hardening implications for Phase 2.2:
- New behavior should treat `membership_set_json` as the single source of truth for preview, editing, apply, and report/export.
- Legacy per-row tables (like `member_import_rows`) can remain as archives or transitional staging, but apply logic and admin previews must not depend on them for the final truth.
- Reconciliation checks and tests should compare:
  - the live member records
  - against the latest applied canonical snapshot for a batch,
  to catch and prevent drift or duplicate member data.

## Import Goals
- Allow admins to create the initial member set quickly.
- Support safe annual re-import updates for the active-member list.
- Produce a clear batch report: `created`, `updated`, `skipped`, `failed`.
- Support annual membership administration and onboarding for the current cycle.

## Header Schema (Row 1)
Expected columns:
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

Notes:
- `Organisation` maps to profile organization metadata.
- `Username` may be blank; the system can generate a unique value.
- `Status` defaults to `Active` when blank.

## Required and Optional Fields
Required:
- `First Name`
- `Surname`
- `Email`

Optional:
- `Organisation`
- `Username`
- `Status`
- `Membership Category`
- `Current IWFSA Position`
- `Company Role`
- `Groups` (comma-separated)
- `Roles` (comma-separated)
- `Phone` (or legacy `Mobile`)

## Mapping and Dedupe Rules
- Primary dedupe key: `Email` (trimmed, case-insensitive).
- `No` is optional and reference-only (never an identifier).
- On re-import:
  - existing email -> update or skip (depending on mode)
  - new email -> create

Supported import modes:
- `create_only`
- `create_or_update` (recommended)

## Security and Onboarding Rules
- Spreadsheet input never includes passwords.
- Temporary credentials are generated only during invite/reset flows.
- First sign-in requires password change.
- Username personalization is policy-driven (optional unless activation policy requires it).
- Unactivated accounts remain stored for administration but cannot authenticate.
- Imported active members should receive onboarding by email and WhatsApp where a valid mobile number is available.
- Default imported membership category should be `Active Member` when blank.
- Imported account access and standing defaults must support admin review before final block/deactivate actions.

Email template and POPIA wording source:
- `docs/notifications.md` ("Member Onboarding / Credential Emails")

## Validation Expectations
- Reject invalid email formats.
- Reject duplicate emails inside the same file.
- Reject rows with missing required fields.
- Preview must show intended `create/update/skip/error` actions before apply.

## Dry-Run Workflow
Run before production import:

```powershell
python scripts\member_import_dry_run.py --input docs\imports\members-fixture.xlsx --output-dir docs\imports --report-prefix members-fixture
```

Expected artifacts:
- `members-fixture-summary.json`
- `members-fixture-issues.csv`

Current canonical snapshot:
- Input: `docs/imports/members-fixture.xlsx`
- Blocking issues: `0`
- Dataset is the single repository fixture used for this phase.

## Import Output Expectations
- Batch summary: `created/updated/skipped/failed`.
- Row-level reason text for failures/skips.
- CSV report export for operational follow-up.
