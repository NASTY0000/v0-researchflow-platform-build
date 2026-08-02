-- ─────────────────────────────────────────────────────────────────────────────
-- RESEARCH IMPACT ANALYTICS MIGRATION
-- Run in Supabase SQL Editor
-- Corrected table names: research_ideas (not ideas),
--   connections uses requester_id/recipient_id
-- ─────────────────────────────────────────────────────────────────────────────

-- 1A: Profile view tracking
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profile_views_profile_id ON profile_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed_at  ON profile_views(viewed_at);

-- 1B: Idea view tracking (references research_ideas, not ideas)
CREATE TABLE IF NOT EXISTS idea_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES research_ideas(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_idea_views_idea_id  ON idea_views(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_views_viewed_at ON idea_views(viewed_at);

-- 1C: Analytics summary view
-- Uses correct table/column names for this codebase:
--   research_ideas (not ideas)
--   connections: requester_id / recipient_id
--   collaboration_interests: to_user_id
--   university_name (not university)
CREATE OR REPLACE VIEW researcher_analytics AS
SELECT
  p.id,
  p.full_name,
  p.university_name,
  p.akili_score,
  p.is_verified,

  COUNT(DISTINCT pv.id) FILTER (
    WHERE pv.viewed_at > now() - interval '30 days'
  ) AS profile_views_30d,

  COUNT(DISTINCT pv.id) FILTER (
    WHERE pv.viewed_at > now() - interval '7 days'
  ) AS profile_views_7d,

  COUNT(DISTINCT i.id)   AS ideas_count,
  COUNT(DISTINCT ir.id)  AS total_reactions,
  COUNT(DISTINCT ci.id)  AS collab_interests_received,

  COUNT(DISTINCT
    CASE WHEN c.requester_id = p.id THEN c.recipient_id
         WHEN c.recipient_id  = p.id THEN c.requester_id
    END
  ) AS network_size,

  COUNT(DISTINCT pr_given.id)    AS reviews_given,
  COUNT(DISTINCT pr_received.id) AS reviews_received

FROM profiles p
LEFT JOIN profile_views pv
  ON pv.profile_id = p.id
LEFT JOIN research_ideas i
  ON i.author_id = p.id
LEFT JOIN idea_reactions ir
  ON ir.idea_id = i.id
LEFT JOIN collaboration_interests ci
  ON ci.to_user_id = p.id
LEFT JOIN connections c
  ON (c.requester_id = p.id OR c.recipient_id = p.id)
  AND c.status = 'accepted'
LEFT JOIN peer_reviews pr_given
  ON pr_given.reviewer_id = p.id AND pr_given.status = 'completed'
LEFT JOIN peer_reviews pr_received
  ON pr_received.author_id = p.id AND pr_received.status = 'completed'
GROUP BY p.id;

-- 1D: RLS
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_views    ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile views" ON profile_views;
CREATE POLICY "Users can view own profile views"
  ON profile_views FOR SELECT
  USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Anyone can insert profile views" ON profile_views;
CREATE POLICY "Anyone can insert profile views"
  ON profile_views FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own idea views" ON idea_views;
CREATE POLICY "Users can view own idea views"
  ON idea_views FOR SELECT
  USING (
    idea_id IN (
      SELECT id FROM research_ideas WHERE author_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert idea views" ON idea_views;
CREATE POLICY "Anyone can insert idea views"
  ON idea_views FOR INSERT
  WITH CHECK (true);

-- NOTE: akili_score_events already exists and logs all Akili point events.
-- No new history table is needed, analytics queries use akili_score_events directly.
