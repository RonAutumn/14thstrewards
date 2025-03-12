import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSideAuth } from "@/lib/auth/server-auth";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = {
  title: 'Admin Dashboard | Heaven High NYC',
  description: 'Admin dashboard for Heaven High NYC',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getServerSideAuth();

  // Redirect if not authenticated or not admin
  if (!auth.user || !auth.isAdmin) {
    redirect('/auth/signin?returnTo=/admin');
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
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
