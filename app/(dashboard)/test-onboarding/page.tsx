'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestOnboarding() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      try {
        const supabase = createClient()
        const { data: { user: authUser }, error: authError } =
          await supabase.auth.getUser()

        console.log('Auth check:', {
          hasUser: !!authUser,
          authError: authError?.message
        })

        if (authError) {
          setError('Auth error: ' + authError.message)
          setLoading(false)
          return
        }

        if (!authUser) {
          setError('No user found - you are not logged in')
          setLoading(false)
          return
        }

        setUser(authUser)

        const { data: prof, error: profError } =
          await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .maybeSingle()

        console.log('Profile check:', {
          hasProfile: !!prof,
          profError: profError?.message
        })

        if (profError && profError.code !== 'PGRST116') {
          setError('Profile error: ' + profError.message)
        } else {
          setProfile(prof)
        }

        setLoading(false)
      } catch (err: any) {
        console.error('Exception:', err)
        setError('Exception: ' + err.message)
        setLoading(false)
      }
    }

    check()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'sans-serif'
      }}>
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '600px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'sans-serif'
    }}>
      <h1>Test Onboarding Page</h1>

      {error && (
        <div style={{
          background: '#fee',
          border: '1px solid #f00',
          color: '#f00',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>ERROR:</strong> {error}
        </div>
      )}

      {user && (
        <div style={{
          background: '#efe',
          border: '1px solid #0a0',
          color: '#0a0',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>✓ User Found:</strong> {user.email}
        </div>
      )}

      {profile && (
        <div style={{
          background: '#eef',
          border: '1px solid #00a',
          color: '#00a',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>✓ Profile Found:</strong> {profile.full_name || '(no name)'}
        </div>
      )}

      {!profile && !error && (
        <div style={{
          background: '#ffe',
          border: '1px solid #aa0',
          color: '#aa0',
          padding: '15px',
          borderRadius: '8px'
        }}>
          <strong>⚠ No profile found</strong>
          {' '}- this is OK, it will be created during onboarding
        </div>
      )}

      <hr style={{ margin: '20px 0' }} />

      <h2>Console Output</h2>
      <p>Check your browser&apos;s Developer Tools (F12)
        → Console tab to see detailed logs</p>
    </div>
  )
}
