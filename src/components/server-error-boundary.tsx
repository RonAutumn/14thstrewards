'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ServerErrorBoundary({ children, fallback }: Props) {
  const [hasError, setHasError] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to mark when component is mounted on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // If we're still on the server, render children without any wrapping
  // This prevents hydration mismatches
  if (!isClient) {
    return <>{children}</>;
  }

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">Server Error</h2>
          <p className="text-muted-foreground mb-6">
            There was an error loading the page content. This might be due to a temporary server issue.
          </p>
          <Button
            onClick={() => {
              setHasError(false);
              window.location.reload();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    console.error('Server Error Boundary caught error:', error);
    setHasError(true);
    return null;
  }
}

// Default error fallback component
export function DefaultErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="max-w-md text-center space-y-4">
        <div className="flex justify-center">
          <AlertCircle className="h-12 w-12 text-yellow-500" />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-foreground">Loading Error</h2>
        <p className="text-muted-foreground mb-6">
          There was an error loading the application. Please try refreshing the page.
        </p>
        <Button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Page
        </Button>
      </div>
    </div>
  );
} 