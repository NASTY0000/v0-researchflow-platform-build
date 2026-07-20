'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
      setIsLoading(false)
    } else {
      setSent(true)
      setIsLoading(false)
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
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.18),transparent 70%)' }} />
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full" style={{ background: 'radial-gradient(ellipse,rgba(168,85,247,0.12),transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex justify-center">
            <Logo variant="full" width={120} />
          </Link>
        </div>

        <div className="p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(139,92,246,0.2)', backdropFilter: 'blur(16px)' }}>
          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#22C55E' }} />
              </div>
              <h1 className="text-2xl font-bold font-heading mb-2">Check your email</h1>
              <p className="text-sm mb-6 text-muted-foreground">
                We sent a password reset link to <span style={{ color: '#C084FC' }}>{email}</span>
              </p>
              <Button asChild variant="outline" className="w-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(139,92,246,0.25)', color: '#F3F0FF', borderRadius: '8px' }}>
                <Link href="/auth/login">Back to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.02em' }}>Reset your password</h1>
              <p className="text-sm mb-6 text-muted-foreground">Enter your email and we&apos;ll send you a reset link</p>

              {error && (
                <Alert variant="destructive" className="mb-5" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@university.edu"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-10" disabled={isLoading}
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none', borderRadius: '8px', color: '#F3F0FF' }}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Send reset link'}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          <Link href="/auth/login" className="inline-flex items-center gap-1 font-medium" style={{ color: '#A855F7' }}>
            <ArrowLeft className="w-3 h-3" /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
