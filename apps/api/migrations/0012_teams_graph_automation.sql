CREATE TABLE IF NOT EXISTS event_online_meetings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'microsoft_teams_graph',
  organizer_upn TEXT NOT NULL,
  external_meeting_id TEXT NOT NULL,
  join_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_event_online_meetings_event
  ON event_online_meetings (event_id);
