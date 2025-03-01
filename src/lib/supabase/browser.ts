'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/db/schema';
import { env } from '@/env.mjs';

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a singleton instance
let browserClient: ReturnType<typeof createClientComponentClient<Database>> | null = null;

// Export a function to get the browser client
export const getSupabaseBrowserClient = () => {
  if (!browserClient) {
    browserClient = createClientComponentClient<Database>({
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        },
        cookies: {
          name: 'sb-auth',
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost',
          path: '/',
          sameSite: 'lax'
        }
      }
    });
  }
  return browserClient;
}; 