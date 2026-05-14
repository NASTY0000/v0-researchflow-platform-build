import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export const SUSPENDED_LOGIN_MESSAGE =
  'Your account has been suspended. Contact support@researchflowafrica.com'

export function createServiceRoleClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function assertAdmin(): Promise<
  { ok: true; userId: string } | { ok: false; error: string }
> {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Unauthorized' }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (error) return { ok: false, error: 'Forbidden' }

  const row = profile as { is_admin?: boolean } | null
  if (!row?.is_admin) return { ok: false, error: 'Forbidden' }

  return { ok: true, userId: user.id }
}

export function isProfileSuspended(accountStatus?: string, suspendedUntil?: string | null) {
  if (accountStatus !== 'suspended') return false
  if (!suspendedUntil) return true
  return new Date(suspendedUntil) > new Date()
}
