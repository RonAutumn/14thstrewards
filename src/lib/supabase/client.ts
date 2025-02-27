'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { type Database } from '@/types/supabase';

// Create a function to get a new client instance (for admin functionality)
export const createClient = () => {
  return createClientComponentClient<Database>();
};

// Create a typed client for use in components (for existing functionality)
export const createTypedClientComponentClient = () => {
  return createClientComponentClient<Database>({
    options: {
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
  });
};

// Export a function to get the browser client (for existing functionality)
export const getSupabaseBrowserClient = () => {
  return createTypedClientComponentClient();
};