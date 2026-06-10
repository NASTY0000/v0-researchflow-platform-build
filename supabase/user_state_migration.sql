-- ============================================================
-- Canonical User State Migration
-- Run this in your Supabase SQL Editor (or via Supabase CLI)
--
-- Creates a single source of truth for:
--   - Akili score + dimensional breakdown + tier
--   - Profile completion percentage
--   - Verification status (institutional + mentor)
-- via the get_user_state(p_user_id) RPC function.
-- ============================================================

-- ------------------------------------------------------------
-- STEP 1 — Akili tiers config table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS akili_tiers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  min_points INT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#7C3AED'
);

INSERT INTO akili_tiers (name, slug, min_points, description)
VALUES
  ('Emerging Researcher', 'emerging', 0,
   'Just beginning the research journey on ResearchFlow'),
  ('Scholar Researcher', 'scholar', 200,
   'Actively engaging with research on the platform'),
  ('Research Fellow', 'fellow', 700,
   'Consistently contributing to the research community'),
  ('Senior Investigator', 'investigator', 1500,
   'A recognised research contributor'),
  ('Principal Researcher', 'principal', 3000,
   'An expert and leader in research on ResearchFlow')
ON CONFLICT (slug) DO NOTHING;

-- ------------------------------------------------------------
-- STEP 2/3 — get_user_state RPC
--
-- Note: the akili dimension columns on `profiles` are named
--   akili_dimension_knowledge / akili_dimension_collaboration /
--   akili_dimension_mentorship / akili_dimension_technical
-- (see supabase/akili_score_migration.sql), not akili_knowledge etc.
--
-- Profile completion is computed from 7 real `profiles` columns:
--   full_name, bio, avatar_url, research_interests,
--   university_id, department, academic_level
-- ("faculty" / "level" do not exist on profiles — they are
-- `department` and `academic_level`).
--
-- "Email verified" maps to profiles.is_verified, which is the
-- same flag the "Verify your university email" prompt already
-- checks (institutional verification). Mentor verification is
-- read from mentor_profiles.is_verified.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_user_state(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_akili_score INT;
  v_knowledge INT;
  v_collaboration INT;
  v_mentorship INT;
  v_technical INT;
  v_current_tier akili_tiers%ROWTYPE;
  v_next_tier akili_tiers%ROWTYPE;
  v_is_mentor_verified BOOLEAN;
  v_is_email_verified BOOLEAN;
  v_completion_pct INT;
  v_missing_fields TEXT[];
BEGIN
  -- Get profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN '{}'::JSONB;
  END IF;

  -- Akili total + dimensional scores
  v_akili_score   := COALESCE(v_profile.akili_score, 0);
  v_knowledge     := COALESCE(v_profile.akili_dimension_knowledge, 0);
  v_collaboration := COALESCE(v_profile.akili_dimension_collaboration, 0);
  v_mentorship    := COALESCE(v_profile.akili_dimension_mentorship, 0);
  v_technical     := COALESCE(v_profile.akili_dimension_technical, 0);

  -- Current tier
  SELECT * INTO v_current_tier
  FROM akili_tiers
  WHERE min_points <= v_akili_score
  ORDER BY min_points DESC
  LIMIT 1;

  -- Next tier
  SELECT * INTO v_next_tier
  FROM akili_tiers
  WHERE min_points > v_akili_score
  ORDER BY min_points ASC
  LIMIT 1;

  -- Mentor verification
  SELECT EXISTS (
    SELECT 1 FROM mentor_profiles
    WHERE user_id = p_user_id
    AND is_verified = true
  ) INTO v_is_mentor_verified;

  -- Institutional / university email verification
  v_is_email_verified := COALESCE(v_profile.is_verified, false);

  -- Compute profile completion (7 fields)
  v_missing_fields := ARRAY[]::TEXT[];

  IF v_profile.full_name IS NULL OR v_profile.full_name = '' THEN
    v_missing_fields := v_missing_fields || 'full_name';
  END IF;
  IF v_profile.bio IS NULL OR v_profile.bio = '' THEN
    v_missing_fields := v_missing_fields || 'bio';
  END IF;
  IF v_profile.avatar_url IS NULL THEN
    v_missing_fields := v_missing_fields || 'avatar_url';
  END IF;
  IF v_profile.research_interests IS NULL
     OR array_length(v_profile.research_interests, 1) IS NULL THEN
    v_missing_fields := v_missing_fields || 'research_interests';
  END IF;
  IF v_profile.university_id IS NULL THEN
    v_missing_fields := v_missing_fields || 'university_id';
  END IF;
  IF v_profile.department IS NULL OR v_profile.department = '' THEN
    v_missing_fields := v_missing_fields || 'department';
  END IF;
  IF v_profile.academic_level IS NULL THEN
    v_missing_fields := v_missing_fields || 'academic_level';
  END IF;

  v_completion_pct := ((7 - array_length(v_missing_fields, 1)) * 100) / 7;

  IF v_completion_pct IS NULL THEN
    v_completion_pct := 100;
  END IF;

  RETURN jsonb_build_object(
    'akili', jsonb_build_object(
      'total', v_akili_score,
      'knowledge', v_knowledge,
      'collaboration', v_collaboration,
      'mentorship', v_mentorship,
      'technical', v_technical,
      'tier', jsonb_build_object(
        'name', COALESCE(v_current_tier.name, 'Emerging Researcher'),
        'slug', COALESCE(v_current_tier.slug, 'emerging'),
        'description', COALESCE(v_current_tier.description, 'Just beginning the research journey on ResearchFlow')
      ),
      'next_tier', CASE
        WHEN v_next_tier IS NOT NULL
        THEN jsonb_build_object(
          'name', v_next_tier.name,
          'points_needed', v_next_tier.min_points - v_akili_score,
          'min_points', v_next_tier.min_points
        )
        ELSE NULL
      END
    ),
    'profile', jsonb_build_object(
      'completion_pct', v_completion_pct,
      'missing_fields', v_missing_fields,
      'is_complete', v_completion_pct = 100
    ),
    'verification', jsonb_build_object(
      'is_mentor_verified', v_is_mentor_verified,
      'is_email_verified', v_is_email_verified,
      'show_email_prompt', NOT v_is_email_verified AND NOT v_is_mentor_verified
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_state(UUID) TO authenticated;

-- Test it immediately
SELECT get_user_state((SELECT id FROM profiles LIMIT 1));
