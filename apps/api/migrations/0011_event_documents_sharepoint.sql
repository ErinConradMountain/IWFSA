CREATE TABLE IF NOT EXISTS event_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('agenda', 'minutes', 'attachment')),
  file_name TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  checksum_sha256 TEXT,
  sharepoint_site_id TEXT NOT NULL,
  sharepoint_drive_id TEXT NOT NULL,
  sharepoint_item_id TEXT NOT NULL,
  sharepoint_web_url TEXT,
  availability_mode TEXT NOT NULL DEFAULT 'immediate' CHECK (availability_mode IN ('immediate', 'after_event', 'scheduled')),
  available_from TEXT,
  uploaded_by_user_id INTEGER,
  removed_at TEXT,
  removed_by_user_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (removed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_event_documents_event_created
  ON event_documents (event_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_event_documents_event_removed
  ON event_documents (event_id, removed_at);
