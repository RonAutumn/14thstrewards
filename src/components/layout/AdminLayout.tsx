'use client'

import { useAdminAuth } from '@/hooks/useAdminAuth'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isLoading, isAdmin } = useAdminAuth()

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
} 