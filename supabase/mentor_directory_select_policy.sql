-- Fix: mentor directory shows zero mentors because mentor_profiles has no SELECT policy.
-- Without a SELECT policy, RLS silently returns zero rows to authenticated users
-- (no error is raised, so the directory query just comes back empty).
-- Safe to re-run (uses IF NOT EXISTS pattern via DO blocks).

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'mentor_profiles' AND policyname = 'Authenticated users can view mentor profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view mentor profiles"
      ON mentor_profiles FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;
