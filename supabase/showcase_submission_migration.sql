-- Showcase submission and review flow migration
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS showcase_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  abstract TEXT NOT NULL,
  research_area_tags TEXT[] NOT NULL DEFAULT '{}',
  methodology_tags TEXT[] NOT NULL DEFAULT '{}',
  pdf_url TEXT,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'university')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'needs_revision', 'rejected')),
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES profiles(id)
);

CREATE INDEX IF NOT EXISTS showcase_submissions_status_idx ON showcase_submissions(status);
CREATE INDEX IF NOT EXISTS showcase_submissions_submitted_by_idx ON showcase_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS showcase_submissions_project_id_idx ON showcase_submissions(project_id);

ALTER TABLE showcase_submissions ENABLE ROW LEVEL SECURITY;

-- Submitters see their own; admins see all
CREATE POLICY IF NOT EXISTS "Users can view own submissions"
  ON showcase_submissions FOR SELECT
  USING (auth.uid() = submitted_by);

CREATE POLICY IF NOT EXISTS "Admins can view all submissions"
  ON showcase_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert own submissions"
  ON showcase_submissions FOR INSERT
  WITH CHECK (auth.uid() = submitted_by);

CREATE POLICY IF NOT EXISTS "Admins can update submissions"
  ON showcase_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND 'admin' = ANY(roles)
    )
  );

-- Prevent duplicate pending submission per project
CREATE UNIQUE INDEX IF NOT EXISTS showcase_submissions_project_pending_unique
  ON showcase_submissions(project_id)
  WHERE status IN ('pending', 'needs_revision');
