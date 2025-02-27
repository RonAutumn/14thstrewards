'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// Types
export interface AuthSession {
  user: {
    id: string;
    isAdmin: boolean;
    email?: string;
  } | null;
}

// Client-side auth utilities
export const clientAuth = {
  getSupabase() {
    return getSupabaseBrowserClient();
  },
  
  async getSession() {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error getting session:', error);
      return { data: { session: null }, error };
    }
  },

  async checkAdminStatus(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return profile?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  async signInWithGoogle() {
    try {
      const supabase = getSupabaseBrowserClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const callbackUrl = `${origin}/auth/callback`;
      
      console.log('Signing in with Google...');
      console.log('Callback URL:', callbackUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('OAuth error:', error);
        throw error;
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  },

  async signOut() {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }
};