import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendNotification } from '@/lib/notifications/service'

/**
 * Called from the cron API route only (not a server action).
 * Finds scheduled sessions ~24h ahead and notifies mentor + mentee once.
 */
export async function runMentorSessionReminders(): Promise<{ ok: true; processed: number } | { error: string }> {
  const admin = createServiceRoleClient()
  const now = Date.now()
  const start = now + 23 * 60 * 60 * 1000
  const end = now + 25 * 60 * 60 * 1000

  const { data: sessions, error } = await admin
    .from('mentorship_sessions')
    .select('id, mentor_id, mentee_id, scheduled_at, project_id')
    .eq('status', 'scheduled')
    .is('session_reminder_sent_at', null)
    .gte('scheduled_at', new Date(start).toISOString())
    .lte('scheduled_at', new Date(end).toISOString())

  if (error) return { error: error.message }

  let processed = 0
  for (const s of sessions ?? []) {
    const [{ data: mentorProf }, { data: menteeProf }] = await Promise.all([
      admin.from('profiles').select('full_name').eq('id', s.mentor_id as string).maybeSingle(),
      admin.from('profiles').select('full_name').eq('id', s.mentee_id as string).maybeSingle(),
    ])

    const mentorName = mentorProf?.full_name || 'Your mentor'
    const menteeName = menteeProf?.full_name || 'Your mentee'
    const t = new Date(s.scheduled_at as string).toLocaleString('en-NG', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    const projectId = s.project_id as string | null
    const link = projectId ? `/projects/${projectId}` : '/projects'

    const plainMentee = `Reminder: You have a mentor session tomorrow with ${mentorName} at ${t}.`
    await sendNotification({
      recipientUserId: s.mentee_id as string,
      type: 'session_reminder',
      title: 'Mentor session tomorrow',
      message: plainMentee,
      link,
      metadata: { session_id: s.id, role: 'mentee' },
      whatsappPlainBody: plainMentee,
      smsShortBody: `Session tomorrow ${t}`,
    })

    const plainMentor = `Reminder: You have a mentor session tomorrow with ${menteeName} at ${t}.`
    await sendNotification({
      recipientUserId: s.mentor_id as string,
      type: 'session_reminder',
      title: 'Mentor session tomorrow',
      message: plainMentor,
      link,
      metadata: { session_id: s.id, role: 'mentor' },
      whatsappPlainBody: plainMentor,
      smsShortBody: `Session tomorrow ${t}`,
    })

    await admin
      .from('mentorship_sessions')
      .update({ session_reminder_sent_at: new Date().toISOString() })
      .eq('id', s.id as string)

    processed += 1
  }

  return { ok: true, processed }
}
