import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile and universities in parallel
  const [profileResult, universitiesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('universities').select('*').order('name'),
  ])

  let profile = profileResult.data
  const universities = universitiesResult.data || []

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect('/dashboard')
  }

  // Google OAuth users may not have a profile row yet — create one
  if (!profile) {
    const { data: created } = await supabase
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle()

    profile = created
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard
        initialProfile={profile}
        universities={universities}
      />
    </div>
  )
}
