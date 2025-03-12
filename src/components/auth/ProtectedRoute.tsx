'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  adminOnly = false,
  redirectTo = '/auth/signin'
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Store the current path for redirection after login
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          sessionStorage.setItem('redirectAfterAuth', currentPath);
        }
        router.push(redirectTo);
        return;
      }

      if (adminOnly && !isAdmin) {
        router.push('/');
        return;
      }
    }
  }, [user, isLoading, isAdmin, adminOnly, router, redirectTo]);

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

  return <>{children}</>;
} 