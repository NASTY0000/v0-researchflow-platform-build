-- Add profile_background column (safe to run multiple times)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_background TEXT
DEFAULT 'baobab';

-- Drop and recreate constraint cleanly so it always matches
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_profile_background_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_profile_background_check
CHECK (profile_background IN ('baobab', 'constellation'));

-- Allow users to update their own profile_background
-- (skip if a general update policy already covers all columns)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can update own profile_background'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can update own profile_background"
      ON profiles
      FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)
    $policy$;
  END IF;
END
$$;
