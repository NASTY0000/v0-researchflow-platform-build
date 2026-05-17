-- ============================================================
-- Akili Score Migration
-- Run this in your Supabase SQL Editor (or via Supabase CLI)
-- ============================================================

-- 1. Add akili score columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS akili_score                   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS akili_dimension_knowledge     INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS akili_dimension_collaboration INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS akili_dimension_mentorship    INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS akili_dimension_technical     INTEGER DEFAULT 0;

-- 2. Create akili_score_events table
CREATE TABLE IF NOT EXISTS akili_score_events (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type    TEXT        NOT NULL,
  points_earned INTEGER     NOT NULL,
  description   TEXT,
  related_id    UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_akili_events_user_id    ON akili_score_events(user_id);
CREATE INDEX IF NOT EXISTS idx_akili_events_created_at ON akili_score_events(created_at DESC);

-- 3. Enable RLS
ALTER TABLE akili_score_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score events"
  ON akili_score_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own score events"
  ON akili_score_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Optional: award_akili_points SQL function (atomic alternative to the TS approach)
CREATE OR REPLACE FUNCTION award_akili_points(
  p_user_id    UUID,
  p_event_type TEXT,
  p_points     INTEGER,
  p_description TEXT,
  p_related_id  UUID DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_dimension TEXT;
BEGIN
  v_dimension := CASE
    WHEN p_event_type IN (
      'postResearchIdea','ideaAttracts3Applicants','ideaFormsActiveTeam',
      'completeLiteratureReview','submitToShowcase','showcaseApproved','showcaseDownloaded25Times'
    ) THEN 'knowledge'
    WHEN p_event_type IN (
      'joinProjectAsCollaborator','completeAssignedTask','completeAllTasksInProject',
      'receive4to5StarRatingFromLead','collaboratedProjectReachesShowcase',
      'completeMarketplaceTask','receive4to5StarOnMarketplaceTask'
    ) THEN 'collaboration'
    WHEN p_event_type IN (
      'acceptMentorshipRequest','completeMentorSession','menteeCompletesPhase',
      'receive4to5StarSessionRating','menteeSubmitsToShowcase','postOpenResearchCall','menteeEarnsExpertStatus'
    ) THEN 'mentorship'
    ELSE 'technical'
  END;

  INSERT INTO akili_score_events(user_id, event_type, points_earned, description, related_id)
  VALUES (p_user_id, p_event_type, p_points, p_description, p_related_id);

  EXECUTE format(
    'UPDATE profiles SET akili_score = akili_score + $1, akili_dimension_%s = akili_dimension_%s + $1 WHERE id = $2',
    v_dimension, v_dimension
  ) USING p_points, p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
