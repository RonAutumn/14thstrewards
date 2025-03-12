'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

export async function getServerSideAuth() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient<Database>({ cookies: () => cookieStore });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  if (!session) {
    return {
      user: null,
      isAdmin: false,
    };
  }
  
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();
  
  return {
    user: session.user,
    isAdmin: !!profile?.is_admin,
  };
} 