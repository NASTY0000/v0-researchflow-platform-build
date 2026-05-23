'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import type { Profile, University } from '@/lib/types/database'

export default function OnboardingPage() {
  const router = useRouter()
  const [sessionReady, setSessionReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()

        // First confirm a session exists (fast, reads from cookie)
        const { data: { session } } = await supabase.auth.getSession()

        // Then verify it's valid server-side
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError) {
          setPageError('Auth error: ' + authError.message)
          return
        }

        if (authError || !user) {
          // For email signup flow, redirect to signup not login
          if (!session) {
            router.push('/auth/signup')
          } else {
            router.push('/auth/login')
          }
          return
        }

        setSessionReady(true)

        // Fetch profile and universities in parallel
        const [profileResult, universitiesResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('universities').select('*').order('name'),
        ])

        let fetchedProfile = profileResult.data

        if (fetchedProfile?.onboarding_completed) {
          router.push('/dashboard')
          return
        }

        // Google OAuth users may have no profile row yet — create one
        if (!fetchedProfile) {
          const { data: created, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email ?? '',
              full_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                '',
              avatar_url:
                user.user_metadata?.avatar_url ||
                user.user_metadata?.picture ||
                null,
              onboarding_completed: false,
              roles: ['student_researcher'],
              research_interests: [],
              skills: [],
              looking_for: [],
            })
            .select()
            .maybeSingle()

          if (insertError) {
            setPageError('Failed to create profile: ' + insertError.message)
            return
          }

          fetchedProfile = created
        }

        setProfile(fetchedProfile)
        setUniversities(universitiesResult.data || [])
        setLoading(false)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        console.error('Onboarding crash:', err)
        setPageError(message)
      }
    }

    init()
  }, [router])

  if (pageError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <h2 className="text-xl font-bold text-destructive">Something went wrong</h2>
          <p className="text-sm font-mono bg-muted text-muted-foreground p-3 rounded-lg text-left">
            {pageError}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!sessionReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 rounded-full animate-spin border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard initialProfile={profile} universities={universities} />
    </div>
  )
}
