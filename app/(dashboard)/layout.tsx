import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'

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

  // FIXED: removed university:universities(*) join
  // That join was failing because university stores
  // plain text not a UUID, making profile return null,
  // which caused the infinite redirect loop
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Only redirect if profile loaded successfully
  // AND onboarding is confirmed not complete.
  // Never redirect on a query error — that caused the loop.
  if (!profileError && profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  return (
    <SidebarProvider>
      <DashboardSidebar profile={profile} />
      <SidebarInset>
        <DashboardHeader profile={profile} unreadCount={unreadCount || 0} />
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
