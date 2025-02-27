"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/admin';
          router.push(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!profile?.is_admin) {
          toast.error("You do not have permission to access this page");
          router.push("/");
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        toast.error("Failed to verify admin status");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router]);

  return { isLoading, isAdmin };
} 
