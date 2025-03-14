'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ServerErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can log the error to an error reporting service here
    console.error('Server Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 bg-background">
          <div className="max-w-md text-center space-y-4">
            <div className="flex justify-center">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Something went wrong!</h2>
            <p className="text-muted-foreground mb-6">
              There was an error loading this content. This might be due to a temporary issue.
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.reload();
              }}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
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