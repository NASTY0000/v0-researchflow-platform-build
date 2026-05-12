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

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 1: STATIC/PUBLIC ASSETS — pass through immediately
  // ══════════════════════════════════════════════════════════════════════════
  if (
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public') ||
    pathname.startsWith('/api/auth')
  ) {
    return supabaseResponse
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 2: AUTH PAGES — if user is already logged in, redirect to dashboard
  // ══════════════════════════════════════════════════════════════════════════
  const authPages = ['/auth/login', '/auth/signup']
  if (authPages.includes(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = '' // Clear any ?redirect= params
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 3: PUBLIC ROUTES — pass through, no auth required
  // ══════════════════════════════════════════════════════════════════════════
  const publicRoutes = [
    '/',
    '/auth/callback',
    '/auth/confirm',
    '/auth/error',
    '/forgot-password',
    '/reset-password',
  ]
  if (publicRoutes.includes(pathname) || authPages.includes(pathname)) {
    return supabaseResponse
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 4: PROTECTED ROUTES — if no user, redirect to login
  // ══════════════════════════════════════════════════════════════════════════
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // Don't add redirect param to avoid loops
    const res = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c))
    return res
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STEP 5: USER IS AUTHENTICATED — let the page handle onboarding check
  // DO NOT check onboarding in middleware. Let dashboard/page handle it.
  // ══════════════════════════════════════════════════════════════════════════
  return supabaseResponse
}
