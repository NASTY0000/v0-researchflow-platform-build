import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

function isPlatformAdmin(profile: { is_admin?: boolean; roles?: string[] | null }) {
  return profile.is_admin === true || profile.roles?.includes('admin') === true
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login?redirect=/admin')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    redirect('/auth/login')
  }

  if (!profile.onboarding_completed) {
    redirect('/onboarding')
  }

  if (!isPlatformAdmin(profile)) {
    redirect('/dashboard')
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <SidebarProvider>
      <AdminSidebar profile={profile} />
      <SidebarInset>
        <AdminHeader unreadCount={unreadCount || 0} />
        <main
          className="flex-1 p-4 lg:p-6"
          style={{ backgroundColor: '#05010F', minHeight: '100vh' }}
        >
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
