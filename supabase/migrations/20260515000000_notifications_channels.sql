-- Phone & channel toggles on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone_number text,
  ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sms_enabled boolean NOT NULL DEFAULT false;

-- Per-type notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  in_app boolean NOT NULL DEFAULT true,
  whatsapp boolean NOT NULL DEFAULT false,
  sms boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user
  ON public.notification_preferences(user_id);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own notification_preferences"
  ON public.notification_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Audit + rate limit (server role only — no policies for authenticated)
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'sms')),
  notification_type text NOT NULL,
  provider_id text,
  status text NOT NULL CHECK (status IN ('sent', 'failed', 'skipped')),
  error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_user_channel_created
  ON public.notification_logs(user_id, channel, created_at DESC);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- No policies: only service role bypasses RLS for inserts/selects

-- Phone OTP challenges (service role only)
CREATE TABLE IF NOT EXISTS public.phone_verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL,
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_phone_challenges_user_created
  ON public.phone_verification_challenges(user_id, created_at DESC);

ALTER TABLE public.phone_verification_challenges ENABLE ROW LEVEL SECURITY;

-- Session reminder dedupe (optional column)
ALTER TABLE public.mentorship_sessions
  ADD COLUMN IF NOT EXISTS session_reminder_sent_at timestamptz;

COMMENT ON COLUMN public.mentorship_sessions.session_reminder_sent_at IS 'Set when 24h WhatsApp/SMS reminder was sent';

-- Ensure notifications supports metadata (used by app)
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;
