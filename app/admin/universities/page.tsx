import { redirect } from 'next/navigation'
import { assertAdmin, createServiceRoleClient } from '@/lib/supabase/admin'
import { UniversitiesAdminForm } from '@/components/admin/universities-admin-form'
import type { University } from '@/lib/types/database'

export default async function AdminUniversitiesPage() {
  const gate = await assertAdmin()
  if (!gate.ok) redirect('/dashboard')

  const admin = createServiceRoleClient()
  const { data } = await admin.from('universities').select('*').order('name')

  const rows = (data || []) as University[]

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-heading">Universities</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage institution directory</p>
      </div>

      <UniversitiesAdminForm initialUniversities={rows} />
    </div>
  )
}
