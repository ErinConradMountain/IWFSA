CREATE TABLE IF NOT EXISTS sms_notification_preferences (
  user_id INTEGER PRIMARY KEY,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  phone_number TEXT,
  daily_limit INTEGER NOT NULL DEFAULT 3 CHECK (daily_limit BETWEEN 1 AND 20),
  per_event_limit INTEGER NOT NULL DEFAULT 1 CHECK (per_event_limit BETWEEN 1 AND 5),
  quiet_hours_start TEXT NOT NULL DEFAULT '21:00',
  quiet_hours_end TEXT NOT NULL DEFAULT '07:00',
  allow_urgent INTEGER NOT NULL DEFAULT 1 CHECK (allow_urgent IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sms_delivery_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  event_id INTEGER,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'blocked', 'failed')),
  phone_number TEXT,
  message_excerpt TEXT,
  blocked_reason TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_user_created
  ON sms_delivery_logs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_status_created
  ON sms_delivery_logs (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sms_delivery_logs_user_event
  ON sms_delivery_logs (user_id, event_id, created_at DESC);

CREATE TABLE IF NOT EXISTS event_attendance (
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('attended', 'absent', 'excused')),
  marked_by_user_id INTEGER,
  marked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (event_id, user_id),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_attendance_event_status
  ON event_attendance (event_id, attendance_status);

CREATE TABLE IF NOT EXISTS social_moderators (
  user_id INTEGER PRIMARY KEY,
  assigned_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS social_celebration_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_user_id INTEGER NOT NULL,
  body_text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at TEXT,
  removed_by_user_id INTEGER,
  removed_reason TEXT,
  FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (removed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_celebration_posts_created
  ON social_celebration_posts (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_social_celebration_posts_removed
  ON social_celebration_posts (removed_at, created_at DESC);

ALTER TABLE event_documents ADD COLUMN published_at TEXT;
ALTER TABLE event_documents ADD COLUMN published_by_user_id INTEGER;
ALTER TABLE event_documents ADD COLUMN member_access_scope TEXT NOT NULL DEFAULT 'all_visible'
  CHECK (member_access_scope IN ('all_visible', 'invited_attended'));

UPDATE event_documents
SET
  published_at = COALESCE(published_at, created_at),
  published_by_user_id = COALESCE(published_by_user_id, uploaded_by_user_id),
  member_access_scope = COALESCE(member_access_scope, 'all_visible');

CREATE INDEX IF NOT EXISTS idx_event_documents_event_published
  ON event_documents (event_id, published_at, member_access_scope);
