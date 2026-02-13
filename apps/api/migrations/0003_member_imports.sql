ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN must_change_username INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN desired_status TEXT NOT NULL DEFAULT 'active' CHECK (desired_status IN ('active', 'suspended'));

CREATE TABLE IF NOT EXISTS member_import_batches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT NOT NULL UNIQUE,
  created_by_user_id INTEGER,
  source_filename TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('create_only', 'create_or_update')),
  default_status TEXT NOT NULL CHECK (default_status IN ('active', 'suspended')),
  username_policy TEXT NOT NULL CHECK (username_policy IN ('from_column_or_generate', 'generate_random')),
  activation_policy TEXT NOT NULL CHECK (activation_policy IN ('password_change_required', 'password_and_username_personalization_required')),
  invite_policy TEXT NOT NULL CHECK (invite_policy IN ('none', 'queue_on_apply')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'applied')),
  total_rows INTEGER NOT NULL,
  create_count INTEGER NOT NULL,
  update_count INTEGER NOT NULL,
  skip_count INTEGER NOT NULL,
  error_count INTEGER NOT NULL,
  blocking_issue_count INTEGER NOT NULL,
  has_blocking_issues INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  applied_at TEXT,
  applied_by_user_id INTEGER,
  invites_queued INTEGER NOT NULL DEFAULT 0,
  invites_failed INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (applied_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS member_import_rows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT NOT NULL,
  row_number INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'skip', 'error')),
  reason_code TEXT,
  email TEXT,
  username TEXT,
  full_name TEXT,
  status TEXT,
  organisation TEXT,
  groups_csv TEXT,
  roles_csv TEXT,
  data_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (batch_id) REFERENCES member_import_batches(batch_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS member_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS member_role_assignments (
  role_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, user_id),
  FOREIGN KEY (role_id) REFERENCES member_roles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
