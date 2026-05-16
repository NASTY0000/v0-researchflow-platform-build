import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Shield } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('roles, is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.is_admin === true || profile?.roles?.includes('admin')
  if (!isAdmin) redirect('/dashboard')

  // Fetch pending counts for sidebar badges
  const [mentorCount, showcaseCount, reportCount] = await Promise.all([
    supabase.from('mentor_profiles').select('id', { count: 'exact', head: true }).eq('is_verified', false),
    supabase.from('showcase_submissions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('content_reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return (
    <SidebarProvider>
      <AdminSidebar
        pendingMentors={mentorCount.count || 0}
        pendingShowcase={showcaseCount.count || 0}
        pendingReports={reportCount.count || 0}
      />
      <SidebarInset>
        {/* Admin header */}
        <header className="flex h-14 items-center gap-4 border-b px-4 sticky top-0 z-10 bg-background/90 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Admin Panel</span>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              ResearchFlow
            </Badge>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 bg-background min-h-screen">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
