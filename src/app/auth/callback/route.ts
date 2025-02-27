import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = cookies()
  
  console.log('Auth callback initiated', {
    url: request.url,
    hasCode: !!code,
    searchParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  if (code) {
    try {
      console.log('Creating server Supabase client...')
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

      console.log('Exchanging code for session...')
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error during code exchange:', {
          error,
          errorMessage: error.message,
          errorStatus: error.status,
          errorCode: error.code
        })
        throw error
      }

      if (!session) {
        console.error('No session returned after successful code exchange')
        throw new Error('No session')
      }

      console.log('Session obtained successfully', {
        userId: session.user.id,
        expiresAt: session.expires_at
      })

      // Check for existing profile
      console.log('Checking for existing profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
      }

      // Create profile if it doesn't exist
      if (!profile) {
        console.log('Creating new profile for user:', session.user.id)
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            is_admin: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }

      // Get the returnTo URL if it exists
      let returnTo = requestUrl.searchParams.get('returnTo');
      
      // Try to get returnTo from state if not in query params
      if (!returnTo) {
        const state = requestUrl.searchParams.get('state');
        if (state) {
          try {
            const stateData = JSON.parse(state);
            returnTo = stateData.returnTo;
          } catch (e) {
            console.error('Error parsing state:', e);
          }
        }
      }

      // Default to /rewards if no returnTo is specified
      const redirectUrl = returnTo 
        ? decodeURIComponent(returnTo)
        : '/rewards';

      console.log('Redirecting to:', {
        redirectUrl,
        returnTo,
        state: requestUrl.searchParams.get('state')
      });

      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
    } catch (error) {
      console.error('Callback error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      return NextResponse.redirect(new URL('/?error=auth_callback_error', requestUrl.origin))
    }
  }

  console.log('No auth code provided, redirecting to home')
  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 