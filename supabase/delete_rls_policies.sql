-- RLS delete policies for user-owned content
-- Safe to re-run (uses IF NOT EXISTS pattern via DO blocks)

-- research_ideas: authors can delete their own ideas
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'research_ideas' AND policyname = 'Users can delete own ideas'
  ) THEN
    CREATE POLICY "Users can delete own ideas"
      ON research_ideas FOR DELETE
      TO authenticated
      USING (author_id = auth.uid());
  END IF;
END $$;

-- mentor_profiles: mentors can delete their own listing
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mentor_profiles' AND policyname = 'Users can delete own mentor profile'
  ) THEN
    CREATE POLICY "Users can delete own mentor profile"
      ON mentor_profiles FOR DELETE
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;

-- marketplace_tasks: posters can delete their own open tasks
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'marketplace_tasks' AND policyname = 'Users can delete own marketplace tasks'
  ) THEN
    CREATE POLICY "Users can delete own marketplace tasks"
      ON marketplace_tasks FOR DELETE
      TO authenticated
      USING (poster_id = auth.uid());
  END IF;
END $$;
