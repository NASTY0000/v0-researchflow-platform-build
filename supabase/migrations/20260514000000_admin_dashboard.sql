-- Admin dashboard: profiles, universities, mentor_profiles, platform_events, content_reports, broadcasts
-- Apply in Supabase SQL editor or via CLI.

-- Profiles extensions
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active'
    CHECK (account_status IN ('active', 'suspended')),
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_until timestamptz,
  ADD COLUMN IF NOT EXISTS akili_score integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.profiles.suspended_until IS 'When account_status is suspended: null means permanent until restored.';

-- Universities extensions
ALTER TABLE public.universities
  ADD COLUMN IF NOT EXISTS university_type text CHECK (university_type IN ('federal', 'state', 'private')),
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Mentor verification extensions
ALTER TABLE public.mentor_profiles
  ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'none'
    CHECK (verification_status IN ('none', 'pending', 'approved', 'rejected', 'revoked')),
  ADD COLUMN IF NOT EXISTS institutional_email text,
  ADD COLUMN IF NOT EXISTS staff_id_document_url text,
  ADD COLUMN IF NOT EXISTS supervisor_letter_url text,
  ADD COLUMN IF NOT EXISTS verification_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_rejection_reason text;

-- Platform events (activity feed + MAU)
CREATE TABLE IF NOT EXISTS public.platform_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  subject_type text,
  subject_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_events_created_at ON public.platform_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_events_actor_created ON public.platform_events(actor_id, created_at DESC);

-- Content reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('idea', 'task', 'message')),
  content_id uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'actioned')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status, created_at DESC);

-- Broadcasts history
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('all', 'university', 'role')),
  audience_filter text,
  sent_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Triggers: platform_events
CREATE OR REPLACE FUNCTION public.log_platform_event_signup()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.platform_events (event_type, actor_id, subject_type, subject_id, metadata)
  VALUES ('signup', NEW.id, 'profile', NEW.id, jsonb_build_object('email', NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_signup_event ON public.profiles;
CREATE TRIGGER trg_profiles_signup_event
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_platform_event_signup();

CREATE OR REPLACE FUNCTION public.log_platform_event_idea()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.platform_events (event_type, actor_id, subject_type, subject_id, metadata)
  VALUES ('idea_posted', NEW.author_id, 'idea', NEW.id, jsonb_build_object('title', NEW.title));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_research_ideas_post_event ON public.research_ideas;
CREATE TRIGGER trg_research_ideas_post_event
  AFTER INSERT ON public.research_ideas
  FOR EACH ROW EXECUTE FUNCTION public.log_platform_event_idea();

CREATE OR REPLACE FUNCTION public.log_platform_event_team()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.platform_events (event_type, actor_id, subject_type, subject_id, metadata)
  VALUES ('team_formed', NEW.leader_id, 'team', NEW.id, jsonb_build_object('name', NEW.name, 'idea_id', NEW.idea_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teams_formed_event ON public.teams;
CREATE TRIGGER trg_teams_formed_event
  AFTER INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.log_platform_event_team();

-- RLS
ALTER TABLE public.platform_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_events_select_own_or_admin" ON public.platform_events;
CREATE POLICY "platform_events_select_own_or_admin" ON public.platform_events
  FOR SELECT TO authenticated
  USING (
    actor_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "content_reports_insert_authenticated" ON public.content_reports;
CREATE POLICY "content_reports_insert_authenticated" ON public.content_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "content_reports_select_admin" ON public.content_reports;
CREATE POLICY "content_reports_select_admin" ON public.content_reports
  FOR SELECT TO authenticated
  USING (
    reporter_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
  );

DROP POLICY IF EXISTS "content_reports_update_admin" ON public.content_reports;
CREATE POLICY "content_reports_update_admin" ON public.content_reports
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "broadcasts_select_admin" ON public.broadcasts;
CREATE POLICY "broadcasts_select_admin" ON public.broadcasts
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

DROP POLICY IF EXISTS "broadcasts_insert_admin" ON public.broadcasts;
CREATE POLICY "broadcasts_insert_admin" ON public.broadcasts
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true));

-- Mentor profiles: users can manage own row (verification submission)
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mentor_profiles_select_own" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_select_own" ON public.mentor_profiles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true)
    OR is_verified = true
  );

DROP POLICY IF EXISTS "mentor_profiles_insert_own" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_insert_own" ON public.mentor_profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "mentor_profiles_update_own" ON public.mentor_profiles;
CREATE POLICY "mentor_profiles_update_own" ON public.mentor_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('mentor-verification', 'mentor-verification', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "mentor_verification_insert_own" ON storage.objects;
CREATE POLICY "mentor_verification_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'mentor-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "mentor_verification_select_own" ON storage.objects;
CREATE POLICY "mentor_verification_select_own"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'mentor-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "mentor_verification_delete_own" ON storage.objects;
CREATE POLICY "mentor_verification_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'mentor-verification'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Backfill mentor queue for previously unverified rows
UPDATE public.mentor_profiles
SET verification_status = 'pending'
WHERE is_verified = false AND verification_status = 'none';
