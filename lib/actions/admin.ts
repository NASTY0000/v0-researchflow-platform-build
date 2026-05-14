'use server'

import { revalidatePath } from 'next/cache'
import type { UserRole } from '@/lib/types/database'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'

const ADMIN_PATHS = ['/admin', '/admin/users', '/admin/mentors', '/admin/showcase', '/admin/moderation', '/admin/universities', '/admin/analytics', '/admin/broadcast']

function revalidateAdmin() {
  ADMIN_PATHS.forEach((p) => revalidatePath(p, 'layout'))
}

async function requireAdmin() {
  const gate = await assertAdmin()
  if (!gate.ok) return { error: gate.error, admin: null as ReturnType<typeof createServiceRoleClient> | null, userId: '' as string }
  return { error: null, admin: createServiceRoleClient(), userId: gate.userId }
}

export async function suspendUser(params: {
  userId: string
  reason: string
  days: number | null
}) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const suspendedUntil =
    params.days == null || params.days <= 0
      ? null
      : new Date(Date.now() + params.days * 24 * 60 * 60 * 1000).toISOString()

  const { error: upErr } = await admin
    .from('profiles')
    .update({
      account_status: 'suspended',
      suspension_reason: params.reason,
      suspended_until: suspendedUntil,
    })
    .eq('id', params.userId)

  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function restoreUser(userId: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { error: upErr } = await admin
    .from('profiles')
    .update({
      account_status: 'active',
      suspension_reason: null,
      suspended_until: null,
    })
    .eq('id', userId)

  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

function normalizeRolesWithAdmin(roles: UserRole[], isAdmin: boolean): UserRole[] {
  const set = new Set(roles.filter(Boolean))
  if (isAdmin) set.add('admin')
  else set.delete('admin')
  return Array.from(set)
}

export async function updateUserRolesAndAdmin(userId: string, roles: UserRole[], isAdmin: boolean) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const nextRoles = normalizeRolesWithAdmin(roles, isAdmin)
  const { error: upErr } = await admin
    .from('profiles')
    .update({ roles: nextRoles, is_admin: isAdmin })
    .eq('id', userId)

  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function countBroadcastRecipients(audience: 'all' | 'university' | 'role', filter: string | null) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized', count: 0 }

  let q = admin.from('profiles').select('id', { count: 'exact', head: true }).eq('account_status', 'active')

  if (audience === 'university' && filter) {
    q = q.eq('university_id', filter)
  } else if (audience === 'role' && filter) {
    q = q.contains('roles', [filter])
  }

  const { count, error: cErr } = await q
  if (cErr) return { error: cErr.message, count: 0 }
  return { count: count ?? 0 }
}

const NOTIFICATION_CHUNK = 200

export async function sendBroadcast(params: {
  title: string
  message: string
  audience: 'all' | 'university' | 'role'
  audienceFilter: string | null
}) {
  const { error, admin, userId } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  let q = admin.from('profiles').select('id').eq('account_status', 'active')

  if (params.audience === 'university' && params.audienceFilter) {
    q = q.eq('university_id', params.audienceFilter)
  } else if (params.audience === 'role' && params.audienceFilter) {
    q = q.contains('roles', [params.audienceFilter])
  }

  const { data: recipients, error: listErr } = await q
  if (listErr) return { error: listErr.message }

  const ids = (recipients || []).map((r) => r.id as string)
  const recipientCount = ids.length

  const { data: broadcastRow, error: bErr } = await admin
    .from('broadcasts')
    .insert({
      title: params.title,
      message: params.message,
      audience: params.audience,
      audience_filter: params.audienceFilter,
      sent_by: userId,
      recipient_count: recipientCount,
    })
    .select('id')
    .single()

  if (bErr) return { error: bErr.message }

  for (let i = 0; i < ids.length; i += NOTIFICATION_CHUNK) {
    const slice = ids.slice(i, i + NOTIFICATION_CHUNK)
    const rows = slice.map((uid) => ({
      user_id: uid,
      type: 'announcement' as const,
      title: params.title,
      message: params.message,
      link: null,
      is_read: false,
      metadata: { broadcast_id: broadcastRow?.id },
    }))
    const { error: nErr } = await admin.from('notifications').insert(rows)
    if (nErr) return { error: nErr.message }
  }

  revalidateAdmin()
  return { success: true, recipientCount }
}

export async function mentorApprove(mentorProfileId: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { data: row } = await admin.from('mentor_profiles').select('user_id').eq('id', mentorProfileId).single()
  if (!row?.user_id) return { error: 'Mentor not found' }

  const { error: upErr } = await admin
    .from('mentor_profiles')
    .update({
      is_verified: true,
      verification_status: 'approved',
      verification_rejection_reason: null,
    })
    .eq('id', mentorProfileId)

  if (upErr) return { error: upErr.message }

  await admin.from('notifications').insert({
    user_id: row.user_id,
    type: 'mentor_verification',
    title: 'Mentor verification approved',
    message: 'Your mentor profile has been approved. You now appear in the mentor directory.',
    link: '/mentors',
    is_read: false,
    metadata: {},
  })

  revalidateAdmin()
  return { success: true }
}

export async function mentorReject(mentorProfileId: string, reason: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { data: row } = await admin.from('mentor_profiles').select('user_id').eq('id', mentorProfileId).single()
  if (!row?.user_id) return { error: 'Mentor not found' }

  const { error: upErr } = await admin
    .from('mentor_profiles')
    .update({
      is_verified: false,
      verification_status: 'rejected',
      verification_rejection_reason: reason,
    })
    .eq('id', mentorProfileId)

  if (upErr) return { error: upErr.message }

  await admin.from('notifications').insert({
    user_id: row.user_id,
    type: 'mentor_rejected',
    title: 'Mentor verification update',
    message: `Your application was not approved. Reason: ${reason}. You may update your documents and resubmit.`,
    link: '/mentor-verification',
    is_read: false,
    metadata: {},
  })

  revalidateAdmin()
  return { success: true }
}

export async function mentorRevoke(mentorProfileId: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { data: row } = await admin.from('mentor_profiles').select('user_id').eq('id', mentorProfileId).single()
  if (!row?.user_id) return { error: 'Mentor not found' }

  const { error: upErr } = await admin
    .from('mentor_profiles')
    .update({
      is_verified: false,
      verification_status: 'revoked',
    })
    .eq('id', mentorProfileId)

  if (upErr) return { error: upErr.message }

  await admin.from('notifications').insert({
    user_id: row.user_id,
    type: 'system',
    title: 'Mentor verification revoked',
    message: 'Your verified mentor status has been revoked by an administrator.',
    link: '/mentor-verification',
    is_read: false,
    metadata: {},
  })

  revalidateAdmin()
  return { success: true }
}

export async function updateReportStatus(reportId: string, status: 'dismissed' | 'actioned') {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { error: upErr } = await admin.from('content_reports').update({ status }).eq('id', reportId)
  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function warnReportedUser(userId: string, message: string) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { error: nErr } = await admin.from('notifications').insert({
    user_id: userId,
    type: 'moderation_warning',
    title: 'Community guideline reminder',
    message,
    link: null,
    is_read: false,
    metadata: {},
  })
  if (nErr) return { error: nErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function removeReportedContent(
  contentType: 'idea' | 'task' | 'message',
  contentId: string,
) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  if (contentType === 'idea') {
    const { error: d } = await admin.from('research_ideas').delete().eq('id', contentId)
    if (d) return { error: d.message }
  } else if (contentType === 'task') {
    const { error: d } = await admin.from('tasks').delete().eq('id', contentId)
    if (d) return { error: d.message }
  } else {
    const { error: d } = await admin.from('messages').delete().eq('id', contentId)
    if (d) return { error: d.message }
  }

  revalidateAdmin()
  return { success: true }
}

export async function createUniversity(data: {
  name: string
  country: string
  university_type: 'federal' | 'state' | 'private'
  email_domain: string | null
}) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { error: insErr } = await admin.from('universities').insert({
    name: data.name,
    country: data.country,
    university_type: data.university_type,
    email_domain: data.email_domain,
    is_verified: true,
    is_active: true,
  })
  if (insErr) return { error: insErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function updateUniversity(
  id: string,
  data: Partial<{ name: string; country: string; university_type: string; email_domain: string | null; is_active: boolean }>,
) {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const { error: upErr } = await admin.from('universities').update(data).eq('id', id)
  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function setShowcaseStatus(entryId: string, status: 'published' | 'featured' | 'archived' | 'submitted') {
  const { error, admin } = await requireAdmin()
  if (error || !admin) return { error: error || 'Unauthorized' }

  const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'published' || status === 'featured') {
    patch.published_at = new Date().toISOString()
  }
  if (status === 'archived') {
    patch.published_at = null
  }

  const { error: upErr } = await admin.from('showcase_entries').update(patch).eq('id', entryId)
  if (upErr) return { error: upErr.message }
  revalidateAdmin()
  return { success: true }
}

export async function submitContentReport(params: {
  contentType: 'idea' | 'task' | 'message'
  contentId: string
  reason: string
}) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase.from('content_reports').insert({
    reporter_id: user.id,
    content_type: params.contentType,
    content_id: params.contentId,
    reason: params.reason,
    status: 'open',
  })
  if (error) return { error: error.message }
  revalidatePath('/admin/moderation')
  return { success: true }
}

export async function submitMentorVerification(data: {
  tier: 1 | 2 | 3
  institutionalEmail: string
  staffIdPath: string | null
  supervisorLetterPath: string | null
  specializations: string[]
  mentorship_areas: string[]
  available_slots: number
}) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: existing } = await supabase.from('mentor_profiles').select('id').eq('user_id', user.id).maybeSingle()

  const payload = {
    user_id: user.id,
    tier: data.tier,
    institutional_email: data.institutionalEmail,
    staff_id_document_url: data.staffIdPath,
    supervisor_letter_url: data.supervisorLetterPath,
    verification_status: 'pending' as const,
    verification_submitted_at: new Date().toISOString(),
    verification_rejection_reason: null,
    is_verified: false,
    specializations: data.specializations,
    mentorship_areas: data.mentorship_areas.length ? data.mentorship_areas : data.specializations,
    available_slots: data.available_slots,
    slots_used: 0,
    hourly_rate: null,
    total_sessions: 0,
    rating: 0,
    review_count: 0,
  }

  if (existing?.id) {
    const { error } = await supabase.from('mentor_profiles').update(payload).eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('mentor_profiles').insert(payload)
    if (error) return { error: error.message }
  }

  revalidatePath('/mentor-verification')
  revalidatePath('/admin/mentors')
  return { success: true }
}
