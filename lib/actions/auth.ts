'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { completeOnboardingWithAllSkills, onboardingComplete } from '@/lib/actions/akili'
import { generateMatchesOnOnboarding } from '@/lib/actions/matching'
import { checkRateLimit } from '@/lib/rate-limit'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const limit = await checkRateLimit(email, 'signup', 5, 3600)
  if (!limit.allowed) {
    return { error: 'Too many signup attempts. Please try again in an hour.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.user?.identities?.length === 0) {
    // Email exists in auth — check if they finished onboarding
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('onboarding_completed, id')
      .eq('email', email)
      .single()

    if (!existingProfile || !existingProfile.onboarding_completed) {
      // Incomplete registration — resend verification so they can continue
      await supabase.auth.resend({ type: 'signup', email })
      return {
        success: true,
        email,
        requiresVerification: true,
        message: "We've resent your verification email. Please check your inbox.",
      }
    }

    return { error: 'An account with this email already exists. Please sign in instead.' }
  }

  if (data?.session && data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: fullName,
      email: email,
      onboarding_completed: false,
      onboarding_step: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })

    revalidatePath('/', 'layout')
    return { success: true, redirectTo: '/onboarding', showVerifyBanner: true }
  }

  return {
    success: true,
    email,
    requiresVerification: true,
    message: 'Verification code sent to your email',
  }
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (error) {
    return { error: error.message }
  }

  if (data?.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || '',
      onboarding_completed: false,
      onboarding_step: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/onboarding' }
}

export async function resendOtp(email: string) {
  const limit = await checkRateLimit(email, 'otp_resend', 3, 3600)
  if (!limit.allowed) {
    return { error: 'Too many resend attempts. Please wait before requesting another code.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true, message: 'Verification code resent' }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const limit = await checkRateLimit(email, 'signin', 10, 900)
  if (!limit.allowed) {
    return { error: 'Too many login attempts. Please wait 15 minutes before trying again.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')

  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.onboarding_completed) {
      return { success: true, redirectTo: '/onboarding' }
    }
  }

  return { success: true, redirectTo: '/dashboard' }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/' }
}

export async function signInWithGoogle() {
  const supabase = await createClient()

  const redirectUrl =
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message, url: null }
  }

  if (data.url) {
    return { url: data.url, error: null }
  }

  return { error: 'Failed to initiate Google sign-in', url: null }
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function updateProfile(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function completeOnboarding(data: Record<string, unknown>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      onboarding_completed: true,
      onboarding_step: 5,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')

  // Fire-and-forget: match generation and Akili points never block the redirect
  generateMatchesOnOnboarding(user.id).catch(() => {})
  onboardingComplete(user.id).catch(() => {})
  completeOnboardingWithAllSkills(user.id).catch(() => {})

  const roles = data.roles as string[] | undefined
  if (roles && roles.includes('mentor')) {
    return { success: true, redirectTo: '/mentor-verification' }
  }

  return { success: true, redirectTo: '/dashboard' }
}
