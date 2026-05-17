import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } =
    new URL(request.url)

  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!token_hash || !type) {
    return NextResponse.redirect(
      `${origin}/auth/login?error=invalid_link`
    )
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    type: type as any,
    token_hash,
  })

  if (error) {
    console.error('Verification error:', error.message)
    return NextResponse.redirect(
      `${origin}/auth/login?error=link_expired`
    )
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}${next}`)
  }

  const { data: { user } } =
    await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile?.onboarding_completed) {
      return NextResponse.redirect(
        `${origin}/onboarding`
      )
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
