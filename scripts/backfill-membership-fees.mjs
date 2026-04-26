import process from "node:process";
import { loadEnvFile } from "../apps/common/load-env.mjs";
import { getApiConfig } from "../apps/api/src/env.mjs";
import { runMigrations } from "../apps/api/src/db/migrate.mjs";
import { openDatabase } from "../apps/api/src/db/client.mjs";

function parseCliArgs(argv) {
  const options = {
    year: null,
    dueDate: null,
    amountDue: null,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = String(argv[index] || "").trim();
    if (!value) continue;
    if (value === "--help" || value === "-h") {
      options.help = true;
      continue;
    }
    if (value.startsWith("--year=")) {
      options.year = value.slice("--year=".length).trim();
      continue;
    }
    if (value === "--year" && argv[index + 1]) {
      options.year = String(argv[index + 1]).trim();
      index += 1;
      continue;
    }
    if (value.startsWith("--due-date=")) {
      options.dueDate = value.slice("--due-date=".length).trim();
      continue;
    }
    if (value === "--due-date" && argv[index + 1]) {
      options.dueDate = String(argv[index + 1]).trim();
      index += 1;
      continue;
    }
    if (value.startsWith("--amount-due=")) {
      options.amountDue = value.slice("--amount-due=".length).trim();
      continue;
    }
    if (value === "--amount-due" && argv[index + 1]) {
      options.amountDue = String(argv[index + 1]).trim();
      index += 1;
      continue;
    }
  }

  return options;
}

function printHelp() {
  console.log("Usage: node scripts/backfill-membership-fees.mjs [options]");
  console.log("");
  console.log("Options:");
  console.log("  --year <YYYY>         Membership cycle year (default: current year)");
  console.log("  --due-date <YYYY-MM-DD>  Cycle due date (default: <year>-03-31)");
  console.log("  --amount-due <number> Default amount_due for seeded accounts (default: 0)");
  console.log("  --help, -h            Show this help text");
}

function parseYear(value, fallbackYear) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallbackYear;
  }
  const parsed = Number.parseInt(String(value).trim(), 10);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    throw new Error("year must be an integer between 2000 and 2100.");
  }
  return parsed;
}

function parseDueDate(value, cycleYear) {
  const candidate = String(value || "").trim() || `${cycleYear}-03-31`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new Error("due-date must be in YYYY-MM-DD format.");
  }
  const parsed = new Date(`${candidate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== candidate) {
    throw new Error("due-date is not a valid calendar date.");
  }
  return candidate;
}

function parseAmountDue(value) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return 0;
  }
  const parsed = Number(String(value).trim());
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("amount-due must be a number greater than or equal to 0.");
  }
  return Number(parsed);
}

function ensureDefaultMembershipCategory(database) {
  const existingDefault = database
    .prepare(
      `
      SELECT id, name
      FROM membership_categories
      WHERE is_default = 1
      ORDER BY id ASC
      LIMIT 1
    `
    )
    .get();
  if (existingDefault) {
    return {
      id: Number(existingDefault.id),
      name: String(existingDefault.name || "Active Member"),
      created: false,
      promoted: false
    };
  }

  const activeMemberCategory = database
    .prepare(
      `
      SELECT id, name
      FROM membership_categories
      WHERE lower(name) = lower('Active Member')
      ORDER BY id ASC
      LIMIT 1
    `
    )
    .get();

  if (activeMemberCategory) {
    database
      .prepare(
        `
        UPDATE membership_categories
        SET is_default = 1, is_active = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(activeMemberCategory.id);
    return {
      id: Number(activeMemberCategory.id),
      name: String(activeMemberCategory.name || "Active Member"),
      created: false,
      promoted: true
    };
  }

  const insert = database
    .prepare(
      `
      INSERT INTO membership_categories (name, is_default, is_active, created_at, updated_at)
      VALUES ('Active Member', 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    )
    .run();
  return {
    id: Number(insert.lastInsertRowid),
    name: "Active Member",
    created: true,
    promoted: false
  };
}

function ensureOpenCycle(database, { membershipYear, dueDate }) {
  const closeOpenResult = database
    .prepare(
      `
      UPDATE membership_cycles
      SET status = 'closed', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'open' AND membership_year != ?
    `
    )
    .run(membershipYear);
  const closedOpenCycles = Number(closeOpenResult.changes || 0);

  const existing = database
    .prepare(
      `
      SELECT id
      FROM membership_cycles
      WHERE membership_year = ?
      LIMIT 1
    `
    )
    .get(membershipYear);

  let created = false;
  if (existing) {
    database
      .prepare(
        `
        UPDATE membership_cycles
        SET due_date = ?, status = 'open', updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(dueDate, existing.id);
  } else {
    database
      .prepare(
        `
        INSERT INTO membership_cycles (membership_year, due_date, status, created_at, updated_at)
        VALUES (?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(membershipYear, dueDate);
    created = true;
  }

  const cycle = database
    .prepare(
      `
      SELECT
        id,
        membership_year AS membershipYear,
        due_date AS dueDate,
        status
      FROM membership_cycles
      WHERE membership_year = ?
      LIMIT 1
    `
    )
    .get(membershipYear);

  return {
    id: Number(cycle.id),
    membershipYear: Number(cycle.membershipYear),
    dueDate: String(cycle.dueDate),
    status: String(cycle.status || "open"),
    created,
    closedOpenCycles
  };
}

function seedMemberFeeAccounts(database, { membershipCycleId, amountDue }) {
  const result = database
    .prepare(
      `
      INSERT INTO member_fee_accounts (
        user_id,
        membership_cycle_id,
        amount_due,
        amount_paid,
        balance,
        payment_status,
        standing_status,
        access_status,
        created_at,
        updated_at
      )
      SELECT
        users.id,
        ?,
        ?,
        0,
        ?,
        'pending_review',
        'pending_review',
        'enabled',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM users
      WHERE users.role = 'member'
        AND users.account_status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM member_fee_accounts existing
          WHERE existing.user_id = users.id
            AND existing.membership_cycle_id = ?
        )
    `
    )
    .run(membershipCycleId, amountDue, amountDue, membershipCycleId);
  return Number(result.changes || 0);
}

function seedCategoryAssignments(database, { defaultCategoryId }) {
  const result = database
    .prepare(
      `
      INSERT INTO member_category_assignments (
        user_id,
        membership_category_id,
        starts_at,
        created_at,
        updated_at
      )
      SELECT
        users.id,
        ?,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      FROM users
      WHERE users.role = 'member'
        AND users.account_status = 'active'
        AND NOT EXISTS (
          SELECT 1
          FROM member_category_assignments existing
          WHERE existing.user_id = users.id
            AND existing.ends_at IS NULL
        )
    `
    )
    .run(defaultCategoryId);
  return Number(result.changes || 0);
}

function countActiveMembers(database) {
  const row = database
    .prepare(
      `
      SELECT COUNT(*) AS total
      FROM users
      WHERE role = 'member' AND account_status = 'active'
    `
    )
    .get();
  return Number(row?.total || 0);
}

function selectAuditActor(database) {
  const row = database
    .prepare(
      `
      SELECT id, username, role
      FROM users
      WHERE role IN ('chief_admin', 'admin')
      ORDER BY
        CASE
          WHEN role = 'chief_admin' THEN 0
          WHEN role = 'admin' THEN 1
          ELSE 2
        END ASC,
        id ASC
      LIMIT 1
    `
    )
    .get();
  if (!row) {
    return null;
  }
  return {
    id: Number(row.id),
    username: String(row.username || ""),
    role: String(row.role || "")
  };
}

function runBackfill(database, options) {
  const actor = selectAuditActor(database);
  const defaultCategory = ensureDefaultMembershipCategory(database);
  const cycle = ensureOpenCycle(database, {
    membershipYear: options.membershipYear,
    dueDate: options.dueDate
  });
  const activeMembers = countActiveMembers(database);
  const seededFeeAccounts = seedMemberFeeAccounts(database, {
    membershipCycleId: cycle.id,
    amountDue: options.defaultAmountDue
  });
  const seededCategoryAssignments = seedCategoryAssignments(database, {
    defaultCategoryId: defaultCategory.id
  });

  if (actor) {
    database
      .prepare(
        `
        INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
        VALUES (?, 'membership_fee_backfill_seeded', 'membership_cycle', ?, ?)
      `
      )
      .run(
        actor.id,
        String(cycle.id),
        JSON.stringify({
          membershipYear: cycle.membershipYear,
          dueDate: cycle.dueDate,
          cycleCreated: cycle.created,
          closedOpenCycles: cycle.closedOpenCycles,
          activeMembers,
          seededFeeAccounts,
          seededCategoryAssignments,
          defaultCategoryId: defaultCategory.id,
          defaultCategoryName: defaultCategory.name,
          defaultAmountDue: options.defaultAmountDue
        })
      );
  }

  return {
    actor,
    cycle,
    defaultCategory,
    activeMembers,
    seededFeeAccounts,
    seededCategoryAssignments
  };
}

function main() {
  const args = parseCliArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  loadEnvFile();
  const config = getApiConfig();
  const now = new Date();
  const membershipYear = parseYear(args.year, now.getFullYear());
  const dueDate = parseDueDate(args.dueDate, membershipYear);
  const defaultAmountDue = parseAmountDue(args.amountDue);

  const migrationResult = runMigrations({ databasePath: config.databasePath });
  const database = openDatabase(config.databasePath);

  try {
    database.exec("BEGIN");
    let summary = null;
    try {
      summary = runBackfill(database, {
        membershipYear,
        dueDate,
        defaultAmountDue
      });
      database.exec("COMMIT");
    } catch (error) {
      database.exec("ROLLBACK");
      throw error;
    }

    const migrationSummary =
      migrationResult.appliedMigrations.length === 0
        ? "No pending migrations."
        : `Applied migrations: ${migrationResult.appliedMigrations.join(", ")}`;

    console.log("membership-fees backfill complete");
    console.log(`Database: ${config.databasePath}`);
    console.log(migrationSummary);
    console.log(
      `Cycle: ${summary.cycle.membershipYear} (id=${summary.cycle.id}, due=${summary.cycle.dueDate}, status=${summary.cycle.status})`
    );
    console.log(
      `Cycle created: ${summary.cycle.created ? "yes" : "no"} | Other open cycles closed: ${summary.cycle.closedOpenCycles}`
    );
    console.log(
      `Default category: ${summary.defaultCategory.name} (id=${summary.defaultCategory.id}, created=${summary.defaultCategory.created ? "yes" : "no"}, promoted=${summary.defaultCategory.promoted ? "yes" : "no"})`
    );
    console.log(`Active members reviewed: ${summary.activeMembers}`);
    console.log(`Seeded fee accounts: ${summary.seededFeeAccounts}`);
    console.log(`Seeded category assignments: ${summary.seededCategoryAssignments}`);
    console.log(`Default amount due used for seeded accounts: ${defaultAmountDue.toFixed(2)}`);
    if (summary.actor) {
      console.log(`Audit actor: ${summary.actor.username} (${summary.actor.role})`);
    } else {
      console.log("Audit actor: none found (audit row skipped)");
    }
  } finally {
    database.close();
  }
}

try {
  main();
} catch (error) {
  console.error("membership-fees backfill failed:", error.message || error);
  process.exitCode = 1;
}
