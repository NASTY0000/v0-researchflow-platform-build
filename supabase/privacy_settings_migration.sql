-- Privacy and data management fields for profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_visibility text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS show_availability boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS allow_dm_from_non_connections boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS appear_in_search boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS account_status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS deletion_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS data_export_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_digest boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_marketing boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb DEFAULT '{}';

-- Notification preferences stored as JSONB:
-- { "new_match": { "whatsapp": false, "sms": false }, ... }
-- in_app is always true and not stored.

COMMENT ON COLUMN public.profiles.profile_visibility IS 'public | university_only | connections_only';
COMMENT ON COLUMN public.profiles.account_status IS 'active | suspended | deleted';
