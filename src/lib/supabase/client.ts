'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Create a singleton instance
let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Export a function to get the browser client
export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      throw new Error('Missing required Supabase environment variables');
    }
    
    browserClient = createClientComponentClient<Database>({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-auth-token',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined
        },
        global: {
          headers: {
            'X-Client-Info': 'supabase-js-client'
          }
        }
      }
    });
  }
  return browserClient;
};

// For consistency, alias the function
export const createClient = getSupabaseBrowserClient;

// For server-side usage
export const createServerClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createRouteHandlerClient<Database>({ cookies: () => cookieStore });
};