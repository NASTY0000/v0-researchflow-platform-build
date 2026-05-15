'use server'

import { createClient } from '@/lib/supabase/server'

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
