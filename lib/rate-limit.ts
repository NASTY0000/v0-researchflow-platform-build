import { createServiceRoleClient } from '@/lib/supabase/admin'

export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const admin = createServiceRoleClient()
    const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString()
    const { count } = await admin
      .from('rate_limit_logs')
      .select('id', { count: 'exact', head: true })
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('created_at', windowStart)

    const attempts = count ?? 0
    if (attempts >= maxAttempts) {
      return { allowed: false, remaining: 0 }
    }
    await admin.from('rate_limit_logs').insert({
      identifier,
      action,
      created_at: new Date().toISOString(),
    })
    return { allowed: true, remaining: maxAttempts - attempts - 1 }
  } catch {
    // If rate_limit_logs table doesn't exist yet, allow the request
    return { allowed: true, remaining: maxAttempts - 1 }
  }
}
