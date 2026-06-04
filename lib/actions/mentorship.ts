'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { awardAkiliPoints } from '@/lib/actions/akili'

// ── REQUEST A PROGRAM ──────────────────────────────────────────────────────
export async function requestMentorshipProgram(data: {
  mentorId: string
  durationMonths: 1 | 3 | 6
  focusArea: string
  goals: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }
    if (user.id === data.mentorId) return { success: false, error: 'Cannot mentor yourself' }

    const { data: mp } = await supabase
      .from('mentor_profiles')
      .select('max_mentees, current_mentee_count, is_accepting_mentees')
      .eq('user_id', data.mentorId)
      .single()

    if (mp?.is_accepting_mentees === false)
      return { success: false, error: 'This mentor is not currently accepting mentees' }

    if ((mp?.current_mentee_count ?? 0) >= (mp?.max_mentees ?? 5))
      return { success: false, error: 'This mentor has reached their maximum mentee capacity' }

    const { data: existing } = await supabase
      .from('mentorship_programs')
      .select('id')
      .eq('mentor_id', data.mentorId)
      .eq('mentee_id', user.id)
      .in('status', ['requested', 'active'])
      .maybeSingle()

    if (existing)
      return { success: false, error: 'You already have an active or pending program with this mentor' }

    const { error } = await supabase.from('mentorship_programs').insert({
      mentor_id: data.mentorId,
      mentee_id: user.id,
      duration_months: data.durationMonths,
      focus_area: data.focusArea,
      goals: data.goals,
      status: 'requested',
    })

    if (error) throw error

    // Notify mentor
    await supabase.from('notifications').insert({
      user_id: data.mentorId,
      type: 'mentorship_request',
      title: 'New Program Request',
      message: 'A researcher has requested a structured mentorship program with you.',
      link: '/mentor-dashboard',
    })

    revalidatePath('/mentors')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to request program' }
  }
}

// ── RESPOND TO REQUEST (mentor) ────────────────────────────────────────────
export async function respondToProgramRequest(
  programId: string,
  response: 'active' | 'declined',
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: program } = await supabase
      .from('mentorship_programs')
      .select('mentor_id, mentee_id, duration_months')
      .eq('id', programId)
      .single()

    if (!program || program.mentor_id !== user.id)
      return { success: false, error: 'Not authorised' }

    const startedAt = new Date()
    const expectedEnd = new Date(startedAt)
    expectedEnd.setMonth(expectedEnd.getMonth() + program.duration_months)

    await supabase.from('mentorship_programs').update({
      status: response,
      started_at:       response === 'active' ? startedAt.toISOString() : null,
      expected_end_at:  response === 'active' ? expectedEnd.toISOString() : null,
    }).eq('id', programId)

    if (response === 'active') {
      // Increment mentor's current mentee count
      const { data: mp } = await supabase
        .from('mentor_profiles')
        .select('current_mentee_count')
        .eq('user_id', user.id)
        .single()
      await supabase.from('mentor_profiles')
        .update({ current_mentee_count: (mp?.current_mentee_count ?? 0) + 1 })
        .eq('user_id', user.id)

      // Auto-generate default milestones
      const milestones = generateDefaultMilestones(program.duration_months, startedAt)
      await supabase.from('mentorship_milestones').insert(
        milestones.map((m, i) => ({ program_id: programId, ...m, position: i }))
      )

      // Notify mentee
      await supabase.from('notifications').insert({
        user_id: program.mentee_id,
        type: 'mentorship_request',
        title: 'Program Request Accepted',
        message: 'Your mentorship program request has been accepted! Your milestones are ready.',
        link: `/mentors/${programId}`,
      })
    } else {
      await supabase.from('notifications').insert({
        user_id: program.mentee_id,
        type: 'mentorship_request',
        title: 'Program Request Declined',
        message: 'Your mentorship program request was declined.',
        link: '/mentors',
      })
    }

    revalidatePath('/mentor-dashboard')
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to respond' }
  }
}

// ── COMPLETE A PROGRAM ─────────────────────────────────────────────────────
export async function completeMentorshipProgram(
  programId: string,
  data: { menteeRating?: number; menteeReview?: string; mentorNotes?: string },
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Not authenticated' }

    const { data: program } = await supabase
      .from('mentorship_programs')
      .select('mentor_id, mentee_id, points_awarded')
      .eq('id', programId)
      .single()

    if (!program) return { success: false, error: 'Program not found' }

    const isMentor = program.mentor_id === user.id
    const isMentee = program.mentee_id === user.id
    if (!isMentor && !isMentee) return { success: false, error: 'Not authorised' }

    await supabase.from('mentorship_programs').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      ...(isMentee && data.menteeRating && {
        mentee_rating: data.menteeRating,
        mentee_review: data.menteeReview,
      }),
      ...(isMentor && { mentor_notes: data.mentorNotes }),
    }).eq('id', programId)

    if (!program.points_awarded) {
      await awardAkiliPoints({
        userId: program.mentor_id,
        eventType: 'mentorship_program_completed',
        points: 80,
        dimension: 'mentorship',
        description: 'Completed a structured mentorship program',
      })
      await awardAkiliPoints({
        userId: program.mentee_id,
        eventType: 'mentorship_program_completed_mentee',
        points: 40,
        dimension: 'knowledge',
        description: 'Completed a structured mentorship program',
      })

      await supabase.from('mentorship_programs')
        .update({ points_awarded: true })
        .eq('id', programId)

      // Decrement mentor's current mentee count
      const { data: mp } = await supabase
        .from('mentor_profiles')
        .select('current_mentee_count')
        .eq('user_id', program.mentor_id)
        .single()
      await supabase.from('mentor_profiles')
        .update({ current_mentee_count: Math.max((mp?.current_mentee_count ?? 1) - 1, 0) })
        .eq('user_id', program.mentor_id)

      // Update mentor average_rating if mentee rated
      if (data.menteeRating) {
        const { data: mpRating } = await supabase
          .from('mentor_profiles')
          .select('average_rating, rating_count')
          .eq('user_id', program.mentor_id)
          .single()
        if (mpRating) {
          const oldCount = mpRating.rating_count || 0
          const oldAvg   = mpRating.average_rating || 0
          const newAvg   = (oldAvg * oldCount + data.menteeRating) / (oldCount + 1)
          await supabase.from('mentor_profiles').update({
            average_rating: Math.round(newAvg * 100) / 100,
            rating_count:   oldCount + 1,
          }).eq('user_id', program.mentor_id)
        }
      }
    }

    revalidatePath('/mentors')
    revalidatePath(`/mentors/${programId}`)
    return { success: true }
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to complete program' }
  }
}

// ── COMPLETE MILESTONE ─────────────────────────────────────────────────────
export async function completeMilestone(
  milestoneId: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('mentorship_milestones').update({
    is_completed: true,
    completed_at: new Date().toISOString(),
    completed_by: user.id,
  }).eq('id', milestoneId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ── TOGGLE ACCEPTING MENTEES ───────────────────────────────────────────────
export async function toggleAcceptingMentees(
  accepting: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('mentor_profiles')
    .update({ is_accepting_mentees: accepting })
    .eq('user_id', user.id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/mentor-dashboard')
  return { success: true }
}

// ── FETCH MY PROGRAMS ──────────────────────────────────────────────────────
export async function getMyMentorshipPrograms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { asMentor: [], asMentee: [] }

  const [mentorRes, menteeRes] = await Promise.all([
    supabase.from('mentorship_programs').select(`
      id, status, focus_area, duration_months,
      started_at, expected_end_at, completed_at,
      mentee_rating, mentor_id, mentee_id,
      mentee:profiles!mentorship_programs_mentee_id_fkey(
        id, full_name, avatar_url, university_name
      ),
      mentorship_milestones(id, title, is_completed, due_date, position)
    `).eq('mentor_id', user.id).order('requested_at', { ascending: false }),

    supabase.from('mentorship_programs').select(`
      id, status, focus_area, duration_months,
      started_at, expected_end_at, completed_at,
      mentor_id, mentee_id,
      mentor:profiles!mentorship_programs_mentor_id_fkey(
        id, full_name, avatar_url, university_name
      ),
      mentorship_milestones(id, title, is_completed, due_date, position)
    `).eq('mentee_id', user.id).order('requested_at', { ascending: false }),
  ])

  return {
    asMentor: (mentorRes.data ?? []) as unknown as MentorProgramItem[],
    asMentee: (menteeRes.data ?? []) as unknown as MenteeProgramItem[],
  }
}

// ── FETCH PROGRAM DETAIL ───────────────────────────────────────────────────
export async function getProgramDetail(programId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase.from('mentorship_programs').select(`
    id, status, focus_area, goals, duration_months,
    started_at, expected_end_at, completed_at,
    mentee_rating, mentee_review, mentor_notes,
    mentor_id, mentee_id, points_awarded,
    mentor:profiles!mentorship_programs_mentor_id_fkey(
      id, full_name, avatar_url, university_name, department
    ),
    mentee:profiles!mentorship_programs_mentee_id_fkey(
      id, full_name, avatar_url, university_name, department
    ),
    mentorship_milestones(
      id, title, description, due_date, is_completed, completed_at, position
    ),
    program_sessions(
      id, scheduled_at, duration_minutes, format, status, mentor_notes, mentee_notes, created_at
    )
  `).eq('id', programId).single()

  if (!data) return null
  if (data.mentor_id !== user.id && data.mentee_id !== user.id) return null

  return { data: data as unknown as ProgramDetail, currentUserId: user.id }
}

// ── TYPES ──────────────────────────────────────────────────────────────────
export interface MentorProgramItem {
  id: string
  status: string
  focus_area: string
  duration_months: number
  started_at: string | null
  expected_end_at: string | null
  completed_at: string | null
  mentee_rating: number | null
  mentor_id: string
  mentee_id: string
  mentee: { id: string; full_name: string | null; avatar_url: string | null; university_name: string | null }
  mentorship_milestones: { id: string; title: string; is_completed: boolean; due_date: string | null; position: number }[]
}

export interface MenteeProgramItem {
  id: string
  status: string
  focus_area: string
  duration_months: number
  started_at: string | null
  expected_end_at: string | null
  completed_at: string | null
  mentor_id: string
  mentee_id: string
  mentor: { id: string; full_name: string | null; avatar_url: string | null; university_name: string | null }
  mentorship_milestones: { id: string; title: string; is_completed: boolean; due_date: string | null; position: number }[]
}

export interface ProgramDetail {
  id: string
  status: string
  focus_area: string
  goals: string
  duration_months: number
  started_at: string | null
  expected_end_at: string | null
  completed_at: string | null
  mentee_rating: number | null
  mentee_review: string | null
  mentor_notes: string | null
  mentor_id: string
  mentee_id: string
  points_awarded: boolean
  mentor: { id: string; full_name: string | null; avatar_url: string | null; university_name: string | null; department: string | null }
  mentee: { id: string; full_name: string | null; avatar_url: string | null; university_name: string | null; department: string | null }
  mentorship_milestones: {
    id: string; title: string; description: string | null;
    due_date: string | null; is_completed: boolean; completed_at: string | null; position: number
  }[]
  program_sessions: {
    id: string; scheduled_at: string; duration_minutes: number; format: string;
    status: string; mentor_notes: string | null; mentee_notes: string | null; created_at: string
  }[]
}

// ── DEFAULT MILESTONES ─────────────────────────────────────────────────────
function generateDefaultMilestones(durationMonths: number, startDate: Date) {
  const days = (d: number) => new Date(startDate.getTime() + d * 86400000).toISOString().split('T')[0]
  const months = (m: number) => new Date(new Date(startDate).setMonth(startDate.getMonth() + m)).toISOString().split('T')[0]

  const milestones = [
    { title: 'Kick-off session', description: 'Initial meeting to align on goals and expectations', due_date: days(7) },
    { title: 'Research direction confirmed', description: 'Agree on the specific research question or project to focus on', due_date: days(30) },
  ]

  if (durationMonths >= 3) {
    milestones.push({
      title: 'Mid-program check-in',
      description: 'Review progress and adjust goals if needed',
      due_date: months(Math.floor(durationMonths / 2)),
    })
  }

  milestones.push({
    title: 'Final presentation or deliverable',
    description: 'Present research outcomes and summarise learnings',
    due_date: months(durationMonths),
  })

  return milestones
}
