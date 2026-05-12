import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const next = searchParams.get('next')

  // Handle OAuth errors
  if (error) {
    const errorUrl = new URL('/auth/error', origin)
    errorUrl.searchParams.set('error', error)
    if (errorDescription) {
      errorUrl.searchParams.set('error_description', errorDescription)
    }
    return NextResponse.redirect(errorUrl)
  }

  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      // Check if user has completed onboarding
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        // If profile doesn't exist or onboarding not completed, go to onboarding
        if (!profile || !profile.onboarding_completed) {
          // Ensure a profile row exists so completeOnboarding can upsert into it
          if (!profile) {
            await supabase.from('profiles').upsert(
              {
                id: user.id,
                email: user.email!,
                full_name: user.user_metadata?.full_name ?? null,
                avatar_url: user.user_metadata?.avatar_url ?? null,
                onboarding_completed: false,
                onboarding_step: 1,
              },
              { onConflict: 'id', ignoreDuplicates: true }
            )
          }
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      // User has completed onboarding, go to next or dashboard
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
