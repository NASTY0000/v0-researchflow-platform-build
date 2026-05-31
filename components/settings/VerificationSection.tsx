'use client'

import { useState } from 'react'
import { sendVerificationOTP, verifyOTP, checkUniversityEmail } from '@/lib/actions/verification'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'

interface VerificationSectionProps {
  isVerified: boolean
  universityName?: string | null
  universityEmail?: string | null
}

export function VerificationSection({
  isVerified: initialVerified,
  universityName,
  universityEmail,
}: VerificationSectionProps) {
  const [step, setStep] = useState<'idle' | 'enter-email' | 'enter-otp' | 'success'>(
    initialVerified ? 'idle' : 'enter-email'
  )
  const [email, setEmail] = useState('')
  const [emailCheck, setEmailCheck] = useState<{ isValid: boolean; universityName?: string } | null>(null)
  const [otp, setOtp] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(initialVerified)

  async function handleEmailChange(val: string) {
    setEmail(val)
    setEmailCheck(null)
    setError(null)
    if (val.includes('@') && val.split('@')[1]?.includes('.')) {
      const result = await checkUniversityEmail(val)
      setEmailCheck(result)
    }
  }

  async function handleSendOTP() {
    setIsLoading(true)
    setError(null)
    const result = await sendVerificationOTP(email)
    setIsLoading(false)
    if (result.success) {
      setStep('enter-otp')
    } else {
      setError(result.error ?? 'Failed to send code')
    }
  }

  async function handleVerifyOTP() {
    setIsLoading(true)
    setError(null)
    const result = await verifyOTP(otp)
    setIsLoading(false)
    if (result.success) {
      setIsVerified(true)
      setStep('success')
    } else {
      setError(result.error ?? 'Incorrect code')
    }
  }

  if (isVerified && step !== 'success') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/20">
          <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center text-green-400 text-lg flex-shrink-0">
            ✓
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">Identity Verified</p>
              <VerifiedBadge universityName={universityName} size="sm" />
            </div>
            <p className="text-xs text-green-400/70 mt-0.5">
              {universityName ? `Verified at ${universityName}` : 'University email verified'}
              {universityEmail && (
                <span className="text-muted-foreground/50 ml-1">· {universityEmail}</span>
              )}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: '🔍', text: 'Higher search visibility' },
            { icon: '🤝', text: 'Trust signal for collaborators' },
            { icon: '🏆', text: 'Challenges eligibility' },
            { icon: '⚡', text: 'Akili Score boost' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
              <span className="text-sm">{item.icon}</span>
              <span className="text-xs text-muted-foreground">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold flex items-center gap-2">
          🎓 Institutional Verification
        </h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Verify your university email to earn a Verified badge and unlock higher visibility across the platform.
        </p>
      </div>

      {step === 'success' ? (
        <div className="p-5 rounded-xl bg-green-500/8 border border-green-500/20 text-center">
          <div className="text-3xl mb-3">🎉</div>
          <p className="text-sm font-bold mb-1">You are now verified!</p>
          <p className="text-xs text-green-400/70">
            Your Verified badge is now live on your profile. You also earned +50 Akili points.
          </p>
        </div>

      ) : step === 'enter-email' ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              University Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              placeholder="you@university.edu.ng"
              className="w-full h-11 px-4 rounded-xl text-sm bg-muted/30 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:bg-primary/5 transition-colors"
            />
            {emailCheck !== null && (
              <div className={`mt-2 flex items-center gap-2 text-xs font-medium ${emailCheck.isValid ? 'text-green-500' : 'text-red-400/70'}`}>
                {emailCheck.isValid ? (
                  <>
                    <span>✓</span>
                    <span>{emailCheck.universityName ? `Recognised: ${emailCheck.universityName}` : 'Valid university domain'}</span>
                  </>
                ) : (
                  <>
                    <span>✗</span>
                    <span>Domain not recognised. Must be an African university email.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {error && <p className="text-destructive text-xs">{error}</p>}

          <button
            onClick={handleSendOTP}
            disabled={isLoading || !emailCheck?.isValid}
            className="w-full h-11 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '↻ Sending...' : 'Send Verification Code'}
          </button>

          <div className="p-3 rounded-xl bg-muted/20 border border-border space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Why verify?</p>
            {[
              'Verified badge on your profile',
              'Higher visibility in researcher search',
              'Increased credibility with collaborators',
              '+50 Akili knowledge points',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-primary">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

      ) : (
        // enter-otp step
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-primary/8 border border-primary/20 text-sm text-muted-foreground">
            A 6-digit code was sent to{' '}
            <strong className="text-foreground">{email}</strong>. Check your inbox and spam folder.
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
              Verification Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
              placeholder="123456"
              className="w-full h-14 px-4 rounded-xl text-center text-2xl font-black tracking-widest bg-muted/30 border border-border text-amber-500 placeholder:text-muted-foreground/20 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {error && <p className="text-destructive text-xs text-center">{error}</p>}

          <button
            onClick={handleVerifyOTP}
            disabled={isLoading || otp.length !== 6}
            className="w-full h-11 rounded-xl text-sm font-semibold transition-all bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? '↻ Verifying...' : 'Verify My Account'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => { setStep('enter-email'); setOtp(''); setError(null) }}
              className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              ← Use a different email
            </button>
            <button
              onClick={handleSendOTP}
              disabled={isLoading}
              className="flex-1 text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Resend code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
