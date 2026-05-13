-- Showcase downloads tracking migration
-- Run this in the Supabase SQL editor

-- Add downloads column to showcase_entries
ALTER TABLE showcase_entries ADD COLUMN IF NOT EXISTS downloads INTEGER NOT NULL DEFAULT 0;

-- Function to atomically increment downloads and return new count
CREATE OR REPLACE FUNCTION increment_showcase_downloads(entry_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE showcase_entries
  SET downloads = downloads + 1
  WHERE id = entry_id
  RETURNING downloads INTO new_count;
  RETURN new_count;
END;
$$;

-- Function to atomically increment views
CREATE OR REPLACE FUNCTION increment_showcase_views(entry_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE showcase_entries
  SET views = views + 1
  WHERE id = entry_id
  RETURNING views INTO new_count;
  RETURN new_count;
END;
$$;
