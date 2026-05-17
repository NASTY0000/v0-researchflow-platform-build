'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, RefreshCw, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { resendOtp } from '@/lib/actions/auth'

function VerifyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [isResending, setIsResending] = useState(false)
  const [resendMsg, setResendMsg] = useState('')
  const [resendError, setResendError] = useState('')

  // Poll for session every 5 seconds
  useEffect(() => {
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        clearInterval(interval)
        router.push('/onboarding')
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [router])

  async function handleResend() {
    if (!email) return
    setIsResending(true)
    setResendMsg('')
    setResendError('')
    const result = await resendOtp(email)
    if (result.error) {
      setResendError(result.error)
    } else {
      setResendMsg('Verification email sent! Check your inbox.')
    }
    setIsResending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#05010F' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.12),transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={40} height={40} className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold font-heading" style={{ background: 'linear-gradient(135deg,#06B6D4,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ResearchFlow</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl text-center space-y-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
          {/* Icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <Mail className="w-10 h-10" style={{ color: '#A855F7' }} />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold font-heading" style={{ color: '#F3F0FF' }}>Check your inbox</h1>
            <p className="text-sm" style={{ color: '#7C6A9C' }}>
              We sent a verification link to{' '}
              {email && <strong style={{ color: '#C084FC' }}>{email}</strong>}
              {!email && <span>your email address</span>}.
              Click it to activate your account.
            </p>
          </div>

          {resendMsg && (
            <div className="py-2 px-4 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}>
              {resendMsg}
            </div>
          )}
          {resendError && (
            <div className="py-2 px-4 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
              {resendError}
            </div>
          )}

          <Button
            onClick={handleResend}
            disabled={isResending}
            className="w-full"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', color: '#F3F0FF', borderRadius: '8px' }}
          >
            {isResending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
            ) : (
              <><RefreshCw className="w-4 h-4 mr-2" />Resend email</>
            )}
          </Button>

          <p className="text-xs" style={{ color: '#4A3F6B' }}>
            Check your spam folder if you don&apos;t see it within 2 minutes.
          </p>

          <div className="pt-2 border-t" style={{ borderColor: 'rgba(139,92,246,0.15)' }}>
            <Link href="/auth/signup" className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#7C6A9C' }}>
              <ArrowLeft className="w-3.5 h-3.5" />
              Wrong email? Go back
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2" style={{ color: '#4A3F6B' }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#A855F7' }} />
            <span className="text-xs">Waiting for verification...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#05010F' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#A855F7' }} />
      </div>
    }>
      <VerifyPageInner />
    </Suspense>
  )
}
