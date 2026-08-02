-- ============================================================
-- CHALLENGE SYSTEM REPAIR, run this whole file once.
-- Brings the live database up to what the app code expects.
-- Idempotent: safe to run multiple times.
-- ============================================================

-- 1. Challenges: add every column the app reads/writes
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS full_description TEXT,
  ADD COLUMN IF NOT EXISTS evaluation_criteria TEXT,
  ADD COLUMN IF NOT EXISTS prize_description TEXT,
  ADD COLUMN IF NOT EXISTS prize_type TEXT,
  ADD COLUMN IF NOT EXISTS submission_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS judging_criteria JSONB,
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS winner_team_id UUID,
  ADD COLUMN IF NOT EXISTS featured_in_showcase BOOLEAN DEFAULT false;

-- 2a. The live table may name the author column submitter_id or user_id
--     (older schemas); the app uses author_id. Rename whichever exists.
DO $$
DECLARE
  legacy TEXT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_submissions' AND column_name = 'author_id'
  ) THEN
    SELECT column_name INTO legacy
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'challenge_submissions'
      AND column_name IN ('submitter_id', 'user_id')
    LIMIT 1;
    IF legacy IS NOT NULL THEN
      EXECUTE format('ALTER TABLE challenge_submissions RENAME COLUMN %I TO author_id', legacy);
    END IF;
  END IF;
END $$;

ALTER TABLE challenge_submissions
  ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES auth.users(id);

-- 2b. Challenge submissions: add every column the app reads/writes
ALTER TABLE challenge_submissions
  ADD COLUMN IF NOT EXISTS abstract TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS team_id UUID,
  ADD COLUMN IF NOT EXISTS submission_url TEXT,
  ADD COLUMN IF NOT EXISTS additional_notes TEXT,
  ADD COLUMN IF NOT EXISTS innovation_score SMALLINT,
  ADD COLUMN IF NOT EXISTS feasibility_score SMALLINT,
  ADD COLUMN IF NOT EXISTS impact_score SMALLINT,
  ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS judge_notes TEXT,
  ADD COLUMN IF NOT EXISTS is_winner BOOLEAN DEFAULT false;

-- 3. Team tables (created only if missing)
CREATE TABLE IF NOT EXISTS challenge_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES auth.users(id),
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS challenge_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES challenge_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ct_challenge ON challenge_teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ctm_team ON challenge_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ctm_user ON challenge_team_members(user_id);

-- 4. Link submissions + winners to teams (FKs only after tables exist)
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_winner_team_id_fkey;
ALTER TABLE challenges
  ADD CONSTRAINT challenges_winner_team_id_fkey
  FOREIGN KEY (winner_team_id) REFERENCES challenge_teams(id);

ALTER TABLE challenge_submissions DROP CONSTRAINT IF EXISTS challenge_submissions_team_id_fkey;
ALTER TABLE challenge_submissions
  ADD CONSTRAINT challenge_submissions_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES challenge_teams(id) ON DELETE SET NULL;

-- 5. Row Level Security
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view teams" ON challenge_teams;
CREATE POLICY "Anyone can view teams" ON challenge_teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authenticated users can create teams" ON challenge_teams;
CREATE POLICY "Authenticated users can create teams" ON challenge_teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
DROP POLICY IF EXISTS "Leader can update their team" ON challenge_teams;
CREATE POLICY "Leader can update their team" ON challenge_teams FOR UPDATE USING (auth.uid() = leader_id);
DROP POLICY IF EXISTS "Leader can delete their team" ON challenge_teams;
CREATE POLICY "Leader can delete their team" ON challenge_teams FOR DELETE USING (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Anyone can view team members" ON challenge_team_members;
CREATE POLICY "Anyone can view team members" ON challenge_team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Team leader can insert members" ON challenge_team_members;
CREATE POLICY "Team leader can insert members" ON challenge_team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM challenge_teams WHERE id = team_id AND leader_id = auth.uid())
  OR auth.uid() = user_id
);
DROP POLICY IF EXISTS "Members can leave team" ON challenge_team_members;
CREATE POLICY "Members can leave team" ON challenge_team_members FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can read submissions" ON challenge_submissions;
CREATE POLICY "Anyone can read submissions" ON challenge_submissions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Authors can submit" ON challenge_submissions;
CREATE POLICY "Authors can submit" ON challenge_submissions FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "Authors can update own submission" ON challenge_submissions;
CREATE POLICY "Authors can update own submission" ON challenge_submissions FOR UPDATE USING (auth.uid() = author_id);
DROP POLICY IF EXISTS "Admins can judge submissions" ON challenge_submissions;
CREATE POLICY "Admins can judge submissions" ON challenge_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 6. Backfill submission counts from actual submissions
-- (written without qualified column comparisons; some editors mangle
--  "= table.column" during paste)
WITH counts AS (
  SELECT challenge_id, COUNT(*) AS cnt
  FROM challenge_submissions
  GROUP BY challenge_id
)
UPDATE challenges
SET submission_count = cnt
FROM counts
WHERE id = challenge_id;

UPDATE challenges SET submission_count = 0 WHERE submission_count IS NULL;
