import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PREFIXES = [
  '/admin',
  '/dashboard',
  '/onboarding',
  '/projects',
  '/ideas',
  '/mentors',
  '/marketplace',
  '/messages',
  '/settings',
  '/profile',
  '/matches',
  '/notifications',
  '/showcase',
  '/research-showcase',
  '/mentor-verification',
  '/network',
]

const AUTH_ROUTES = ['/auth/login', '/auth/signup']

function isProtectedPath(pathname: string) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

function isAuthPath(pathname: string) {
  return AUTH_ROUTES.some((route) => pathname === route)
}

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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  if (isProtectedPath(pathname) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthPath(pathname) && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (user && pathname.startsWith('/admin')) {
    const { data: profile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()

    if (adminProfileError) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    const isAdmin = profile && (profile as { is_admin?: boolean }).is_admin === true
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  if (user && isProtectedPath(pathname) && !pathname.startsWith('/onboarding')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed, account_status, suspended_until')
      .eq('id', user.id)
      .maybeSingle()

    if (!profileError && profile) {
      const p = profile as {
        onboarding_completed?: boolean
        account_status?: string
        suspended_until?: string | null
      }

      if (p.onboarding_completed === false) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return NextResponse.redirect(url)
      }

      if (p.account_status === 'suspended') {
        const until = p.suspended_until ? new Date(p.suspended_until) : null
        const permanent = !p.suspended_until
        const stillSuspended = permanent || (until !== null && until > new Date())
        if (stillSuspended) {
          await supabase.auth.signOut()
          const url = request.nextUrl.clone()
          url.pathname = '/auth/login'
          url.searchParams.set('suspended', '1')
          return NextResponse.redirect(url)
        }
      }
    }
  }

  return supabaseResponse
}
