import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import type { Profile } from '@/lib/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only redirect to onboarding if the query succeeded AND onboarding is
  // confirmed incomplete. Never redirect on a query error — that would
  // cause the /dashboard ↔ /onboarding infinite loop.
  if (!profileError && profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  // Safe cast: for an authenticated user with completed onboarding the
  // profile row always exists. The cast handles the rare DB-error path
  // where profile may be null — sidebar/header guard against null access.
  const layoutProfile = profile as Profile

  // Fetch unread notifications count
  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <SidebarProvider>
      <DashboardSidebar profile={layoutProfile} />
      <SidebarInset>
        <DashboardHeader profile={layoutProfile} unreadCount={unreadCount || 0} />
        <main className="flex-1 p-4 lg:p-6" style={{ backgroundColor: '#05010F', minHeight: '100vh' }}>
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
