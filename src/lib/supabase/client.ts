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
    browserClient = createClientComponentClient<Database>({
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
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