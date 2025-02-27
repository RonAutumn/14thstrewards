"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private getErrorMessage(error: Error): string {
    if (error.message.includes("Failed to fetch")) {
      return "Unable to connect to the server. Please check your internet connection and try again.";
    }

    if (error.message.includes("Network Error")) {
      return "A network error occurred. Please check your connection and try again.";
    }

    if (error.message.includes("Unauthorized")) {
      return "You are not authorized to access this resource. Please log in and try again.";
    }

    return "An unexpected error occurred. Please try again later.";
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Card className="w-full max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
            <CardDescription>
              {this.state.error && this.getErrorMessage(this.state.error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export function HydrationErrorBoundary({ children }: Props) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return null; // Return nothing during SSR
  }

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <div className="flex justify-center">
            <AlertCircle className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            Display Error
          </h2>
          <p className="text-muted-foreground mb-6">
            {errorMessage ||
              "There was an error displaying the page. This might be due to a temporary issue."}
          </p>
          <Button
            onClick={() => {
              setHasError(false);
              setErrorMessage("");
              window.location.reload();
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }

  try {
    return <>{children}</>;
  } catch (error) {
    setHasError(true);
    setErrorMessage(
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
    return null;
  }
}
