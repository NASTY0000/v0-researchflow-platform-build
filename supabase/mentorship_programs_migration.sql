-- ─────────────────────────────────────────────────────────────────────────────
-- STRUCTURED MENTORSHIP PROGRAMS MIGRATION
-- Run in Supabase SQL Editor
-- mentor_profiles already exists — this adds columns + new tables
-- ─────────────────────────────────────────────────────────────────────────────

-- 1A: Extend mentor_profiles with program-management columns
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS max_mentees         INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS current_mentee_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_accepting_mentees BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS expertise_areas      TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio                  TEXT,
  ADD COLUMN IF NOT EXISTS session_format       TEXT    DEFAULT 'online',
  ADD COLUMN IF NOT EXISTS availability_hours   INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS average_rating       NUMERIC(3,2);

-- 1B: Mentorship programs
CREATE TABLE IF NOT EXISTS mentorship_programs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id        UUID REFERENCES profiles(id) NOT NULL,
  mentee_id        UUID REFERENCES profiles(id) NOT NULL,
  duration_months  INTEGER NOT NULL CHECK (duration_months IN (1, 3, 6)),
  focus_area       TEXT NOT NULL,
  goals            TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','active','completed','cancelled','declined')),
  requested_at     TIMESTAMPTZ DEFAULT now(),
  started_at       TIMESTAMPTZ,
  expected_end_at  TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  mentee_rating    SMALLINT CHECK (mentee_rating BETWEEN 1 AND 5),
  mentee_review    TEXT,
  mentor_notes     TEXT,
  points_awarded   BOOLEAN DEFAULT false
);

-- 1C: Milestones
CREATE TABLE IF NOT EXISTS mentorship_milestones (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id   UUID REFERENCES mentorship_programs(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES profiles(id),
  position     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- 1D: Check-in sessions (named to avoid clash with existing mentor_sessions table)
CREATE TABLE IF NOT EXISTS program_sessions (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id       UUID REFERENCES mentorship_programs(id) ON DELETE CASCADE,
  scheduled_at     TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  format           TEXT DEFAULT 'video_call'
    CHECK (format IN ('video_call','in_person','async_message')),
  mentor_notes     TEXT,
  mentee_notes     TEXT,
  status           TEXT DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed','cancelled','missed')),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- 1E: Indexes
CREATE INDEX IF NOT EXISTS idx_mp_mentor   ON mentorship_programs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mp_mentee   ON mentorship_programs(mentee_id);
CREATE INDEX IF NOT EXISTS idx_mp_status   ON mentorship_programs(status);
CREATE INDEX IF NOT EXISTS idx_mm_program  ON mentorship_milestones(program_id);
CREATE INDEX IF NOT EXISTS idx_ps_program  ON program_sessions(program_id);

-- 1F: RLS
ALTER TABLE mentorship_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sessions      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can see their programs"   ON mentorship_programs;
DROP POLICY IF EXISTS "Mentees can request programs"          ON mentorship_programs;
DROP POLICY IF EXISTS "Participants can update programs"      ON mentorship_programs;
DROP POLICY IF EXISTS "Participants can see milestones"       ON mentorship_milestones;
DROP POLICY IF EXISTS "Participants can manage milestones"    ON mentorship_milestones;
DROP POLICY IF EXISTS "Participants can see sessions"         ON program_sessions;
DROP POLICY IF EXISTS "Participants can manage sessions"      ON program_sessions;

CREATE POLICY "Participants can see their programs"
  ON mentorship_programs FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Mentees can request programs"
  ON mentorship_programs FOR INSERT
  WITH CHECK (auth.uid() = mentee_id);

CREATE POLICY "Participants can update programs"
  ON mentorship_programs FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

CREATE POLICY "Participants can see milestones"
  ON mentorship_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentorship_programs mp
      WHERE mp.id = program_id
        AND (mp.mentor_id = auth.uid() OR mp.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Participants can manage milestones"
  ON mentorship_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mentorship_programs mp
      WHERE mp.id = program_id
        AND (mp.mentor_id = auth.uid() OR mp.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Participants can see sessions"
  ON program_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM mentorship_programs mp
      WHERE mp.id = program_id
        AND (mp.mentor_id = auth.uid() OR mp.mentee_id = auth.uid())
    )
  );

CREATE POLICY "Participants can manage sessions"
  ON program_sessions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM mentorship_programs mp
      WHERE mp.id = program_id
        AND (mp.mentor_id = auth.uid() OR mp.mentee_id = auth.uid())
    )
  );
