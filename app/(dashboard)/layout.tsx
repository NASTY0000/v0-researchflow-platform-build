import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { MobileNav } from '@/components/dashboard/mobile-nav'
import { GlobalSearch } from '@/components/dashboard/global-search'

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

  return (
    <>
      <DashboardShell>{children}</DashboardShell>
      <MobileNav initialUnreadCount={0} />
      <GlobalSearch />
    </>
  )
}
