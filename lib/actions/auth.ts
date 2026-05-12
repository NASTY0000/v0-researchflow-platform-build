'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

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

  // Check if user was auto-confirmed (email confirmation disabled in Supabase)
  // or if the session exists (meaning they can proceed without OTP)
  if (data?.session) {
    // User is auto-confirmed, redirect to onboarding
    revalidatePath('/', 'layout')
    return { success: true, redirectTo: '/onboarding' }
  }

  // Check if user already exists
  if (data?.user?.identities?.length === 0) {
    return { error: 'An account with this email already exists. Please sign in instead.' }
  }

  return { success: true, email, requiresVerification: true, message: 'Verification code sent to your email' }
}

export async function verifyOtp(email: string, token: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, redirectTo: '/onboarding' }
}

export async function resendOtp(email: string) {
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

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  
  // Check if user needs to complete onboarding
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
    
    if (profile && !profile.onboarding_completed) {
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
  
  const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
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
    .select(`
      *,
      university:universities(*)
    `)
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
    .update(data)
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
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  
  // Check if user selected mentor role - redirect to verification
  const roles = data.roles as string[] | undefined
  if (roles && roles.includes('mentor')) {
    return { success: true, redirectTo: '/mentor-verification' }
  }
  
  return { success: true, redirectTo: '/dashboard' }
}
