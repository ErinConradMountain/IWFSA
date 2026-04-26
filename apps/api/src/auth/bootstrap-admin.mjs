import { hashPassword } from "./passwords.mjs";

// Temporary bootstrap credentials requested for local development.
export const BOOTSTRAP_ADMIN = Object.freeze({
  username: "akeida",
  password: "1possibility",
  email: "akeida@iwfsa.local",
  role: "chief_admin"
});

export function ensureBootstrapAdmin(database) {
  const now = new Date().toISOString();
  const existingAdmin = database
    .prepare("SELECT id FROM users WHERE username = ? LIMIT 1")
    .get(BOOTSTRAP_ADMIN.username);

  if (existingAdmin) {
    // Keep the temporary admin account usable even if a prior database snapshot
    // contains an older password hash or role metadata.
    database
      .prepare(
        `
        UPDATE users
        SET username = ?,
            email = ?,
            password_hash = ?,
            role = ?,
            account_status = 'active',
            status = 'active',
            must_change_password = 0,
            must_change_username = 0,
            updated_at = ?
        WHERE id = ?
      `
      )
      .run(
        BOOTSTRAP_ADMIN.username,
        BOOTSTRAP_ADMIN.email,
        hashPassword(BOOTSTRAP_ADMIN.password),
        BOOTSTRAP_ADMIN.role,
        now,
        existingAdmin.id
      );

    return { created: false, updated: true, username: BOOTSTRAP_ADMIN.username };
  }

  const passwordHash = hashPassword(BOOTSTRAP_ADMIN.password);

  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, account_status, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', 'active', ?, ?)
    `
    )
    .run(
      BOOTSTRAP_ADMIN.username,
      BOOTSTRAP_ADMIN.email,
      passwordHash,
      BOOTSTRAP_ADMIN.role,
      now,
      now
    );

  return { created: true, updated: false, username: BOOTSTRAP_ADMIN.username };
}
