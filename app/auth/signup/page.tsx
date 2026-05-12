'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Loader2, Mail, Lock, User, CheckCircle } from 'lucide-react'
import { signUp, signInWithGoogle, verifyOtp, resendOtp } from '@/lib/actions/auth'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

const inputStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(139,92,246,0.25)',
  color: '#F3F0FF',
  borderRadius: '8px',
}

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [step, setStep] = useState<'signup' | 'verify' | 'done'>('signup')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [emailType, setEmailType] = useState<'personal' | 'institutional'>('personal')

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)
    
    formData.set('emailType', emailType)
    
    const result = await signUp(formData)
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result?.success) {
      if (result?.autoConfirmed && result?.redirectTo) {
        // User was auto-confirmed, navigate immediately
        router.push(result.redirectTo)
      } else if (result?.requiresVerification && result?.email) {
        setEmail(result.email)
        setStep('verify')
        setIsLoading(false)
      } else {
        setStep('done')
        setTimeout(() => router.push('/onboarding'), 1500)
      }
    }
  }

  async function handleVerifyOtp() {
    setIsVerifying(true)
    setError(null)
    const token = otpDigits.join('')
    if (token.length !== 6) { setError('Please enter the complete 6-digit code'); setIsVerifying(false); return }
    const result = await verifyOtp(email, token)
    if (result?.error) { 
      setError(result.error)
      setIsVerifying(false) 
    } else if (result?.redirectTo) {
      router.push(result.redirectTo)
    }
  }

  async function handleResendCode() {
    setIsResending(true); setError(null)
    const result = await resendOtp(email)
    if (result?.error) { setError(result.error) }
    else { setSuccessMsg('Code resent!'); setTimeout(() => setSuccessMsg(null), 3000) }
    setIsResending(false)
  }

  function handleOtpChange(index: number, value: string) {
    if (value && !/^\d$/.test(value)) return
    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)
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
      const d = [...otpDigits]
      for (let i = 0; i < pasted.length; i++) d[i] = pasted[i]
      setOtpDigits(d)
      document.getElementById(`otp-${Math.min(pasted.length, 5)}`)?.focus()
    }
  }

  const bg = (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)' }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.12),transparent 70%)' }} />
    </div>
  )

  // Success screen
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: '#05010F' }}>
        {bg}
        <div className="text-center relative animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <CheckCircle className="w-10 h-10" style={{ color: '#22C55E' }} />
          </div>
          <h2 className="text-3xl font-bold font-heading mb-2">Account Created!</h2>
          <p style={{ color: '#7C6A9C' }}>Redirecting to onboarding...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4" style={{ color: '#A855F7' }} />
        </div>
      </div>
    )
  }

  // OTP verification screen
  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#05010F' }}>
        {bg}
        <div className="w-full max-w-md relative animate-fade-up">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl overflow-hidden">
                <Image src="/icon.svg" alt="ResearchFlow" width={40} height={40} className="w-10 h-10" />
              </div>
              <span className="text-2xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
            </Link>
          </div>

          <div className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Mail className="w-7 h-7" style={{ color: '#A855F7' }} />
            </div>
            <h1 className="text-2xl font-bold font-heading mb-1 text-center" style={{ letterSpacing: '-0.02em' }}>Check your email</h1>
            <p className="text-sm text-center mb-6" style={{ color: '#7C6A9C' }}>
              We sent a 6-digit code to <span style={{ color: '#C084FC' }}>{email}</span>
            </p>

            {error && (
              <Alert variant="destructive" className="mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {successMsg && (
              <Alert className="mb-5" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <AlertDescription style={{ color: '#22C55E' }}>{successMsg}</AlertDescription>
              </Alert>
            )}

            {/* OTP Inputs */}
            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
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
                  className="w-12 h-14 text-center text-xl font-bold rounded-xl outline-none transition-all"
                  style={{
                    background: digit ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${digit ? 'rgba(168,85,247,0.6)' : 'rgba(139,92,246,0.25)'}`,
                    color: '#F3F0FF',
                    boxShadow: digit ? '0 0 12px rgba(124,58,237,0.25)' : 'none',
                  }}
                />
              ))}
            </div>

            <Button className="w-full h-10" onClick={handleVerifyOtp} disabled={isVerifying || otpDigits.some(d => !d)}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none', borderRadius: '8px', color: '#F3F0FF' }}>
              {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify Email'}
            </Button>

            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm" style={{ color: '#7C6A9C' }}>Didn&apos;t receive it?</span>
              <button onClick={handleResendCode} disabled={isResending} className="text-sm font-medium" style={{ color: '#A855F7' }}>
                {isResending ? 'Resending...' : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Sign up form
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#05010F' }}>
      {bg}
      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={40} height={40} className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
          <h1 className="text-2xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.02em' }}>Create your account</h1>
          <p className="text-sm mb-6" style={{ color: '#7C6A9C' }}>Join thousands of researchers across Africa</p>

          {error && (
            <Alert variant="destructive" className="mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium" style={{ color: '#7C6A9C' }}>Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                <Input id="fullName" name="fullName" type="text" placeholder="Your full name" required className="pl-10" style={inputStyle} />
              </div>
            </div>

            {/* Email Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium" style={{ color: '#7C6A9C' }}>Email Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmailType('personal')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
                  style={emailType === 'personal' 
                    ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#C084FC' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
                  }
                >
                  Personal Email
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType('institutional')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all"
                  style={emailType === 'institutional' 
                    ? { background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.5)', color: '#C084FC' }
                    : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', color: '#7C6A9C' }
                  }
                >
                  Institutional Email
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#7C6A9C' }}>
                {emailType === 'personal' ? 'Personal Email Address' : 'Institutional Email Address'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder={emailType === 'personal' ? 'you@gmail.com' : 'name@oou.edu.ng'}
                  required 
                  className="pl-10" 
                  style={inputStyle} 
                />
              </div>
              {emailType === 'institutional' && (
                <p className="text-xs" style={{ color: '#7C6A9C' }}>
                  Use your official university email (e.g. name@oou.edu.ng)
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#7C6A9C' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                <Input id="password" name="password" type="password" placeholder="At least 8 characters" required minLength={8} className="pl-10" style={inputStyle} />
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading || isGoogleLoading}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none', borderRadius: '8px', color: '#F3F0FF' }}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full" style={{ borderTop: '1px solid rgba(139,92,246,0.2)' }} />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs uppercase" style={{ background: 'transparent', color: '#7C6A9C', letterSpacing: '0.1em' }}>Or continue with</span>
            </div>
          </div>

          <form action={async () => {
            setIsGoogleLoading(true); setError(null)
            const result = await signInWithGoogle()
            if (result?.error) { setError(result.error); setIsGoogleLoading(false) }
            else if (result?.url) { window.location.href = result.url }
          }}>
            <Button type="submit" variant="outline" className="w-full h-10" disabled={isLoading || isGoogleLoading}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', borderRadius: '8px' }}>
              {isGoogleLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : <><GoogleIcon className="mr-2 h-4 w-4" />Continue with Google</>}
            </Button>
          </form>

          <p className="text-xs mt-5" style={{ color: '#7C6A9C' }}>
            By creating an account, you agree to our{' '}
            <Link href="/terms" style={{ color: '#A855F7' }}>Terms</Link> and{' '}
            <Link href="/privacy" style={{ color: '#A855F7' }}>Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#7C6A9C' }}>
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium" style={{ color: '#A855F7' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
