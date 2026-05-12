import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: Do not add any code between createServerClient and getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ── PUBLIC ROUTES: never redirect, pass through immediately ──────────────
  const publicRoutes = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/callback',
    '/auth/confirm',
    '/auth/error',
    '/forgot-password',
    '/reset-password',
  ]
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith('/api/auth'),
  )
  if (isPublicRoute) {
    // If authenticated user hits a login/signup page, send to dashboard once
    if (user && (pathname === '/auth/login' || pathname === '/auth/signup')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      const res = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
      return res
    }
    return supabaseResponse
  }

  // ── PROTECTED ROUTES ─────────────────────────────────────────────────────
  const protectedPrefixes = [
    '/dashboard',
    '/onboarding',
    '/projects',
    '/ideas',
    '/matches',
    '/mentors',
    '/marketplace',
    '/messages',
    '/settings',
    '/profile',
    '/showcase',
    '/admin',
    '/mentor-verification',
  ]
  const isProtectedRoute = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  )

  // Unauthenticated → login (once, login is public so no loop)
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  // Authenticated on a protected route — check onboarding once
  if (user && isProtectedRoute) {
    const isOnOnboarding = pathname.startsWith('/onboarding')

    // Only query the DB when NOT already on /onboarding to avoid extra round-trips
    if (!isOnOnboarding) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      // Profile missing or onboarding incomplete → send to /onboarding (once)
      if (!profile || !profile.onboarding_completed) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        const res = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
        return res
      }
    }

    // Already on /onboarding but onboarding IS complete → send to /dashboard (once)
    if (isOnOnboarding) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      if (profile?.onboarding_completed) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        const res = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
        return res
      }
    }
  }

  return supabaseResponse
}
