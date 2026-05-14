import { createClient } from '@/lib/supabase/server'
import { isProfileSuspended, SUSPENDED_LOGIN_MESSAGE } from '@/lib/supabase/admin'
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
          .select('onboarding_completed, account_status, suspended_until')
          .eq('id', user.id)
          .single()

        const p = profile as {
          onboarding_completed?: boolean
          account_status?: string
          suspended_until?: string | null
        } | null

        if (p && isProfileSuspended(p.account_status, p.suspended_until)) {
          await supabase.auth.signOut()
          const login = new URL('/auth/login', origin)
          login.searchParams.set('error', encodeURIComponent(SUSPENDED_LOGIN_MESSAGE))
          return NextResponse.redirect(login)
        }

        // If profile doesn't exist or onboarding not completed, go to onboarding
        if (!profile || !profile.onboarding_completed) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      
      // User has completed onboarding, go to next or dashboard
      return NextResponse.redirect(`${origin}${next || '/dashboard'}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
