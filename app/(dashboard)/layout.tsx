import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { PageTransition } from '@/components/ui/page-transition'
import { ScrollProgress } from '@/components/ui/scroll-progress'

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

  if (!profileError && profile && profile.onboarding_completed === false) {
    redirect('/onboarding')
  }

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false)

  const { data: mentorProfile } = await supabase
    .from('mentor_profiles')
    .select('is_verified')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <>
      <ScrollProgress />
      <SidebarProvider>
        <DashboardSidebar profile={profile} isVerifiedMentor={mentorProfile?.is_verified === true} />
        <SidebarInset>
          <DashboardHeader profile={profile} unreadCount={unreadCount || 0} />
          <main className="flex-1 p-4 lg:p-6 pb-20 md:pb-6 bg-background min-h-screen">
            <PageTransition>{children}</PageTransition>
          </main>
        </SidebarInset>
      </SidebarProvider>
      <MobileNav initialUnreadCount={unreadCount || 0} />
      <GlobalSearch />
    </>
  )
}
