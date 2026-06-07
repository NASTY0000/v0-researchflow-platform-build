-- Phase 2: extends feed_external_content for video/post-style sources
-- (Reddit, YouTube). Idempotent.

ALTER TABLE feed_external_content
  ADD COLUMN IF NOT EXISTS content_type TEXT NOT NULL DEFAULT 'article',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS source_name TEXT,
  ADD COLUMN IF NOT EXISTS relevance_signals JSONB DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_feed_external_content_content_type
  ON feed_external_content (content_type);
