import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorCode = searchParams.get('error_code')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth errors and cancellations
  if (error || errorCode) {
    console.log('OAuth error:', { error, errorCode, errorDescription })
    return NextResponse.redirect(`${origin}/auth/login?cleared=true`)
  }

  if (code) {
    const supabase = await createClient()

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Exchange error:', exchangeError.message)
      return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}/dashboard`)
    }

    return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
  }

  return NextResponse.redirect(`${origin}/auth/login?cleared=true`)
}
