import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // No user — redirect to login
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

  // ══════════════════════════════════════════════════════════════════════════
  // If onboarding is already complete, send to dashboard
  // This is the ONLY redirect from /onboarding → /dashboard
  // ══════════════════════════════════════════════════════════════════════════
  if (profile?.onboarding_completed === true) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#05010F' }}>
      <OnboardingWizard 
        initialProfile={profile} 
        universities={universities}
      />
    </div>
  )
}
