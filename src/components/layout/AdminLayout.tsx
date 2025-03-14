'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, isLoading, isAdmin, checkAdminStatus } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      checkAdminStatus().then(isAdmin => {
        if (!isAdmin) {
          router.push('/')
        }
      })
    } else if (!isLoading && !user) {
      router.push('/auth/signin')
    }
  }, [user, isLoading, router, checkAdminStatus])

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return <>{children}</>
} 