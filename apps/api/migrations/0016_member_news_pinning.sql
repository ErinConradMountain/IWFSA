ALTER TABLE member_news_posts
  ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0 CHECK (is_pinned IN (0, 1));

ALTER TABLE member_news_posts
  ADD COLUMN pinned_at TEXT;

CREATE INDEX IF NOT EXISTS idx_member_news_posts_pin_order
  ON member_news_posts (status, is_pinned DESC, pinned_at DESC, published_at DESC, created_at DESC);
