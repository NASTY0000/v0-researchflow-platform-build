'use server'

import { createHash, randomInt } from 'crypto'
import { revalidatePath } from 'next/cache'
import twilio from 'twilio'
import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { sendNotification } from '@/lib/notifications/service'
import type { ChannelNotificationType } from '@/lib/notifications/constants'

const NG_E164 = /^\+234[0-9]{10,11}$/

function otpPepper(): string {
  return (
    process.env.PHONE_OTP_SECRET ||
    process.env.CRON_SECRET ||
    'researchflow-phone-otp-dev'
  )
}

function hashOtp(code: string): string {
  return createHash('sha256').update(`${otpPepper()}:${code}`, 'utf8').digest('hex')
}

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase, user: null as null }
  return { supabase, user }
}

export async function notifyMatchFoundAction(input: {
  matchedUserId: string
  matcherName: string
  matcherUniversity: string
}) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: row } = await supabase
    .from('matches')
    .select('id')
    .eq('user_id', user.id)
    .eq('matched_user_id', input.matchedUserId)
    .maybeSingle()

  if (!row) return { error: 'Match not found' }

  const plain = `You have a new research match! ${input.matcherName} from ${input.matcherUniversity} matches your skills.`
  const short = `New match: ${input.matcherName}`
  await sendNotification({
    recipientUserId: input.matchedUserId,
    type: 'match_found',
    title: 'New research match',
    message: plain,
    link: '/matches',
    whatsappPlainBody: plain,
    smsShortBody: short,
  })
  revalidatePath('/notifications')
  return { ok: true }
}

export async function notifyConnectionRequestAction(input: {
  recipientId: string
  senderName: string
  title?: string
  message?: string
}) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: conn } = await supabase
    .from('connections')
    .select('id')
    .eq('requester_id', user.id)
    .eq('recipient_id', input.recipientId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conn) return { error: 'Connection not found' }

  const plain = `${input.senderName} wants to connect with you on ResearchFlow.`
  const short = `${input.senderName} wants to connect`
  await sendNotification({
    recipientUserId: input.recipientId,
    type: 'connection_request',
    title: input.title ?? 'New connection request',
    message: input.message ?? plain,
    link: '/notifications',
    whatsappPlainBody: plain,
    smsShortBody: short,
  })
  revalidatePath('/notifications')
  return { ok: true }
}

export async function notifyMentorshipRequestAction(input: {
  mentorId: string
  studentName: string
  projectTitle: string
}) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: session } = await supabase
    .from('mentorship_sessions')
    .select('id')
    .eq('mentor_id', input.mentorId)
    .eq('mentee_id', user.id)
    .eq('status', 'requested')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) return { error: 'Session not found' }

  const plain = `${input.studentName} has requested your mentorship for '${input.projectTitle}'.`
  const short = `Mentorship request: ${input.projectTitle}`
  await sendNotification({
    recipientUserId: input.mentorId,
    type: 'mentorship_request',
    title: 'New mentorship request',
    message: plain,
    link: '/mentor-dashboard',
    metadata: { session_id: session.id },
    whatsappPlainBody: plain,
    smsShortBody: short,
  })
  revalidatePath('/notifications')
  return { ok: true }
}

export async function acceptMentorshipRequestAction(sessionId: string) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: session, error } = await supabase
    .from('mentorship_sessions')
    .select('id, mentor_id, mentee_id, notes')
    .eq('id', sessionId)
    .eq('mentor_id', user.id)
    .eq('status', 'requested')
    .single()

  if (error || !session) return { error: 'Request not found' }

  const { error: upErr } = await supabase
    .from('mentorship_sessions')
    .update({ status: 'accepted' })
    .eq('id', sessionId)

  let updateErr = upErr
  if (updateErr) {
    const second = await supabase
      .from('mentorship_sessions')
      .update({ status: 'scheduled' })
      .eq('id', sessionId)
    updateErr = second.error
  }

  if (updateErr) return { error: updateErr.message }

  const { data: mentorProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const mentorName = mentorProfile?.full_name || 'Your mentor'

  const plain = `Great news! ${mentorName} has accepted your mentorship request.`
  const short = `${mentorName} accepted mentorship`
  await sendNotification({
    recipientUserId: session.mentee_id,
    type: 'mentorship_accepted',
    title: 'Mentorship accepted',
    message: plain,
    link: '/projects',
    metadata: { session_id: sessionId },
    whatsappPlainBody: plain,
    smsShortBody: short,
  })
  revalidatePath('/mentors/requests')
  revalidatePath('/notifications')
  return { ok: true }
}

export async function notifyTaskAssignedAction(input: {
  assigneeId: string
  taskTitle: string
  projectId: string
}) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }
  if (input.assigneeId === user.id) return { ok: true }

  const { data: project } = await supabase
    .from('projects')
    .select('team_id, title')
    .eq('id', input.projectId)
    .single()

  if (!project?.team_id) return { error: 'Project not found' }

  const { data: member } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', project.team_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return { error: 'Forbidden' }

  const plain = `You have been assigned a task: '${input.taskTitle}' on ResearchFlow.`
  const short = `New task: ${input.taskTitle}`
  await sendNotification({
    recipientUserId: input.assigneeId,
    type: 'task_assigned',
    title: 'Task assigned',
    message: plain,
    link: `/projects/${input.projectId}`,
    metadata: { project_id: input.projectId },
    whatsappPlainBody: plain,
    smsShortBody: short,
  })
  revalidatePath('/notifications')
  return { ok: true }
}

export async function requestPhoneVerificationAction(rawPhone: string) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const phone = rawPhone.trim()
  if (!NG_E164.test(phone)) {
    return { error: 'Use a Nigerian number in E.164 format (+234…)' }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_NUMBER
  if (!sid || !token || !from) {
    return { error: 'SMS is not configured (Twilio)' }
  }

  const admin = createServiceRoleClient()
  const code = String(randomInt(100000, 999999))
  const hash = hashOtp(code)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await admin.from('phone_verification_challenges').delete().eq('user_id', user.id)

  const { error: insErr } = await admin.from('phone_verification_challenges').insert({
    user_id: user.id,
    phone_e164: phone,
    code_hash: hash,
    expires_at: expiresAt,
    attempts: 0,
  })

  if (insErr) return { error: insErr.message }

  const client = twilio(sid, token)
  try {
    await client.messages.create({
      from,
      to: phone,
      body: `ResearchFlow: Your verification code is ${code}. It expires in 10 minutes.`,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return { error: msg }
  }

  return { ok: true }
}

export async function confirmPhoneVerificationAction(codeRaw: string) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const code = codeRaw.trim().replace(/\s/g, '')
  if (!/^\d{6}$/.test(code)) return { error: 'Enter the 6-digit code' }

  const admin = createServiceRoleClient()
  const { data: row, error } = await admin
    .from('phone_verification_challenges')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !row) return { error: 'No verification pending' }
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { error: 'Code expired; request a new one' }
  }
  if ((row.attempts as number) >= 5) return { error: 'Too many attempts' }

  const ok = hashOtp(code) === row.code_hash
  await admin
    .from('phone_verification_challenges')
    .update({ attempts: (row.attempts as number) + 1 })
    .eq('id', row.id)

  if (!ok) return { error: 'Invalid code' }

  const { error: upErr } = await admin
    .from('profiles')
    .update({
      phone_number: row.phone_e164 as string,
      phone_verified: true,
    })
    .eq('id', user.id)

  if (upErr) return { error: upErr.message }

  await admin.from('phone_verification_challenges').delete().eq('user_id', user.id)

  revalidatePath('/settings')
  return { ok: true }
}

export async function updateNotificationPreferencesAction(
  prefs: Partial<
    Record<
      ChannelNotificationType,
      { whatsapp?: boolean; sms?: boolean }
    >
  >,
) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified, whatsapp_enabled, sms_enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.phone_verified) {
    return { error: 'Verify your phone number first' }
  }

  for (const [type, flags] of Object.entries(prefs)) {
    if (!flags || typeof flags !== 'object') continue
    const { data: existing } = await supabase
      .from('notification_preferences')
      .select('id, in_app, whatsapp, sms')
      .eq('user_id', user.id)
      .eq('notification_type', type)
      .maybeSingle()

    const nextWa = profile.whatsapp_enabled
      ? flags.whatsapp !== undefined
        ? Boolean(flags.whatsapp)
        : Boolean(existing?.whatsapp)
      : false
    const nextSms = profile.sms_enabled
      ? flags.sms !== undefined
        ? Boolean(flags.sms)
        : Boolean(existing?.sms)
      : false

    if (existing) {
      await supabase
        .from('notification_preferences')
        .update({
          whatsapp: nextWa,
          sms: nextSms,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else {
      await supabase.from('notification_preferences').insert({
        user_id: user.id,
        notification_type: type,
        in_app: true,
        whatsapp: nextWa,
        sms: nextSms,
      })
    }
  }

  revalidatePath('/settings')
  return { ok: true }
}

export async function updateChannelMasterFlagsAction(input: {
  whatsapp_enabled?: boolean
  sms_enabled?: boolean
}) {
  const { supabase, user } = await requireAuth()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('phone_verified')
    .eq('id', user.id)
    .single()

  if (!profile?.phone_verified) {
    return { error: 'Verify your phone number first' }
  }

  const patch: Record<string, boolean> = {}
  if (input.whatsapp_enabled !== undefined) patch.whatsapp_enabled = input.whatsapp_enabled
  if (input.sms_enabled !== undefined) patch.sms_enabled = input.sms_enabled

  if (Object.keys(patch).length === 0) return { ok: true }

  const { error } = await supabase.from('profiles').update(patch).eq('id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/settings')
  return { ok: true }
}
