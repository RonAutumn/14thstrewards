import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/types/supabase';

export async function middleware(request: NextRequest) {
  // Create a response object that we'll modify and return
  const res = NextResponse.next();
  
  // Store the current URL in a cookie for reference in server components
  res.cookies.set('next-url', request.url, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 5 // 5 minutes
  });
  
  // Create a Supabase client specifically for this middleware request
  const supabase = createMiddlewareClient<Database>({ 
    req: request, 
    res 
  });

  // Get current pathname
  const pathname = request.nextUrl.pathname;

  // Check for redirect loop by looking at the referer and cookies
  const referer = request.headers.get('referer') || '';
  const redirectAttempts = parseInt(request.cookies.get('redirect_attempts')?.value || '0');
  const isRedirectLoop = (
    (referer.includes('/admin/login') && pathname.startsWith('/admin') && !pathname.includes('/login')) ||
    redirectAttempts > 3
  );
  
  // Skip middleware for public routes, static files, and potential redirect loops
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/login' ||
    pathname === '/admin/login' ||
    pathname.startsWith('/images') ||  // Skip images
    pathname.includes('.') || // Skip files with extensions
    isRedirectLoop // Skip if we detect a potential redirect loop
  ) {
    // Reset redirect attempts if we're not in a potential loop
    if (!isRedirectLoop && redirectAttempts > 0) {
      res.cookies.set('redirect_attempts', '0', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
    }
    return res;
  }

  // Get user session using getSession() to ensure latest session state
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('Session error in middleware:', sessionError);
    // If there's a session error and we're on an admin route, redirect to login
    if (pathname.startsWith('/admin')) {
      // Increment redirect attempts
      res.cookies.set('redirect_attempts', (redirectAttempts + 1).toString(), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
      
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return res;
  }

  const user = session?.user;

  // Handle admin routes
  if (pathname.startsWith('/admin')) {
    // If no session or user, redirect to admin login
    if (!session || !user) {
      console.log('No session or user for admin route, redirecting to login');
      
      // Increment redirect attempts
      res.cookies.set('redirect_attempts', (redirectAttempts + 1).toString(), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
      
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    try {
      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        // Redirect to admin login on error
        
        // Increment redirect attempts
        res.cookies.set('redirect_attempts', (redirectAttempts + 1).toString(), {
          path: '/',
          httpOnly: true,
          sameSite: 'lax',
          maxAge: 60 * 5 // 5 minutes
        });
        
        const redirectUrl = new URL('/admin/login', request.url);
        redirectUrl.searchParams.set('redirectTo', pathname);
        redirectUrl.searchParams.set('error', 'profile_error');
        return NextResponse.redirect(redirectUrl);
      }

      if (!profile?.is_admin) {
        console.log('User is not an admin, redirecting to home');
        // If not an admin, redirect to home with a message
        const redirectUrl = new URL('/', request.url);
        redirectUrl.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(redirectUrl);
      }

      // User is authenticated and is an admin, proceed
      console.log('Admin authenticated successfully');
      
      // Set a cookie to indicate admin status
      res.cookies.set('admin_authenticated', 'true', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 // 24 hours
      });
      
      // Reset redirect attempts
      res.cookies.set('redirect_attempts', '0', {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
      
      return res;
    } catch (error) {
      console.error('Unexpected error in admin middleware:', error);
      // Redirect to admin login on unexpected error
      
      // Increment redirect attempts
      res.cookies.set('redirect_attempts', (redirectAttempts + 1).toString(), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 5 // 5 minutes
      });
      
      const redirectUrl = new URL('/admin/login', request.url);
      redirectUrl.searchParams.set('redirectTo', pathname);
      redirectUrl.searchParams.set('error', 'unexpected');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Handle referral code if present
  if (user?.user_metadata?.referral_code) {
    const referralCode = user.user_metadata.referral_code;

    const { data: referrer } = await supabase
      .from('profiles')
      .select('id')
      .eq('referral_code', referralCode)
      .single();

    if (referrer) {
      await supabase.from('referrals').insert({
        referrer_id: referrer.id,
        referred_id: user.id,
        status: 'pending',
        points_awarded: false,
        created_at: new Date().toISOString()
      });

      await supabase.auth.updateUser({
        data: { referral_code: null }
      });
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}