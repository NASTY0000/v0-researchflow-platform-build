-- ─── Personalised Research Feed Migration ───────────────────────────────────
-- Run this entire block in Supabase SQL Editor

-- 1. Research area adjacency graph
CREATE TABLE IF NOT EXISTS research_area_adjacency (
  id               UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  area_a           TEXT    NOT NULL,
  area_b           TEXT    NOT NULL,
  similarity_score FLOAT   NOT NULL DEFAULT 0.5,
  UNIQUE(area_a, area_b)
);

INSERT INTO research_area_adjacency (area_a, area_b, similarity_score) VALUES
  ('Public Health','Epidemiology',0.95),
  ('Public Health','Community Health',0.90),
  ('Public Health','Global Health',0.88),
  ('Public Health','Health Informatics',0.75),
  ('Epidemiology','Biostatistics',0.85),
  ('Medicine','Pharmacology',0.80),
  ('Medicine','Physiology',0.82),
  ('Anatomy','Physiology',0.90),
  ('Biochemistry','Molecular Biology',0.92),
  ('Biochemistry','Genetics',0.88),
  ('Microbiology','Immunology',0.90),
  ('Microbiology','Infectious Disease',0.92),
  ('Biology','Biochemistry',0.85),
  ('Biology','Genetics',0.82),
  ('Chemistry','Biochemistry',0.80),
  ('Chemistry','Pharmacology',0.75),
  ('Physics','Mathematics',0.85),
  ('Statistics','Mathematics',0.90),
  ('Statistics','Data Science',0.92),
  ('Computer Science','Data Science',0.90),
  ('Computer Science','AI',0.88),
  ('Data Science','Machine Learning',0.95),
  ('AI','Machine Learning',0.98),
  ('Software Engineering','Computer Science',0.92),
  ('Cybersecurity','Computer Science',0.85),
  ('Economics','Finance',0.88),
  ('Economics','Development Studies',0.82),
  ('Sociology','Psychology',0.75),
  ('Political Science','International Relations',0.88),
  ('Education','Psychology',0.72),
  ('Biomedical Engineering','Medicine',0.78),
  ('Biomedical Engineering','Engineering',0.85),
  ('Environmental Engineering','Environmental Science',0.90),
  ('Chemical Engineering','Chemistry',0.82),
  ('Data Science','Public Health',0.70),
  ('Statistics','Epidemiology',0.82),
  ('Computer Science','Health Informatics',0.78),
  ('AI','Medicine',0.68)
ON CONFLICT (area_a, area_b) DO NOTHING;

-- Mirror: make bidirectional
INSERT INTO research_area_adjacency (area_a, area_b, similarity_score)
SELECT area_b, area_a, similarity_score
FROM research_area_adjacency
ON CONFLICT (area_a, area_b) DO NOTHING;

-- 2. User interest weights
CREATE TABLE IF NOT EXISTS user_interest_weights (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  research_area     TEXT        NOT NULL,
  explicit_weight   FLOAT       DEFAULT 1.0,
  behavioural_weight FLOAT      DEFAULT 0.0,
  combined_weight   FLOAT       GENERATED ALWAYS AS (explicit_weight + behavioural_weight) STORED,
  last_updated      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, research_area)
);

CREATE INDEX IF NOT EXISTS idx_user_interest_weights_user ON user_interest_weights(user_id);

-- 3. Feed engagement events
CREATE TABLE IF NOT EXISTS feed_engagement_events (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                 UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type            TEXT        NOT NULL,
  content_id              UUID        NOT NULL,
  event_type              TEXT        NOT NULL,
  content_tags            TEXT[]      DEFAULT '{}',
  content_research_areas  TEXT[]      DEFAULT '{}',
  session_context         JSONB       DEFAULT '{}',
  created_at              TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_events_user_time ON feed_engagement_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_events_content   ON feed_engagement_events(content_type, content_id);

-- 4. Feed score cache
CREATE TABLE IF NOT EXISTS feed_score_cache (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_type        TEXT        NOT NULL,
  content_id          UUID        NOT NULL,
  score               FLOAT       NOT NULL DEFAULT 0,
  score_breakdown     JSONB       DEFAULT '{}',
  is_diversity_inject BOOLEAN     DEFAULT false,
  expires_at          TIMESTAMPTZ NOT NULL,
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_type, content_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_cache_user_score ON feed_score_cache(user_id, score DESC, expires_at);

-- 5. User feed preferences
CREATE TABLE IF NOT EXISTS user_feed_preferences (
  user_id           UUID        PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  diversity_level   FLOAT       DEFAULT 0.15,
  show_projects     BOOLEAN     DEFAULT true,
  show_grants       BOOLEAN     DEFAULT true,
  show_mentors      BOOLEAN     DEFAULT true,
  show_ideas        BOOLEAN     DEFAULT true,
  show_challenges   BOOLEAN     DEFAULT true,
  show_open_calls   BOOLEAN     DEFAULT true,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_interest_weights    ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_engagement_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_score_cache         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feed_preferences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_area_adjacency  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_interest_weights'   AND policyname='Users own their weights') THEN
    CREATE POLICY "Users own their weights"   ON user_interest_weights   FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_engagement_events'  AND policyname='Users own their events')  THEN
    CREATE POLICY "Users own their events"    ON feed_engagement_events  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='feed_score_cache'        AND policyname='Users own their cache')   THEN
    CREATE POLICY "Users own their cache"     ON feed_score_cache        FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_feed_preferences'   AND policyname='Users own their prefs')   THEN
    CREATE POLICY "Users own their prefs"     ON user_feed_preferences   FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='research_area_adjacency' AND policyname='Adjacency readable')      THEN
    CREATE POLICY "Adjacency readable"        ON research_area_adjacency FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- 6. increment_interest_weight helper function
CREATE OR REPLACE FUNCTION increment_interest_weight(
  p_user_id  UUID,
  p_area     TEXT,
  p_increment FLOAT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_interest_weights
  SET
    behavioural_weight = LEAST(behavioural_weight + p_increment, 2.0),
    last_updated = now()
  WHERE user_id = p_user_id AND research_area = p_area;
END;
$$;
