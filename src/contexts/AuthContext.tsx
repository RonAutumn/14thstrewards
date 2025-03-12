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
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  isAdmin: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          
          // Check if user is admin
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', initialSession.user.id)
            .single();
          
          setIsAdmin(!!profile?.is_admin);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state changed:', event);
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsAdmin(false);

        if (currentSession?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', currentSession.user.id)
            .single();
          
          setIsAdmin(!!profile?.is_admin);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to sign-in page after sign-out
      router.push('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext); 