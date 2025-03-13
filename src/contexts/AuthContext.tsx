'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  error: null,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabaseClient = getSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabaseClient) {
      setError('Failed to initialize Supabase client');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const initializeAuth = async () => {
      try {
        // Get the initial session
        const { data: { session: initialSession }, error } = await supabaseClient.auth.getSession();
        if (error) throw error;

        if (mounted) {
          if (initialSession?.user) {
            setSession(initialSession);
            setUser(initialSession.user);
            
            // Check if user is admin
            const { data: profile, error: profileError } = await supabaseClient
              .from('profiles')
              .select('is_admin')
              .eq('id', initialSession.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile:', profileError);
            } else {
              setIsAdmin(!!profile?.is_admin);
            }
          } else {
            // Clear state if no session
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'An error occurred during authentication');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setIsAdmin(false);
          setError(null);

          if (currentSession?.user) {
            try {
              const { data: profile, error: profileError } = await supabaseClient
                .from('profiles')
                .select('is_admin')
                .eq('id', currentSession.user.id)
                .single();
              
              if (profileError) {
                console.error('Error fetching profile:', profileError);
              } else if (mounted) {
                setIsAdmin(!!profile?.is_admin);
              }
            } catch (error) {
              console.error('Error checking admin status:', error);
            }
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    if (!supabaseClient) {
      setError('Failed to initialize Supabase client');
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
      
      // Clear state
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      setError(null);
      
      // Redirect to sign-in page after sign-out
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during sign out');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, error, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 