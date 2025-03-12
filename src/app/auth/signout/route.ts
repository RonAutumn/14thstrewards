import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
  
  // Check if we have a user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.auth.signOut()
  }
  
  // Clear any redirect cookies
  const response = NextResponse.redirect(new URL('/auth/signin', request.url))
  response.cookies.delete('redirectAfterAuth')
  
  return response
} 