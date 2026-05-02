---
applyTo: "apps/api/migrations/**/*.sql"
---

# Database Migrations

## Naming Convention

Migration files are named `NNNN_description.sql` with a zero-padded four-digit sequence number. They are applied in filesystem sort order by `apps/api/src/db/migrate.mjs`.

Current range: `0001` through `0014`. The next migration must be `0015_description.sql`.

## Writing Migrations

- Always use `CREATE TABLE IF NOT EXISTS` for new tables.
- Always use `CREATE INDEX IF NOT EXISTS` for new indexes.
- Use `ALTER TABLE ... ADD COLUMN` for schema additions — SQLite does not support `ALTER TABLE ... DROP COLUMN` or `ALTER TABLE ... RENAME COLUMN` in all versions.
- Foreign key constraints use `REFERENCES table(column) ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate.
- Store dates as ISO 8601 `TEXT` columns (e.g., `created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP`).
- Use `CHECK` constraints for enum-like columns (e.g., `CHECK (status IN ('active', 'suspended'))`).

## Existing Tables

The baseline migration (`0001_baseline.sql`) creates: `users`, `member_profiles`, `groups`, `group_members`, `events`, `event_audience_groups`, `signups`, `audit_logs`.

Subsequent migrations add: `sessions`, `event_editor_grants`, `member_import_batches`, `member_import_rows`, `member_invite_tokens`, `password_reset_tokens`, `event_registration_overrides`, `registration_drafts`, `registration_reminder_preferences`, `registration_reminder_sends`, `event_alerts`, `notification_queue`, `notifications`, `notification_deliveries`, `event_revisions`, `event_revision_rollbacks`, `meeting_rsvp_tokens`, `meeting_planning_messages`, `event_internal_comments`, `event_documents`, `event_online_meetings`, `calendar_sync_connections`, `calendar_sync_oauth_states`, `calendar_sync_mappings`, `calendar_sync_failures`, `sms_notification_preferences`, `sms_delivery_logs`, `event_attendance`, `social_moderators`, `social_celebration_posts`, `member_roles`, `member_role_assignments`.

## Validation

The typecheck script (`npm run typecheck`) validates that the baseline migration creates the required core tables (`users`, `member_profiles`, `events`, `signups`, `audit_logs`). If you modify the baseline migration, ensure these table names and their `CREATE TABLE IF NOT EXISTS` statements remain intact.

## Running Migrations

```bash
npm run migrate
```

Migrations are idempotent — safe to run repeatedly. The `_migrations` tracking table ensures each file is applied at most once. After applying all migrations, it seeds the bootstrap admin user (`akeida` / `chief_admin`).

## Critical Rule

Never modify an already-applied migration file. Always create a new numbered migration to alter the schema.
