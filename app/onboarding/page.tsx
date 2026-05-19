'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import type { Profile, University } from '@/lib/types/database'

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])

  useEffect(() => {
    async function init() {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        console.log('Onboarding init:', {
          userId: user?.id,
          authError: authError?.message,
        })

        if (!user) {
          router.push('/auth/login')
          return
        }

        // Fetch profile and universities in parallel
        const [profileResult, universitiesResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
          supabase.from('universities').select('*').order('name'),
        ])

        console.log('Existing profile:', profileResult.data, 'error:', profileResult.error?.message)

        let fetchedProfile = profileResult.data

        if (fetchedProfile?.onboarding_completed) {
          router.push('/dashboard')
          return
        }

        // Google OAuth users may not have a profile row yet — create one
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
            })
            .select()
            .maybeSingle()

          console.log('Profile insert error:', insertError?.message)

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
        const message = err instanceof Error ? err.message : 'Unknown error on onboarding page'
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
          <p className="text-muted-foreground text-sm font-mono bg-muted p-3 rounded-lg text-left">
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

  if (loading) {
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
