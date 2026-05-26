-- Add profile_background column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS profile_background TEXT
CHECK (profile_background IN ('baobab', 'constellation'))
DEFAULT 'baobab';
