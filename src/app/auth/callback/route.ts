import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const cookieStore = cookies()
  
  if (code) {
    try {
      const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
      
      // Exchange the code for a session
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error during code exchange:', error)
        throw error
      }

      // Check for existing profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      // Create profile if it doesn't exist
      if (!profile) {
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

      // Get the returnTo URL from state or query params
      let returnTo = requestUrl.searchParams.get('returnTo')
      
      if (!returnTo) {
        try {
          const state = requestUrl.searchParams.get('state')
          if (state) {
            const stateData = JSON.parse(state)
            returnTo = stateData.returnTo
          }
        } catch (e) {
          console.error('Error parsing state:', e)
        }
      }
      
      // Default to /rewards if no returnTo is specified
      const redirectUrl = returnTo 
        ? decodeURIComponent(returnTo)
        : '/rewards'

      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin))
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=callback_error', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
} 