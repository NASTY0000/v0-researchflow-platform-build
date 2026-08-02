'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/Logo'

export default function VerifiedPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Verifying your account...')
  const [needsBrowser, setNeedsBrowser] = useState(false)

  useEffect(() => {
    async function handleVerified() {
      const supabase = createClient()

      // Wait a moment for session to settle
      await new Promise(r => setTimeout(r, 1000))

      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        setStatus('Account verified! Setting up your profile...')

        await supabase.from('profiles').upsert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || '',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

        await new Promise(r => setTimeout(r, 500))
        router.push('/onboarding')
        return
      }

      // No session, try refreshing
      setStatus('Completing verification...')

      const { data: { session: refreshed } } = await supabase.auth.refreshSession()

      if (refreshed?.user) {
        setStatus('Account verified! Setting up your profile...')

        await supabase.from('profiles').upsert({
          id: refreshed.user.id,
          email: refreshed.user.email,
          full_name: refreshed.user.user_metadata?.full_name || '',
          onboarding_completed: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' })

        await new Promise(r => setTimeout(r, 500))
        router.push('/onboarding')
        return
      }

      // Still no session, in-app browser can't set cookies
      setStatus('Please open this link in your browser.')
      setNeedsBrowser(true)
    }

    handleVerified()
  }, [router])

  if (needsBrowser) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#05010F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'Arial, sans-serif',
      }}>
        <div style={{ maxWidth: '400px', textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: '#C084FC' }}>
            Open in your browser
          </h2>
          <p style={{ color: '#D4D4D8', fontSize: '15px', lineHeight: 1.7, marginBottom: '24px' }}>
            For security reasons, email verification must be completed in your main browser
            (Chrome, Safari, Firefox).
          </p>
          <p style={{ color: '#71717A', fontSize: '14px', lineHeight: 1.7, marginBottom: '32px' }}>
            Tap the three dots (⋮) or share button in your email app and select &quot;Open in browser&quot;
          </p>
          <a
            href="/auth/login"
            style={{
              display: 'inline-block',
              background: '#9333EA',
              color: 'white',
              padding: '14px 32px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '15px',
            }}
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05010F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ maxWidth: '400px', textAlign: 'center', color: 'white' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          border: '4px solid #9333EA',
          borderTopColor: 'transparent',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 24px',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <Logo variant="icon" width={48} />
        </div>
        <p style={{ color: '#D4D4D8', fontSize: '16px', lineHeight: 1.7 }}>
          {status}
        </p>
      </div>
    </div>
  )
}
