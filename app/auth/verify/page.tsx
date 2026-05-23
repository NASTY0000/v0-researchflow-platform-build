'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, RefreshCw, ArrowLeft, KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { verifyOtp, resendOtp } from '@/lib/actions/auth'

function VerifyPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''

  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [resendMsg, setResendMsg] = useState('')

  // Poll for session — covers magic-link clicks in another tab
  useEffect(() => {
    const supabase = createClient()
    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        clearInterval(interval)
        router.push('/onboarding')
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [router])

  async function handleVerifyOtp() {
    const code = otpDigits.join('')
    if (code.length !== 6) { setError('Please enter the complete 6-digit code'); return }

    setIsVerifying(true)
    setError('')

    try {
      const result = await verifyOtp(email, code)

      if (result?.error) {
        setError(result.error)
        setIsVerifying(false)
        return
      }

      if (result?.success) {
        router.push('/onboarding')
        return
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed')
      setIsVerifying(false)
    }
  }

  async function handleResend() {
    if (!email) return
    setIsResending(true)
    setResendMsg('')
    setError('')
    const result = await resendOtp(email)
    if (result?.error) {
      setError(result.error)
    } else {
      setResendMsg('Verification email sent! Check your inbox.')
      setTimeout(() => setResendMsg(''), 4000)
    }
    setIsResending(false)
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return
    const next = [...otpDigits]
    next[index] = value
    setOtpDigits(next)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0)
      document.getElementById(`otp-${index - 1}`)?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      const d = pasted.split('').concat(Array(6).fill('')).slice(0, 6)
      setOtpDigits(d)
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus()
    }
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(139,92,246,0.2)',
    backdropFilter: 'blur(16px)',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#05010F' }}>
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
            <span className="text-2xl font-bold font-heading" style={{ background: 'linear-gradient(135deg,#06B6D4,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              ResearchFlow
            </span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl space-y-6" style={cardStyle}>
          {/* Icon */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Mail className="w-8 h-8" style={{ color: '#A855F7' }} />
            </div>
            <h1 className="text-2xl font-bold font-heading" style={{ color: '#F3F0FF' }}>Verify your email</h1>
            <p className="text-sm" style={{ color: '#7C6A9C' }}>
              We sent a 6-digit code to{' '}
              {email ? <strong style={{ color: '#C084FC' }}>{email}</strong> : 'your email'}
              . Enter it below or click the link in the email.
            </p>
          </div>

          {/* OTP inputs */}
          <div className="space-y-3">
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className="w-11 h-12 text-center text-lg font-bold rounded-lg outline-none transition-all"
                  style={{
                    background: 'rgba(139,92,246,0.08)',
                    border: `1px solid ${digit ? 'rgba(168,85,247,0.6)' : 'rgba(139,92,246,0.25)'}`,
                    color: '#F3F0FF',
                    caretColor: '#A855F7',
                  }}
                />
              ))}
            </div>

            {error && (
              <div className="py-2 px-4 rounded-lg text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444' }}>
                {error}
              </div>
            )}
            {resendMsg && (
              <div className="py-2 px-4 rounded-lg text-sm text-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22C55E' }}>
                {resendMsg}
              </div>
            )}

            <Button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otpDigits.join('').length !== 6}
              className="w-full gap-2"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', border: 'none', color: '#F3F0FF', borderRadius: '8px' }}
            >
              {isVerifying
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                : <><KeyRound className="w-4 h-4" /> Verify Code</>}
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.15)' }} />
            <span className="text-xs" style={{ color: '#4A3F6B' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(139,92,246,0.15)' }} />
          </div>

          <Button
            onClick={handleResend}
            disabled={isResending}
            variant="outline"
            className="w-full gap-2"
            style={{ borderColor: 'rgba(139,92,246,0.3)', color: '#7C6A9C', background: 'transparent', borderRadius: '8px' }}
          >
            {isResending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
              : <><RefreshCw className="w-4 h-4" /> Resend email</>}
          </Button>

          <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}>
            <Link href="/auth/signup" className="inline-flex items-center gap-1.5 text-sm" style={{ color: '#7C6A9C' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Wrong email?
            </Link>
            <div className="flex items-center gap-2" style={{ color: '#4A3F6B' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#A855F7' }} />
              <span className="text-xs">Waiting for link...</span>
            </div>
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
