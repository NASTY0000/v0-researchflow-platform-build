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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Protected routes - require authentication
  const protectedRoutes = [
    '/dashboard',
    '/onboarding', 
    '/projects',
    '/ideas',
    '/mentors',
    '/marketplace',
    '/messages',
    '/settings',
  ]
  const isProtectedRoute = protectedRoutes.some(
    route => pathname.startsWith(route)
  )

  // Auth routes - redirect to dashboard if already logged in
  const authRoutes = ['/auth/login', '/auth/signup']
  const isAuthRoute = authRoutes.some(
    route => pathname === route
  )

  // Not logged in trying to access protected route
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Already logged in trying to access auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // DO NOT add any onboarding checks here.
  // Onboarding redirect is handled inside
  // app/(dashboard)/layout.tsx only.

  return supabaseResponse
}
