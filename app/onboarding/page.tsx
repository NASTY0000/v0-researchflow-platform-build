'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const [status, setStatus] = useState('Loading...')

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
          setStatus('Auth error: ' + error.message)
          return
        }

        if (!user) {
          setStatus('No user found')
          return
        }

        setStatus('User found: ' + user.email)
      } catch (e: unknown) {
        setStatus('Crash: ' + (e instanceof Error ? e.message : String(e)))
      }
    }
    check()
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      fontSize: 18,
      padding: 24,
      textAlign: 'center',
    }}>
      {status}
    </div>
  )
}
