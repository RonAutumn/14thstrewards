'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/db/schema';
import { env } from '@/env.mjs';

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables');
}

// Create a typed client for use in components
export const createTypedClientComponentClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
};

// Export a function to get the browser client
export const getSupabaseBrowserClient = () => {
  return createTypedClientComponentClient();
}; 