'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';

interface SupabaseContextType {
  supabase: SupabaseClient | null;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: null,
  isLoading: true,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeSupabase = async () => {
      try {
        const client = createClientComponentClient();
        
        // Try to restore session from storage
        const { data: { session }, error } = await client.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        } else if (session) {
          // Check if session is stale (older than 60 seconds)
          const isStale = session.expires_at &&
            new Date(session.expires_at * 1000).getTime() - Date.now() < 60000;

          if (isStale) {
            console.log('Session is stale, attempting refresh...');
            const { data: { session: refreshedSession }, error: refreshError } =
              await client.auth.refreshSession();

            if (!refreshError && refreshedSession) {
              await client.auth.setSession(refreshedSession);
            }
          } else {
            await client.auth.setSession(session);
          }
        }

        if (mounted) {
          setSupabase(client);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing Supabase client:', error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeSupabase();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase, isLoading }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 