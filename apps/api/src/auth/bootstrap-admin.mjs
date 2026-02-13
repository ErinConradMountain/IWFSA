import { hashPassword } from "./passwords.mjs";

// Temporary bootstrap credentials requested for local development.
export const BOOTSTRAP_ADMIN = Object.freeze({
  username: "akeida",
  password: "akeida123",
  email: "akeida@iwfsa.local",
  role: "chief_admin"
});

export function ensureBootstrapAdmin(database) {
  const existingAdmin = database
    .prepare("SELECT id FROM users WHERE username = ? LIMIT 1")
    .get(BOOTSTRAP_ADMIN.username);

  if (existingAdmin) {
    return { created: false, username: BOOTSTRAP_ADMIN.username };
  }

  const now = new Date().toISOString();
  const passwordHash = hashPassword(BOOTSTRAP_ADMIN.password);

  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
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

  return { created: true, username: BOOTSTRAP_ADMIN.username };
}
