-- Portfolio items table migration
-- Run this in the Supabase SQL editor if portfolio_items table does not exist

CREATE TABLE IF NOT EXISTS portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL DEFAULT 'other' CHECK (item_type IN ('publication','project','certificate','award','presentation','other')),
  url TEXT,
  file_url TEXT,
  date DATE,
  collaborators TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS portfolio_items_user_id_idx ON portfolio_items(user_id);
CREATE INDEX IF NOT EXISTS portfolio_items_item_type_idx ON portfolio_items(item_type);

-- RLS
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view any portfolio item"
  ON portfolio_items FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Users can insert own portfolio items"
  ON portfolio_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own portfolio items"
  ON portfolio_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own portfolio items"
  ON portfolio_items FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_portfolio_items_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS portfolio_items_updated_at ON portfolio_items;
CREATE TRIGGER portfolio_items_updated_at
  BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_portfolio_items_updated_at();
