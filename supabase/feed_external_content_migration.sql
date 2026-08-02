-- External content ingestion: sources + ingested items
-- Idempotent migration (safe to run multiple times)

-- ============================================================
-- feed_content_sources, registry of external feeds to poll
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_content_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  source_type TEXT NOT NULL DEFAULT 'rss', -- 'rss' | 'openalex' | 'arxiv'
  stream_category TEXT NOT NULL DEFAULT 'news', -- 'news' | 'publications' | 'opportunities' | 'discovery'
  research_areas TEXT[] DEFAULT '{}',
  fetch_config JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_fetched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_content_sources_active
  ON feed_content_sources (is_active, source_type, last_fetched_at);

-- ============================================================
-- feed_external_content, ingested items surfaced in the feed
-- ============================================================
CREATE TABLE IF NOT EXISTS feed_external_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES feed_content_sources(id) ON DELETE SET NULL,
  category TEXT NOT NULL DEFAULT 'news', -- 'news' | 'publications' | 'opportunities' | 'discovery'
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  authors TEXT[] DEFAULT '{}',
  journal TEXT,
  citation_count INTEGER,
  research_areas TEXT[] DEFAULT '{}',
  is_african_relevant BOOLEAN NOT NULL DEFAULT false,
  deadline TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  raw_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_external_content_category
  ON feed_external_content (category, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_external_content_areas
  ON feed_external_content USING GIN (research_areas);

CREATE INDEX IF NOT EXISTS idx_feed_external_content_expires
  ON feed_external_content (expires_at);

-- ============================================================
-- RLS, read-only for authenticated users, writes via service role
-- ============================================================
ALTER TABLE feed_content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_external_content ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feed_content_sources' AND policyname = 'feed_content_sources_select_authenticated'
  ) THEN
    CREATE POLICY feed_content_sources_select_authenticated
      ON feed_content_sources FOR SELECT
      TO authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'feed_external_content' AND policyname = 'feed_external_content_select_authenticated'
  ) THEN
    CREATE POLICY feed_external_content_select_authenticated
      ON feed_external_content FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ============================================================
-- extract_research_areas_from_text, naive keyword matcher
-- Maps free text to known research areas via adjacency table
-- (falls back to an empty array if no matches found)
-- ============================================================
CREATE OR REPLACE FUNCTION extract_research_areas_from_text(p_text TEXT)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_areas TEXT[];
BEGIN
  IF p_text IS NULL OR length(trim(p_text)) = 0 THEN
    RETURN '{}';
  END IF;

  SELECT array_agg(DISTINCT area) INTO v_areas
  FROM (
    SELECT DISTINCT area_a AS area FROM research_area_adjacency
    WHERE p_text ILIKE '%' || area_a || '%'
    UNION
    SELECT DISTINCT area_b AS area FROM research_area_adjacency
    WHERE p_text ILIKE '%' || area_b || '%'
  ) matches;

  RETURN COALESCE(v_areas, '{}');
END;
$$;

-- ============================================================
-- Seed: a small set of well-known RSS sources to start ingestion
-- ============================================================
INSERT INTO feed_content_sources (name, url, source_type, stream_category, research_areas, fetch_config)
VALUES
  ('Nature News', 'https://www.nature.com/nature.rss', 'rss', 'news', '{}', '{}'),
  ('Science Magazine News', 'https://www.science.org/action/showFeed?type=etoc&feed=rss&jc=science', 'rss', 'news', '{}', '{}'),
  ('arXiv CS Recent', 'https://export.arxiv.org/rss/cs', 'rss', 'publications', '{"Computer Science"}', '{}'),
  ('arXiv Physics Recent', 'https://export.arxiv.org/rss/physics', 'rss', 'publications', '{"Physics"}', '{}'),
  ('PLOS ONE', 'https://journals.plos.org/plosone/feed/atom', 'rss', 'publications', '{}', '{}')
ON CONFLICT (url) DO NOTHING;
