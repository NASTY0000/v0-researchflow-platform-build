import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { AdminUsersPanel } from '@/components/admin/admin-users-panel'
import type { Profile, University, UserRole } from '@/lib/types/database'

const PAGE_SIZE = 50

type Search = {
  q?: string
  role?: string
  university?: string
  status?: string
  page?: string
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Search }) {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = admin
    .from('profiles')
    .select('*, university:universities(*)', { count: 'exact' })
    .order('created_at', { ascending: false })

  const q = searchParams.q?.trim()
  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
  }
  if (searchParams.role) {
    query = query.contains('roles', [searchParams.role as UserRole])
  }
  if (searchParams.university) {
    query = query.eq('university_id', searchParams.university)
  }
  if (searchParams.status === 'suspended' || searchParams.status === 'active') {
    query = query.eq('account_status', searchParams.status)
  }

  const { data: rows, count, error } = await query.range(from, to)

  const { data: universities } = await admin.from('universities').select('*').order('name')

  if (error) {
    return (
      <div className="text-destructive text-sm">
        Failed to load users: {error.message}
      </div>
    )
  }

  const users = (rows || []) as (Profile & { university?: University })[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">User management</h1>
        <p className="text-sm text-muted-foreground mt-1">Search, filter, and moderate accounts</p>
      </div>
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading filters…</div>}>
        <AdminUsersPanel
          users={users}
          universities={(universities || []) as University[]}
          page={page}
          totalPages={totalPages}
          total={total}
          filters={{
            q: searchParams.q,
            role: searchParams.role,
            university: searchParams.university,
            status: searchParams.status,
          }}
        />
      </Suspense>
    </div>
  )
}
