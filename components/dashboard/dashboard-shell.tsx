'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './sidebar'
import { PageTransition } from '@/components/ui/page-transition'
import { ScrollProgress } from '@/components/ui/scroll-progress'
import { Menu } from 'lucide-react'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Auto-close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <>
      <ScrollProgress />
      <div className="flex h-screen overflow-hidden bg-background">
        <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b border-border shrink-0 bg-background/95 backdrop-blur-sm z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex-1 text-sm font-semibold text-foreground">
              ResearchFlow
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 md:pb-6">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </>
  )
}
