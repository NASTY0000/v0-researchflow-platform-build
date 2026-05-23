import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/auth/signup?error=invalid_link`)
  }

  try {
    const supabase = await createClient()

    const { error: verifyError } = await supabase.auth.verifyOtp({
      type: type as Parameters<typeof supabase.auth.verifyOtp>[0]['type'],
      token_hash,
    })

    if (verifyError) {
      console.error('OTP verify error:', verifyError.message)
      return NextResponse.redirect(`${origin}/auth/signup?error=invalid_code`)
    }

    // For password recovery, redirect to reset page
    if (type === 'recovery') {
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    // Get the session established by verifyOtp
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.error('Session error after verify:', sessionError?.message)
      return NextResponse.redirect(`${origin}/auth/signup?error=session_failed`)
    }

    const { id: userId, email: userEmail, user_metadata } = session.user

    // Ensure profile row exists before redirecting to onboarding
    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: userId,
        email: userEmail ?? '',
        full_name: user_metadata?.full_name || '',
        avatar_url: user_metadata?.avatar_url || null,
        onboarding_completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id', ignoreDuplicates: false }
    )

    if (profileError) {
      // Non-fatal: profile may already exist with more data
      console.error('Profile upsert error:', profileError.message)
    }

    // Brief pause so the session cookie propagates to the browser before the redirect
    await new Promise(r => setTimeout(r, 500))

    return NextResponse.redirect(`${origin}/onboarding`)
  } catch (err: unknown) {
    console.error('Auth confirm error:', err)
    return NextResponse.redirect(`${origin}/auth/signup?error=unexpected`)
  }
}
