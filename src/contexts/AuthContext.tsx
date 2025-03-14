'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  checkAdminStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  error: null,
  signOut: async () => {},
  checkAdminStatus: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializingRef = useRef(false);
  const supabaseClient = getSupabaseBrowserClient();
  const router = useRouter();

  const checkAdminStatus = async () => {
    if (!user) return false;
    
    try {
      const { data: profile, error: profileError } = await supabaseClient
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return false;
      }
      
      const isAdminUser = !!profile?.is_admin;
      setIsAdmin(isAdminUser);
      return isAdminUser;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;
    
    console.log('AuthProvider mounted');
    
    if (!supabaseClient) {
      console.error('Failed to initialize Supabase client');
      setError('Failed to initialize Supabase client');
      setIsLoading(false);
      return;
    }

    let mounted = true;
    const initializeAuth = async () => {
      try {
        console.log('Initializing auth...');
        // Get the initial session
        const { data: { session: initialSession }, error } = await supabaseClient.auth.getSession();
        
        console.log('Initial session result:', {
          hasSession: !!initialSession,
          hasError: !!error,
          userId: initialSession?.user?.id
        });

        if (error) throw error;

        if (mounted) {
          if (initialSession?.user) {
            console.log('Setting initial user and session');
            setSession(initialSession);
            setUser(initialSession.user);
          } else {
            console.log('No initial session, clearing state');
            setSession(null);
            setUser(null);
            setIsAdmin(false);
          }
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setError(error instanceof Error ? error.message : 'An error occurred during authentication');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', { 
          event, 
          userId: currentSession?.user?.id,
          hasSession: !!currentSession,
          mounted
        });
        
        if (mounted) {
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
          setError(null);
          
          if (!currentSession?.user) {
            setIsAdmin(false);
          }
        }
      }
    );

    return () => {
      console.log('AuthProvider unmounting');
      mounted = false;
      subscription.unsubscribe();
      initializingRef.current = false;
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
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, error, signOut, checkAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 