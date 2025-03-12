'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null

export const createClient = () => {
  if (!browserClient) {
    browserClient = createClientComponentClient<Database>({
      options: {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        },
        cookies: {
          name: 'sb-auth',
          lifetime: 7 * 24 * 60 * 60, // 7 days
          domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production'
        }
      }
    })
  }
  return browserClient
}

// For server-side usage
export const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore })
}

// Create a typed client for use in components (for existing functionality)
export const createTypedClientComponentClient = () => {
  return createClientComponentClient<Database>(
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      cookies: {
        name: 'sb-auth',
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: typeof window !== 'undefined' ? window.location.hostname : (process.env.NEXT_PUBLIC_SITE_DOMAIN || 'localhost'),
        path: '/',
        sameSite: 'lax'
      }
    }
  );
};

// Export a function to get the browser client (for existing functionality)
export const getSupabaseBrowserClient = () => {
  return createTypedClientComponentClient();
};