import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

async function getServerSideAuth() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      return {
        isAuthenticated: false,
        isAdmin: false,
        error: sessionError.message,
      };
    }

    if (!session?.user) {
      // Not authenticated, redirect to login
      // Don't redirect if already on the login page to avoid loops
      const currentPath = new URL(
        cookieStore.get("next-url")?.value || "/",
        "http://localhost"
      ).pathname;
      if (currentPath !== "/admin/login") {
        redirect("/admin/login");
      }
      return { isAuthenticated: false, isAdmin: false };
    }

    // Check if user is admin
    try {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
        return {
          isAuthenticated: true,
          isAdmin: false,
          error: profileError.message,
        };
      }

      if (!profile?.is_admin) {
        // User is not an admin, redirect to store
        redirect("/");
      }

      return { isAuthenticated: true, isAdmin: true };
    } catch (error) {
      console.error("Error checking admin status:", error);
      return {
        isAuthenticated: true,
        isAdmin: false,
        error: "Failed to verify admin status",
      };
    }
  } catch (error) {
    console.error("Unexpected error in getServerSideAuth:", error);
    return {
      isAuthenticated: false,
      isAdmin: false,
      error: "Unexpected authentication error",
    };
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerSideAuth();

  // If there was an error or user is not authenticated and not on login page, show error
  if (auth.error && !auth.isAuthenticated) {
    const currentPath = new URL(
      cookies().get("next-url")?.value || "/",
      "http://localhost"
    ).pathname;
    if (currentPath !== "/admin/login") {
      redirect("/admin/login");
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {auth.isAuthenticated && auth.isAdmin && (
        <div className="w-64 border-r border-border bg-card p-4">
          <h2 className="mb-4 text-xl font-semibold text-primary">
            Admin Dashboard
          </h2>
          <Separator className="mb-4" />
          <nav className="space-y-2">
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin">Dashboard</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin/delivery">Delivery Management</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin/shipping">Shipping Management</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin/pickup">Pickup Management</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin/store-management">Store Management</a>
            </Button>
            <Button variant="ghost" className="w-full justify-start" asChild>
              <a href="/admin/rewards">Rewards Management</a>
            </Button>
          </nav>
        </div>
      )}
      <div className="flex-1 overflow-auto p-6">
        <Suspense
          fallback={
            <div className="flex h-screen items-center justify-center">
              <LoadingSpinner size="large" />
            </div>
          }
        >
          {children}
        </Suspense>
      </div>
    </div>
  );
}
