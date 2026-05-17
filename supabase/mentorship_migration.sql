-- Mentorship system migration
-- Run this in the Supabase SQL editor

-- mentorship_requests: initial request from student to mentor
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  message TEXT,
  brief_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  decline_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- mentor_availability: specific date/time slots a mentor makes available
CREATE TABLE IF NOT EXISTS mentor_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  available_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_booked BOOLEAN NOT NULL DEFAULT false,
  booked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  agenda TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- mentor_sessions: confirmed booked sessions
CREATE TABLE IF NOT EXISTS mentor_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  availability_slot_id UUID REFERENCES mentor_availability(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  agenda TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed', 'cancelled')),
  student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
  student_feedback TEXT,
  rating_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_sessions ENABLE ROW LEVEL SECURITY;

-- mentorship_requests policies
CREATE POLICY "Users can view their mentorship requests"
  ON mentorship_requests FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Students can create mentorship requests"
  ON mentorship_requests FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Mentors can update request status"
  ON mentorship_requests FOR UPDATE
  USING (auth.uid() = mentor_id);

-- mentor_availability policies
CREATE POLICY "Anyone can view availability slots"
  ON mentor_availability FOR SELECT
  USING (true);

CREATE POLICY "Mentors can manage their availability"
  ON mentor_availability FOR INSERT
  WITH CHECK (auth.uid() = mentor_id);

CREATE POLICY "Mentors can delete their availability"
  ON mentor_availability FOR DELETE
  USING (auth.uid() = mentor_id);

CREATE POLICY "Users can update availability for booking"
  ON mentor_availability FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = booked_by OR is_booked = false);

-- mentor_sessions policies
CREATE POLICY "Participants can view mentor sessions"
  ON mentor_sessions FOR SELECT
  USING (auth.uid() = mentor_id OR auth.uid() = student_id);

CREATE POLICY "Students can create sessions"
  ON mentor_sessions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Participants can update sessions"
  ON mentor_sessions FOR UPDATE
  USING (auth.uid() = mentor_id OR auth.uid() = student_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_mentor ON mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_student ON mentorship_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_mentor ON mentor_availability(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_availability_project ON mentor_availability(project_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_project ON mentor_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_mentor ON mentor_sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_sessions_student ON mentor_sessions(student_id);

-- Add mentorship_request to notifications type check (if you have a check constraint)
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
