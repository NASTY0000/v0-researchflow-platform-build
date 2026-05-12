'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Play } from 'lucide-react'
import { signIn, signInWithGoogle } from '@/lib/actions/auth'

const DEMO_EMAIL = 'demo@researchflow.app'
const DEMO_PASSWORD = 'demo123456'

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

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const result = await signIn(formData)
    
    if (result?.error) {
      setError(result.error)
      setIsLoading(false)
    } else if (result?.redirectTo) {
      window.location.href = result.redirectTo
    }
  }

  async function handleDemoLogin() {
    setIsDemoLoading(true)
    setError(null)
    try {
      await fetch('/api/seed-demo', { method: 'POST' })
      const formData = new FormData()
      formData.append('email', DEMO_EMAIL)
      formData.append('password', DEMO_PASSWORD)
      const result = await signIn(formData)
      if (result?.error) {
        setError(result.error)
        setIsDemoLoading(false)
      } else if (result?.redirectTo) {
        window.location.href = result.redirectTo
      }
    } catch {
      setError('Failed to load demo account.')
      setIsDemoLoading(false)
    }
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(139,92,246,0.25)',
    color: '#F3F0FF',
    borderRadius: '8px',
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#05010F' }}>
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.12),transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative animate-fade-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={40} height={40} className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </Link>
        </div>

        {/* Card */}
        <div className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
          <h1 className="text-2xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.02em' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: '#7C6A9C' }}>Enter your credentials to access your account</p>

          {error && (
            <Alert variant="destructive" className="mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: '#7C6A9C' }}>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                <Input ref={emailRef} id="email" name="email" type="email" placeholder="you@university.edu" required className="pl-10" style={inputStyle} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium" style={{ color: '#7C6A9C' }}>Password</Label>
                <Link href="/auth/forgot-password" className="text-xs" style={{ color: '#A855F7' }}>Forgot password?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#7C6A9C' }} />
                <Input ref={passwordRef} id="password" name="password" type="password" placeholder="Enter your password" required className="pl-10" style={inputStyle} />
              </div>
            </div>

            <Button type="submit" className="w-full h-10" disabled={isLoading || isGoogleLoading || isDemoLoading}
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none', borderRadius: '8px', color: '#F3F0FF' }}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : 'Sign in'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full" style={{ borderTop: '1px solid rgba(139,92,246,0.2)' }} />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 text-xs" style={{ background: 'rgba(255,255,255,0)', color: '#7C6A9C', letterSpacing: '0.1em' }}>Or continue with</span>
            </div>
          </div>

          {/* Google */}
          <form onSubmit={async (e) => {
            e.preventDefault()
            setIsGoogleLoading(true)
            setError(null)
            const result = await signInWithGoogle()
            if (result?.error) {
              setError(result.error)
              setIsGoogleLoading(false)
            } else if (result?.url) {
              window.location.href = result.url
            }
          }} className="mb-3">
            <Button type="submit" variant="outline" className="w-full h-10" disabled={isLoading || isGoogleLoading || isDemoLoading}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', borderRadius: '8px' }}>
              {isGoogleLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connecting...</> : <><GoogleIcon className="mr-2 h-4 w-4" />Continue with Google</>}
            </Button>
          </form>

          {/* Demo */}
          <Button type="button" variant="outline" className="w-full h-10" onClick={handleDemoLogin}
            disabled={isLoading || isGoogleLoading || isDemoLoading}
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(168,85,247,0.25)', color: '#C084FC', borderRadius: '8px' }}>
            {isDemoLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading demo...</> : <><Play className="mr-2 h-4 w-4" />Try Demo Account</>}
          </Button>

          <p className="text-xs text-center mt-3" style={{ color: '#7C6A9C' }}>
            Demo: demo@researchflow.app / demo123456
          </p>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: '#7C6A9C' }}>
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="font-medium" style={{ color: '#A855F7' }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
