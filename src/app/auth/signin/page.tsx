"use client";

import { UnifiedAuthForm } from "@/components/auth/UnifiedAuthForm";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSearchParams } from "next/navigation";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const returnTo = searchParams.get("returnTo");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Sign in to your account to access rewards and more
            </CardDescription>
            {error && (
              <div className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error === "callback_error"
                  ? "There was an error during authentication. Please try again."
                  : error}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <UnifiedAuthForm />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 