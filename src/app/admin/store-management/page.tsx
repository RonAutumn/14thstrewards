"use client";

import { useEffect, useState } from "react";
import { StoreManagement } from "@/components/admin/store-management";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { toast } from "sonner";
import type { User } from "@supabase/auth-helpers-nextjs";

export default function StoreManagementPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch("/api/admin/store");
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/login");
            return;
          }
          if (response.status === 403) {
            router.push("/");
            return;
          }
          throw new Error("Failed to fetch data");
        }

        const data = await response.json();
        setUser(data.user);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load store data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Store Management</h2>
      </div>
      <StoreManagement user={user} />
    </div>
  );
} 