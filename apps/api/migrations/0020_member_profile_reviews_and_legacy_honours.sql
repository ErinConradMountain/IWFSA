CREATE TABLE IF NOT EXISTS member_profile_public_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  requested_visibility_json TEXT NOT NULL,
  profile_snapshot_json TEXT NOT NULL,
  requested_field_keys_json TEXT NOT NULL,
  reviewer_note TEXT,
  reviewed_by_user_id INTEGER,
  submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_member_profile_public_submissions_status_submitted
  ON member_profile_public_submissions (status, submitted_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS honorary_member_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  honorary_title TEXT,
  organisation TEXT,
  citation TEXT,
  biography TEXT,
  linkedin_url TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER NOT NULL,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_honorary_member_entries_status_order
  ON honorary_member_entries (status, display_order ASC, updated_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS memorial_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  memorial_title TEXT,
  organisation TEXT,
  date_of_passing TEXT,
  tribute_text TEXT,
  biography TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by_user_id INTEGER NOT NULL,
  updated_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
  FOREIGN KEY (updated_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_memorial_entries_status_order
  ON memorial_entries (status, display_order ASC, updated_at DESC, id DESC);