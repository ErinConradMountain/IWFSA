import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { runMigrations } from "../src/db/migrate.mjs";
import { openDatabase } from "../src/db/client.mjs";

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
      "0010_event_collaboration.sql"
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
          "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('users', 'events', 'signups', 'audit_logs', 'sessions', 'event_editor_grants', 'member_import_batches', 'member_import_rows', 'member_roles', 'member_role_assignments', 'member_invite_tokens', 'password_reset_tokens', 'event_registration_overrides', 'registration_drafts', 'registration_reminder_preferences', 'registration_reminder_sends', 'event_alerts', 'notification_queue', 'notifications', 'notification_deliveries', 'event_revisions', 'event_revision_rollbacks', 'meeting_rsvp_tokens', 'meeting_planning_messages', 'event_internal_comments')"
        )
        .all()
        .map((row) => row.name)
        .sort();

      assert.deepEqual(tables, [
        "audit_logs",
        "event_alerts",
        "event_editor_grants",
        "event_internal_comments",
        "event_registration_overrides",
        "event_revision_rollbacks",
        "event_revisions",
        "events",
        "meeting_planning_messages",
        "meeting_rsvp_tokens",
        "member_import_batches",
        "member_import_rows",
        "member_invite_tokens",
        "member_role_assignments",
        "member_roles",
        "notification_deliveries",
        "notification_queue",
        "notifications",
        "password_reset_tokens",
        "registration_drafts",
        "registration_reminder_preferences",
        "registration_reminder_sends",
        "sessions",
        "signups",
        "users"
      ]);

      const adminUser = database
        .prepare("SELECT username, role, status FROM users WHERE username = ?")
        .get("akeida");
      assert.equal(adminUser.username, "akeida");
      assert.equal(adminUser.role, "chief_admin");
      assert.equal(adminUser.status, "active");
    } finally {
      database.close();
    }
  } finally {
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});
