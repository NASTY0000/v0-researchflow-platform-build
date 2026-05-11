import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch profile and universities
  const [profileResult, universitiesResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('universities').select('*').order('name'),
  ])

  const profile = profileResult.data
  const universities = universitiesResult.data || []

  // If onboarding is already completed, redirect to dashboard
  if (profile?.onboarding_completed) {
    redirect('/dashboard')
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
