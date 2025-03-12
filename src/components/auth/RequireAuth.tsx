"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSupabase } from "@/lib/providers/supabase-provider";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface RequireAuthProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function RequireAuth({ children, adminOnly = false }: RequireAuthProps) {
  const router = useRouter();
  const { user, isLoading, isAdmin } = useSupabase();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
        toast.error("Please sign in to continue");
        router.replace(`/login?redirectTo=${encodeURIComponent(currentPath)}`);
        return;
      }

      if (adminOnly && !isAdmin) {
        toast.error("You do not have permission to access this page");
        router.replace("/");
        return;
      }
    }
  }, [user, isLoading, isAdmin, adminOnly, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || (adminOnly && !isAdmin)) {
    return null;
  }

  return children;
}
