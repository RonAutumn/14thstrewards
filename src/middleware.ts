import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.delete({
            name,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()

  // Get the pathname
  const pathname = request.nextUrl.pathname

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // If no session or user, redirect to admin login
    if (!session?.user) {
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    try {
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (profileError || !profile?.is_admin) {
        // If not an admin, redirect to home with a message
        const redirectUrl = new URL('/', request.url)
        redirectUrl.searchParams.set('error', 'unauthorized')
        return NextResponse.redirect(redirectUrl)
      }

      // Set shorter session timeout for admin routes
      response.cookies.set('session-expires', new Date(Date.now() + 30 * 60 * 1000).toISOString(), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 60 // 30 minutes
      })
    } catch (error) {
      console.error('Error in admin middleware:', error)
      const redirectUrl = new URL('/admin/login', request.url)
      redirectUrl.searchParams.set('error', 'unexpected')
      return NextResponse.redirect(redirectUrl)
    }
  }

  // Handle protected routes
  if (pathname.startsWith('/rewards') || pathname.startsWith('/profile')) {
    if (!session?.user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Set regular session timeout
    response.cookies.set('session-expires', new Date(Date.now() + 60 * 60 * 1000).toISOString(), {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 // 1 hour
    })
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/rewards/:path*',
    '/profile/:path*',
    '/api/rewards/:path*'
  ]
}