-- Challenges upgrade: team formation, submissions, judging, winner badges
-- Run this migration in Supabase SQL editor

-- Extend challenges table with new columns
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS prize_type TEXT DEFAULT 'akili' CHECK (prize_type IN ('akili', 'cash', 'publication', 'mixed')),
  ADD COLUMN IF NOT EXISTS max_team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS min_team_size INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS judging_criteria JSONB,
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS winner_team_id UUID,
  ADD COLUMN IF NOT EXISTS featured_in_showcase BOOLEAN DEFAULT false;

-- Extend challenge_submissions table
ALTER TABLE challenge_submissions
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

-- Challenge teams
CREATE TABLE IF NOT EXISTS challenge_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID NOT NULL REFERENCES auth.users(id),
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ct_challenge ON challenge_teams(challenge_id);
CREATE INDEX IF NOT EXISTS idx_ct_leader ON challenge_teams(leader_id);

-- Challenge team members
CREATE TABLE IF NOT EXISTS challenge_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES challenge_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ctm_team ON challenge_team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_ctm_user ON challenge_team_members(user_id);

-- Challenge team invites
CREATE TABLE IF NOT EXISTS challenge_team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES challenge_teams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id),
  invitee_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ,
  UNIQUE(team_id, invitee_id)
);

CREATE INDEX IF NOT EXISTS idx_cti_team ON challenge_team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_cti_invitee ON challenge_team_invites(invitee_id);

-- Add winner_team_id FK now that table exists
ALTER TABLE challenges
  DROP CONSTRAINT IF EXISTS challenges_winner_team_id_fkey;
ALTER TABLE challenges
  ADD CONSTRAINT challenges_winner_team_id_fkey
  FOREIGN KEY (winner_team_id) REFERENCES challenge_teams(id);

-- RLS
ALTER TABLE challenge_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_team_invites ENABLE ROW LEVEL SECURITY;

-- challenge_teams policies
CREATE POLICY "Anyone can view teams" ON challenge_teams FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create teams" ON challenge_teams FOR INSERT WITH CHECK (auth.uid() = leader_id);
CREATE POLICY "Leader can update their team" ON challenge_teams FOR UPDATE USING (auth.uid() = leader_id);
CREATE POLICY "Leader can delete their team" ON challenge_teams FOR DELETE USING (auth.uid() = leader_id);

-- challenge_team_members policies
CREATE POLICY "Anyone can view team members" ON challenge_team_members FOR SELECT USING (true);
CREATE POLICY "Team leader can insert members" ON challenge_team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM challenge_teams WHERE id = team_id AND leader_id = auth.uid())
  OR auth.uid() = user_id
);
CREATE POLICY "Members can leave team" ON challenge_team_members FOR DELETE USING (auth.uid() = user_id);

-- challenge_team_invites policies
CREATE POLICY "Involved parties can view invites" ON challenge_team_invites FOR SELECT USING (
  auth.uid() = inviter_id OR auth.uid() = invitee_id
);
CREATE POLICY "Team leader can send invites" ON challenge_team_invites FOR INSERT WITH CHECK (auth.uid() = inviter_id);
CREATE POLICY "Invitee can respond" ON challenge_team_invites FOR UPDATE USING (auth.uid() = invitee_id);

-- Seed data: 3 sample challenges
INSERT INTO challenges (title, description, full_description, difficulty, research_areas, status, akili_reward, prize_description, prize_type, submission_deadline, max_team_size, min_team_size, evaluation_criteria, submission_count)
SELECT
  'Africa Climate Resilience Challenge',
  'Develop innovative research solutions addressing climate change adaptation and mitigation for African communities, with actionable policy recommendations.',
  'Climate change poses an existential threat to many African communities. This challenge invites researchers to develop evidence-based solutions that communities can implement with limited resources. Submissions should include data analysis, a proposed intervention, and a realistic implementation roadmap.',
  'intermediate',
  ARRAY['Climate Science', 'Environmental Science', 'Agriculture', 'Public Policy'],
  'open',
  2500,
  'Publication in African Climate Research Journal + $500 research grant',
  'mixed',
  (NOW() + INTERVAL '60 days')::TIMESTAMPTZ,
  4, 1,
  'Innovation (30%), Feasibility (25%), Impact (30%), Presentation (15%)',
  0
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'Africa Climate Resilience Challenge');

INSERT INTO challenges (title, description, full_description, difficulty, research_areas, status, akili_reward, prize_description, prize_type, submission_deadline, max_team_size, min_team_size, evaluation_criteria, submission_count)
SELECT
  'Open-Source Health Data Pipeline',
  'Design a privacy-preserving health data aggregation pipeline suitable for under-resourced African health systems and compatible with WHO standards.',
  'Access to reliable health data is critical for disease surveillance and resource allocation. This challenge asks teams to design and prototype an open-source pipeline that aggregates health facility data while preserving patient privacy (k-anonymity or differential privacy), outputs WHO-compatible formats, and runs on hardware common in rural clinics.',
  'advanced',
  ARRAY['Public Health', 'Computer Science', 'Data Science', 'Biomedical Engineering'],
  'open',
  3500,
  'Recognition at AfricaHealth Summit + co-authorship on white paper',
  'publication',
  (NOW() + INTERVAL '45 days')::TIMESTAMPTZ,
  5, 2,
  'Technical soundness (35%), Privacy guarantees (25%), Deployability (25%), Documentation (15%)',
  0
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'Open-Source Health Data Pipeline');

INSERT INTO challenges (title, description, full_description, difficulty, research_areas, status, akili_reward, prize_description, prize_type, submission_deadline, max_team_size, min_team_size, evaluation_criteria, submission_count)
SELECT
  'AI for Indigenous Language Preservation',
  'Build a lightweight NLP model or dataset contribution that supports an indigenous African language with fewer than 1 million speakers.',
  'Hundreds of African languages are endangered. This challenge invites researchers and engineers to contribute to language preservation by building a dataset, fine-tuning a small LLM, or creating educational tools for one or more indigenous African languages. Submissions must be open-source and include a language community impact statement.',
  'expert',
  ARRAY['Linguistics', 'Artificial Intelligence', 'Computer Science', 'Cultural Studies'],
  'open',
  5000,
  '5000 Akili points + Featured showcase + Mentorship session with AI research lead',
  'akili',
  (NOW() + INTERVAL '90 days')::TIMESTAMPTZ,
  3, 1,
  'Language impact (30%), Technical quality (30%), Community engagement (25%), Open-source quality (15%)',
  0
WHERE NOT EXISTS (SELECT 1 FROM challenges WHERE title = 'AI for Indigenous Language Preservation');
