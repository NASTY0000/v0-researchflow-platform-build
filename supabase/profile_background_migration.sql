-- Run this entire block in Supabase SQL Editor → New Query → Run

-- 1. Add column (safe if already exists)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_background TEXT
DEFAULT 'baobab';

-- 2. Recreate CHECK constraint cleanly
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_profile_background_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_profile_background_check
CHECK (profile_background IN ('baobab', 'constellation'));

-- 3. Backfill any NULLs so constraint doesn't block existing rows
UPDATE profiles
SET profile_background = 'baobab'
WHERE profile_background IS NULL;

-- 4. Check existing RLS policies (run separately to inspect)
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'profiles';

-- 5. Add UPDATE policy if none exists that covers this column.
--    Supabase does not support CREATE POLICY IF NOT EXISTS in all
--    versions, so we use a DO block for safety.
DO $$
BEGIN
  -- Only create if no UPDATE policy exists for profiles at all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND cmd = 'UPDATE'
  ) THEN
    EXECUTE $pol$
      CREATE POLICY "Users can update own profile"
      ON profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id)
    $pol$;
  END IF;
END
$$;
