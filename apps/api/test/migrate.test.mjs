import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runMigrations } from "../src/db/migrate.mjs";
import { openDatabase } from "../src/db/client.mjs";
import { BOOTSTRAP_ADMIN } from "../src/auth/bootstrap-admin.mjs";
import { hashPassword, verifyPassword } from "../src/auth/passwords.mjs";

test("runMigrations applies baseline exactly once", () => {
  const workingDirectory = mkdtempSync(path.join(tmpdir(), "iwfsa-migrate-"));
  const databasePath = path.join(workingDirectory, "test.db");

  try {
    const firstRun = runMigrations({ databasePath });
    const secondRun = runMigrations({ databasePath });

    assert.deepEqual(firstRun.appliedMigrations, [
      "0001_baseline.sql",
      "0002_auth_rbac.sql",
      "0003_member_imports.sql",
      "0004_member_invites.sql",
      "0005_registration_flow.sql",
      "0006_notifications_audit.sql",
      "0007_member_import_row_editing.sql",
      "0008_member_import_membership_set.sql",
      "0009_meeting_management.sql",
      "0010_event_collaboration.sql",
      "0011_event_documents_sharepoint.sql",
      "0012_teams_graph_automation.sql",
      "0013_calendar_sync.sql",
      "0014_phase4_communications_social_reports.sql",
      "0015_member_news.sql",
      "0016_member_news_pinning.sql",
      "0017_event_invitees.sql",
      "0018_membership_fees_data_model.sql",
      "0019_member_profile_visibility.sql",
      "0020_member_profile_directory_extras.sql",
      "0020_member_profile_reviews_and_legacy_honours.sql",
      "0021_site_settings.sql"
    ]);
    assert.equal(firstRun.bootstrapAdminCreated, true);
    assert.equal(firstRun.bootstrapAdminUsername, "akeida");

    assert.deepEqual(secondRun.appliedMigrations, []);
    assert.equal(secondRun.bootstrapAdminCreated, false);
    assert.equal(secondRun.bootstrapAdminUsername, "akeida");

    const database = openDatabase(databasePath);
    try {
      const tables = database
        .prepare(
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'events', 'signups', 'audit_logs', 'sessions', 'event_editor_grants', 'event_invitees', 'member_import_batches', 'member_import_rows', 'member_roles', 'member_role_assignments', 'member_invite_tokens', 'password_reset_tokens', 'event_registration_overrides', 'registration_drafts', 'registration_reminder_preferences', 'registration_reminder_sends', 'event_alerts', 'notification_queue', 'notifications', 'notification_deliveries', 'event_revisions', 'event_revision_rollbacks', 'meeting_rsvp_tokens', 'meeting_planning_messages', 'event_internal_comments', 'event_documents', 'event_online_meetings', 'calendar_sync_connections', 'calendar_sync_oauth_states', 'calendar_sync_mappings', 'calendar_sync_failures', 'sms_notification_preferences', 'sms_delivery_logs', 'event_attendance', 'social_moderators', 'social_celebration_posts', 'member_news_posts', 'membership_categories', 'member_category_assignments', 'membership_cycles', 'member_fee_accounts', 'member_fee_transactions', 'member_standing_audit', 'member_profile_public_submissions', 'honorary_member_entries', 'memorial_entries', 'site_settings')"
        )
        .all()
        .map((row) => row.name)
        .sort();

      assert.deepEqual(tables, [
        "audit_logs",
        "calendar_sync_connections",
        "calendar_sync_failures",
        "calendar_sync_mappings",
        "calendar_sync_oauth_states",
        "event_alerts",
        "event_attendance",
        "event_documents",
        "event_editor_grants",
        "event_internal_comments",
        "event_invitees",
        "event_online_meetings",
        "event_registration_overrides",
        "event_revision_rollbacks",
        "event_revisions",
        "events",
        "honorary_member_entries",
        "meeting_planning_messages",
        "meeting_rsvp_tokens",
        "member_category_assignments",
        "member_fee_accounts",
        "member_fee_transactions",
        "member_import_batches",
        "member_import_rows",
        "member_invite_tokens",
        "member_news_posts",
        "member_profile_public_submissions",
        "member_role_assignments",
        "member_roles",
        "member_standing_audit",
        "membership_categories",
        "membership_cycles",
        "memorial_entries",
        "notification_deliveries",
        "notification_queue",
        "notifications",
        "password_reset_tokens",
        "registration_drafts",
        "registration_reminder_preferences",
        "registration_reminder_sends",
        "sessions",
        "signups",
        "site_settings",
        "sms_delivery_logs",
        "sms_notification_preferences",
        "social_celebration_posts",
        "social_moderators",
        "users"
      ]);

      const adminUser = database
        .prepare("SELECT username, role, status, account_status AS accountStatus FROM users WHERE username = ?")
        .get("akeida");
      assert.equal(adminUser.username, "akeida");
      assert.equal(adminUser.role, "chief_admin");
      assert.equal(adminUser.status, "active");
      assert.equal(adminUser.accountStatus, "active");
    } finally {
      database.close();
    }
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("runMigrations restores the bootstrap admin credentials when they drift", () => {
  const workingDirectory = mkdtempSync(path.join(tmpdir(), "iwfsa-migrate-"));
  const databasePath = path.join(workingDirectory, "test.db");

  try {
    runMigrations({ databasePath });

    const database = openDatabase(databasePath);
    try {
      database
        .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE username = ?")
        .run(hashPassword("stale-password"), new Date().toISOString(), BOOTSTRAP_ADMIN.username);
    } finally {
      database.close();
    }

    const rerun = runMigrations({ databasePath });
    assert.equal(rerun.bootstrapAdminCreated, false);

    const repairedDatabase = openDatabase(databasePath);
    try {
      const adminUser = repairedDatabase
        .prepare("SELECT password_hash AS passwordHash FROM users WHERE username = ?")
        .get(BOOTSTRAP_ADMIN.username);

      assert.equal(verifyPassword(BOOTSTRAP_ADMIN.password, adminUser.passwordHash), true);
    } finally {
      repairedDatabase.close();
    }
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});
