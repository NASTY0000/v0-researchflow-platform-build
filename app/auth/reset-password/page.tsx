'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md relative animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src="/icon.svg" alt="ResearchFlow" width={40} height={40} className="w-10 h-10" />
            </div>
            <span className="text-2xl font-bold font-heading gradient-text-cyan">ResearchFlow</span>
          </Link>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border backdrop-blur-xl">
          <h1 className="text-2xl font-bold font-heading mb-1" style={{ letterSpacing: '-0.02em' }}>
            Set New Password
          </h1>
          <p className="text-sm mb-6 text-muted-foreground">Enter your new password below</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                placeholder="At least 8 characters"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                placeholder="Repeat password"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-medium text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#7C3AED,#A855F7)', boxShadow: '0 0 20px rgba(124,58,237,0.35)', border: 'none' }}
            >
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
