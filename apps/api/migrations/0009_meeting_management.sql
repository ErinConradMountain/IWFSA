CREATE TABLE IF NOT EXISTS meeting_rsvp_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT NOT NULL UNIQUE,
  event_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_by_user_id INTEGER,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS meeting_planning_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  sender_user_id INTEGER,
  audience_scope TEXT NOT NULL CHECK (audience_scope IN ('all_invited', 'confirmed_only', 'waitlisted_only', 'pending_only')),
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_meeting_rsvp_tokens_event_user
  ON meeting_rsvp_tokens (event_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_meeting_planning_messages_event_created
  ON meeting_planning_messages (event_id, created_at DESC);
