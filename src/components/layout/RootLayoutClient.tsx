'use client'

import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import { type ReactNode } from 'react'
import { ServerErrorBoundary } from '@/components/server-error-boundary'

interface RootLayoutClientProps {
  children: ReactNode
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  return (
    <Providers>
      <ServerErrorBoundary>
        <div className="min-h-screen antialiased flex flex-col">
          <main className="container mx-auto px-4 py-4 flex-grow">
            {children}
          </main>
          <Toaster />
        </div>
      </ServerErrorBoundary>
    </Providers>
  )
}