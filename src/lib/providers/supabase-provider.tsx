"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface SupabaseContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

const SupabaseContext = createContext<SupabaseContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
});

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    let mounted = true;
    const supabase = createClient();

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) {
          console.error("Session error:", error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (session?.user) {
          // Check if user is admin
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("is_admin")
              .eq("id", session.user.id)
              .single();

            if (mounted) {
              setUser(session.user);
              setIsAdmin(!!profile?.is_admin);
              setIsLoading(false);
            }
          } catch (profileError) {
            console.error("Error fetching profile:", profileError);
            if (mounted) {
              setUser(session.user);
              setIsAdmin(false);
              setIsLoading(false);
            }
          }
        } else {
          if (mounted) {
            setUser(null);
            setIsAdmin(false);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", session.user.id)
            .single();

          if (mounted) {
            setUser(session.user);
            setIsAdmin(!!profile?.is_admin);
          }
        } catch (profileError) {
          console.error("Error fetching profile on auth change:", profileError);
          if (mounted) {
            setUser(session.user);
            setIsAdmin(false);
          }
        }
      } else {
        if (mounted) {
          setUser(null);
          setIsAdmin(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isMounted]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return null;
  }

  return (
    <SupabaseContext.Provider value={{ user, isLoading, isAdmin }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};
