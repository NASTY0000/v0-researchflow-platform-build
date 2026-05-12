'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[Onboarding Error]', error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: '#05010F' }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center space-y-5"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(239,68,68,0.3)',
        }}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
          style={{ background: 'rgba(239,68,68,0.1)' }}
        >
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold font-heading" style={{ color: '#F3F0FF' }}>
            Could not load onboarding
          </h2>
          <p className="text-sm mt-2" style={{ color: '#7C6A9C' }}>
            There was a problem loading your onboarding. Please try again.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            onClick={() => router.push('/auth/login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(139,92,246,0.3)',
              color: '#C084FC',
            }}
          >
            Back to Login
          </Button>
          <Button
            onClick={() => {
              router.refresh()
              reset()
            }}
            style={{
              background: 'linear-gradient(135deg,#7C3AED,#A855F7)',
              border: 'none',
            }}
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  )
}
