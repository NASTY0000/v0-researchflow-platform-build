'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertTriangle className="w-8 h-8" style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-xl font-bold font-heading mb-2">Something went wrong.</h2>
        <p className="text-sm mb-6 text-muted-foreground">
          Please refresh the page. If the problem persists, try signing out and back in.
        </p>
        <Button
          onClick={reset}
          style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', borderRadius: '8px', color: '#F3F0FF', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
        >
          Refresh page
        </Button>
      </div>
    </div>
  )
}
