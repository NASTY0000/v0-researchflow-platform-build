'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { Loader2, Mail, Lock, User, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react'
import { signUp, signInWithGoogle } from '@/lib/actions/auth'

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

export default function SignUpPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'signup' | 'done'>('signup')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [emailType, setEmailType] = useState<'personal' | 'institutional'>('personal')
  const [showPassword, setShowPassword] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError(null)

    formData.set('emailType', emailType)

    const result = await signUp(formData)

    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    if (result?.requiresVerification) {
      setSentToEmail(result.email as string)
      setVerificationSent(true)
      setIsLoading(false)
      return
    }

    if (result?.success) {
      setStep('done')
      setTimeout(() => router.push((result.redirectTo as string) || '/onboarding'), 1500)
    }
  }

  const bg = (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full hidden dark:block" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)' }} />
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full hidden dark:block" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.12),transparent 70%)' }} />
    </div>
  )

  // Success screen
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-background">
        {bg}
        <div className="text-center relative animate-fade-up">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-500/15 border border-green-500/30">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold font-heading mb-2">Account Created!</h2>
          <p className="text-muted-foreground">Redirecting to onboarding...</p>
          <Loader2 className="w-5 h-5 animate-spin mx-auto mt-4 text-primary" />
        </div>
      </div>
    )
  }

  // Email verification sent screen
  if (verificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        {bg}
        <div className="max-w-md w-full text-center space-y-6 relative animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
            <span className="text-4xl">📧</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold font-heading">Check your email</h2>
            <p className="text-muted-foreground">We sent a verification link to</p>
            <p className="font-semibold text-primary">{sentToEmail}</p>
            <p className="text-muted-foreground text-sm">
              Click the link in the email to verify your account and complete your profile setup.
            </p>
          </div>

          <div className="bg-muted rounded-xl p-4 text-sm text-muted-foreground space-y-1 text-left">
            <p>✉️ Check your spam folder too</p>
            <p>⏱ Link expires in 24 hours</p>
            <p>🔒 Your account is secure</p>
          </div>

          <button
            onClick={() => { setVerificationSent(false); setError(null) }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Wrong email? Go back
          </button>
        </div>
      </div>
    )
  }

  // Sign up form
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {bg}
      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="full" width={120} />
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border backdrop-blur-xl">
          <h1 className="text-2xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.02em' }}>Create your account</h1>
          <p className="text-sm mb-6 text-muted-foreground">Join thousands of researchers across Africa</p>

          {error && (
            <Alert variant="destructive" className="mb-5">
              <AlertDescription>
                {error}
                {error.toLowerCase().includes('already') && (
                  <span className="block mt-1 text-xs opacity-80">
                    Having trouble? Check your email for a verification link, or contact{' '}
                    <a href="mailto:support@researchflowafrica.com" className="underline">
                      support@researchflowafrica.com
                    </a>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form action={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="fullName" name="fullName" type="text" placeholder="Your full name" required className="pl-10" />
              </div>
            </div>

            {/* Email Type Toggle */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email Type</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEmailType('personal')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border"
                  style={emailType === 'personal'
                    ? { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(168,85,247,0.5)', color: 'var(--primary)' }
                    : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  Personal Email
                </button>
                <button
                  type="button"
                  onClick={() => setEmailType('institutional')}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all border"
                  style={emailType === 'institutional'
                    ? { background: 'rgba(124,58,237,0.2)', borderColor: 'rgba(168,85,247,0.5)', color: 'var(--primary)' }
                    : { background: 'transparent', borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                  }
                >
                  Institutional Email
                </button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">
                {emailType === 'personal' ? 'Personal Email Address' : 'Institutional Email Address'}
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={emailType === 'personal' ? 'you@gmail.com' : 'name@oou.edu.ng'}
                  required
                  className="pl-10"
                />
              </div>
              {emailType === 'institutional' && (
                <p className="text-xs text-muted-foreground">
                  Use your official university email (e.g. name@oou.edu.ng)
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-10 mt-2" disabled={isLoading || isGoogleLoading}
              style={{ background: 'var(--cta-bg)', boxShadow: 'var(--brand-glow)', border: 'none', borderRadius: '8px', color: '#fff' }}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : 'Create account'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-xs uppercase bg-card text-muted-foreground" style={{ letterSpacing: '0.1em' }}>Or continue with</span>
            </div>
          </div>

          <form action={async () => {
            setIsGoogleLoading(true); setError(null)
            const result = await signInWithGoogle()
            if (result?.error) { setError(result.error); setIsGoogleLoading(false) }
            else if (result?.url) { window.location.href = result.url }
          }}>
            <Button type="submit" variant="outline" className="w-full h-10" disabled={isLoading || isGoogleLoading}>
              {isGoogleLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : <><GoogleIcon className="mr-2 h-4 w-4" />Continue with Google</>}
            </Button>
          </form>

          <p className="text-xs mt-5 text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary">Terms</Link> and{' '}
            <Link href="/privacy" className="text-primary">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-primary">Sign in</Link>
        </p>

        <Link href="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 justify-center mt-4">
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
