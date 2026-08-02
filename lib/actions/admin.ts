'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function loadAdminUsers({
  search,
  roleFilter,
  statusFilter,
  page,
  pageSize,
}: {
  search: string
  roleFilter: string
  statusFilter: string
  page: number
  pageSize: number
}) {
  const admin = createServiceRoleClient()

  const from = page * pageSize
  const to = from + pageSize - 1

  // Build filter function
  type Query = ReturnType<typeof admin.from>
  const applyFilters = (q: any) => {
    if (search.trim()) {
      q = q.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`)
    }
    if (roleFilter !== 'all') q = q.contains('roles', [roleFilter])
    if (statusFilter === 'suspended') q = q.eq('is_suspended', true)
    else if (statusFilter === 'active') q = q.eq('is_suspended', false).eq('onboarding_completed', true)
    else if (statusFilter === 'onboarding') q = q.eq('onboarding_completed', false)
    // 'all', no extra filter
    return q
  }

  // Count
  const { count } = await applyFilters(
    admin.from('profiles').select('id', { count: 'exact', head: true })
  )

  // Profiles
  const { data: profiles, error } = await applyFilters(
    admin.from('profiles').select('*')
  ).order('created_at', { ascending: false }).range(from, to)

  if (error) {
    console.error('Admin users query error:', error)
    return { error: error.message, users: [], count: 0 }
  }

  // Resolve UUID university_ids separately
  const uuidIds = (profiles || [])
    .map((p: any) => p.university_id)
    .filter((uid: any): uid is string => !!uid && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(uid))

  const uniMap = new Map<string, string>()
  if (uuidIds.length > 0) {
    const { data: unis } = await admin
      .from('universities')
      .select('id, name')
      .in('id', uuidIds)
    unis?.forEach((u: any) => uniMap.set(u.id, u.name))
  }

  const users = (profiles || []).map((p: any) => ({
    ...p,
    universityName: p.university_id && /^[0-9a-f]{8}-[0-9a-f]{4}/.test(p.university_id)
      ? (uniMap.get(p.university_id) || '')
      : (p.university_id || ''),
  }))

  return { users, count: count || 0, error: null }
}

export async function submitContentReport({
  contentType,
  contentId,
  reason,
}: {
  contentType: 'idea' | 'task' | 'message'
  contentId: string
  reason: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('content_reports')
    .insert({
      reporter_id: user.id,
      content_type: contentType,
      content_id: contentId,
      reason,
      status: 'open',
    })

  if (error) return { error: error.message }
  return { success: true }
}
