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

  const protectedRoutes = [
    '/dashboard',
    '/projects',
    '/ideas',
    '/mentors',
    '/marketplace',
    '/messages',
    '/settings',
    '/mentor-verification',
    '/admin',
    '/profile',
    '/matches',
    '/notifications',
    '/network',
    '/saved',
    '/assistant',
    '/grants',
    '/forums',
    '/challenges',
    '/publications',
  ]

  const isProtectedRoute = protectedRoutes.some(
    route => pathname.startsWith(route)
  )

  const authRoutes = ['/auth/login', '/auth/signup']
  const isAuthRoute = authRoutes.some(
    route => pathname === route
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Admin route protection — check admin role in DB
  if (pathname.startsWith('/admin') && user) {
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('roles, is_admin')
      .eq('id', user.id)
      .single()

    const isAdmin = adminProfile?.is_admin === true || adminProfile?.roles?.includes('admin')
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }


  return supabaseResponse
}
