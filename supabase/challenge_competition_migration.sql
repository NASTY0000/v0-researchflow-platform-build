-- ════════════════════════════════════════════════════════════════════════════════
-- CHALLENGE COMPETITION SYSTEM MIGRATION
-- ════════════════════════════════════════════════════════════════════════════════

-- 1A: Extend challenges table
ALTER TABLE challenges
ADD COLUMN IF NOT EXISTS prize_description TEXT,
ADD COLUMN IF NOT EXISTS prize_type TEXT 
  CHECK (prize_type IN (
    'publication', 'mentorship', 'cash', 
    'certificate', 'mixed'
  )),
ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 4,
ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS judging_criteria JSONB,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  CHECK (status IN (
    'upcoming', 'open', 'judging', 'completed'
  )),
ADD COLUMN IF NOT EXISTS winner_id UUID 
  REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS winner_team_id UUID,
ADD COLUMN IF NOT EXISTS total_submissions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS featured_in_showcase 
  BOOLEAN DEFAULT false;

-- 1B: Challenge teams table
CREATE TABLE IF NOT EXISTS challenge_teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) 
    ON DELETE CASCADE,
  name TEXT NOT NULL,
  leader_id UUID REFERENCES profiles(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, leader_id)
);

-- 1C: Team members table
CREATE TABLE IF NOT EXISTS challenge_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES challenge_teams(id) 
    ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member'
    CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 1D: Team invitations table
CREATE TABLE IF NOT EXISTS challenge_team_invites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES challenge_teams(id) 
    ON DELETE CASCADE,
  invited_user_id UUID REFERENCES profiles(id),
  invited_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, invited_user_id)
);

-- 1E: Challenge submissions table
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) 
    ON DELETE CASCADE,
  
  -- Either solo or team submission
  submitter_id UUID REFERENCES profiles(id),
  team_id UUID REFERENCES challenge_teams(id),
  
  -- Submission content
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  submission_url TEXT,
  additional_notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'submitted'
    CHECK (status IN (
      'submitted', 'under_review', 
      'winner', 'runner_up', 'not_selected'
    )),
  
  -- Judging scores
  score_innovation SMALLINT 
    CHECK (score_innovation BETWEEN 1 AND 10),
  score_feasibility SMALLINT 
    CHECK (score_feasibility BETWEEN 1 AND 10),
  score_impact SMALLINT 
    CHECK (score_impact BETWEEN 1 AND 10),
  score_presentation SMALLINT 
    CHECK (score_presentation BETWEEN 1 AND 10),
  overall_score NUMERIC(4,2),
  judge_feedback TEXT,
  
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  
  CONSTRAINT submission_owner 
    CHECK (submitter_id IS NOT NULL OR team_id IS NOT NULL)
);

-- 1F: Create indexes
CREATE INDEX IF NOT EXISTS idx_challenge_teams_challenge 
  ON challenge_teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_teams_leader 
  ON challenge_teams(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team 
  ON challenge_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user 
  ON challenge_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_challenge 
  ON challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter 
  ON challenge_submissions(submitter_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team 
  ON challenge_submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status 
  ON challenge_submissions(status);

-- 1G: Enable Row Level Security
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

-- 1H: Row Level Security Policies

-- Challenge Teams: Anyone can read, leaders can manage
DROP POLICY IF EXISTS "Anyone can read challenge teams" ON challenge_teams;
CREATE POLICY "Anyone can read challenge teams"
  ON challenge_teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leaders can manage teams" ON challenge_teams;
CREATE POLICY "Leaders can manage teams"
  ON challenge_teams FOR ALL
  USING (auth.uid() = leader_id)
  WITH CHECK (auth.uid() = leader_id);

DROP POLICY IF EXISTS "Leaders can insert teams" ON challenge_teams;
CREATE POLICY "Leaders can insert teams"
  ON challenge_teams FOR INSERT
  WITH CHECK (auth.uid() = leader_id);

-- Challenge Team Members: Anyone can read
DROP POLICY IF EXISTS "Anyone can read team members" ON challenge_team_members;
CREATE POLICY "Anyone can read team members"
  ON challenge_team_members FOR SELECT USING (true);

-- Challenge Team Invites: Members can see, leaders can create, invitees can respond
DROP POLICY IF EXISTS "Members can see invites" ON challenge_team_invites;
CREATE POLICY "Members can see invites"
  ON challenge_team_invites FOR SELECT
  USING (
    auth.uid() = invited_user_id OR
    auth.uid() = invited_by
  );

DROP POLICY IF EXISTS "Leaders can invite" ON challenge_team_invites;
CREATE POLICY "Leaders can invite"
  ON challenge_team_invites FOR INSERT
  WITH CHECK (auth.uid() = invited_by);

DROP POLICY IF EXISTS "Invited users can respond" ON challenge_team_invites;
CREATE POLICY "Invited users can respond"
  ON challenge_team_invites FOR UPDATE
  USING (auth.uid() = invited_user_id);

-- Challenge Submissions: Anyone can read, authenticated users can submit
DROP POLICY IF EXISTS "Anyone can read submissions" ON challenge_submissions;
CREATE POLICY "Anyone can read submissions"
  ON challenge_submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit" ON challenge_submissions;
CREATE POLICY "Authenticated users can submit"
  ON challenge_submissions FOR INSERT
  WITH CHECK (auth.uid() = submitter_id);

DROP POLICY IF EXISTS "Submitters can update own" ON challenge_submissions;
CREATE POLICY "Submitters can update own"
  ON challenge_submissions FOR UPDATE
  USING (auth.uid() = submitter_id);
