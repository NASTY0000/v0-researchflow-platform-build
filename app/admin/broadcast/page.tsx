import { redirect } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { BroadcastAdminClient } from '@/components/admin/broadcast-admin-client'
import type { Broadcast, University } from '@/lib/types/database'

type BroadcastRow = Broadcast

export default async function AdminBroadcastPage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const [{ data: history }, { data: universities }] = await Promise.all([
    admin.from('broadcasts').select('*').order('created_at', { ascending: false }).limit(50),
    admin.from('universities').select('*').order('name'),
  ])

  const rows = (history || []) as BroadcastRow[]

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Broadcast notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">Send in-app announcements to targeted users</p>
      </div>

      <BroadcastAdminClient universities={(universities || []) as University[]} />

      <div>
        <h2 className="text-lg font-semibold mb-3">Broadcast history</h2>
        <div className="rounded-md border divide-y">
          {rows.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">No broadcasts yet.</p>
          )}
          {rows.map((b) => (
            <div key={b.id} className="p-4 text-sm space-y-1">
              <div className="font-medium">{b.title}</div>
              <div className="text-muted-foreground text-xs">
                {new Date(b.created_at).toLocaleString()} · Audience: {b.audience}
                {b.audience_filter ? ` (${b.audience_filter})` : ''} · Recipients: {b.recipient_count}
              </div>
              <div className="text-xs text-muted-foreground">Sent by user {b.sent_by.slice(0, 8)}…</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
